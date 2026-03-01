package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/seanchuatech/iam-sentinel/backend/internal/config"
	"github.com/seanchuatech/iam-sentinel/backend/internal/database"
	"github.com/seanchuatech/iam-sentinel/backend/internal/handlers"
	"github.com/seanchuatech/iam-sentinel/backend/internal/middleware"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

func main() {
	// Set up structured logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// Load .env file for local development (silently ignore if not present)
	_ = godotenv.Load()

	// Load configuration from environment
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Create root context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to PostgreSQL
	pgPool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		slog.Error("failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	// Run database migrations
	if err := database.RunMigrations(ctx, pgPool, "internal/database/migrations"); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	// Connect to Redis
	redisClient, err := database.NewRedisClient(ctx, cfg.Redis)
	if err != nil {
		slog.Error("failed to connect to Redis", "error", err)
		os.Exit(1)
	}
	defer redisClient.Close()

	// =========================================================================
	// Initialize repositories
	// =========================================================================
	userRepo := repository.NewUserRepository(pgPool)
	groupRepo := repository.NewGroupRepository(pgPool)
	roleRepo := repository.NewRoleRepository(pgPool)
	policyRepo := repository.NewPolicyRepository(pgPool)
	apiKeyRepo := repository.NewAPIKeyRepository(pgPool)
	auditRepo := repository.NewAuditRepository(pgPool)

	// =========================================================================
	// Initialize services
	// =========================================================================
	authService := service.NewAuthService(userRepo, cfg.JWT.Secret, cfg.JWT.AccessTokenTTL)
	userService := service.NewUserService(userRepo)
	groupService := service.NewGroupService(groupRepo)
	roleService := service.NewRoleService(roleRepo)
	policyService := service.NewPolicyService(policyRepo)
	simulatorService := service.NewSimulatorService(policyRepo)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo)
	auditService := service.NewAuditService(auditRepo)

	// =========================================================================
	// Initialize handlers
	// =========================================================================
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	groupHandler := handlers.NewGroupHandler(groupService)
	roleHandler := handlers.NewRoleHandler(roleService)
	policyHandler := handlers.NewPolicyHandler(policyService)
	simulatorHandler := handlers.NewSimulatorHandler(simulatorService)
	apiKeyHandler := handlers.NewAPIKeyHandler(apiKeyService)
	auditHandler := handlers.NewAuditHandler(auditService)

	// =========================================================================
	// Build router
	// =========================================================================
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.Timeout(30 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // Vite dev server
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Health check endpoints
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if err := pgPool.Ping(r.Context()); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprintf(w, `{"status":"not ready","error":"postgres: %s"}`, err.Error())
			return
		}

		if err := redisClient.Ping(r.Context()).Err(); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprintf(w, `{"status":"not ready","error":"redis: %s"}`, err.Error())
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ready"}`)
	})

	// =========================================================================
	// API routes
	// =========================================================================
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprint(w, `{"service":"sentinel","version":"0.1.0"}`)
		})

		// Public auth routes (no JWT required)
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)

		// Protected routes (JWT required)
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(authService))

			// Users
			r.Get("/users", userHandler.List)
			r.Get("/users/{id}", userHandler.Get)
			r.Put("/users/{id}", userHandler.Update)
			r.Delete("/users/{id}", userHandler.Delete)

			// Groups
			r.Post("/groups", groupHandler.Create)
			r.Get("/groups", groupHandler.List)
			r.Get("/groups/{id}", groupHandler.Get)
			r.Put("/groups/{id}", groupHandler.Update)
			r.Delete("/groups/{id}", groupHandler.Delete)
			r.Post("/groups/{id}/users", groupHandler.AddUser)
			r.Delete("/groups/{id}/users/{userId}", groupHandler.RemoveUser)
			r.Get("/groups/{id}/users", groupHandler.ListUsers)

			// Roles
			r.Post("/roles", roleHandler.Create)
			r.Get("/roles", roleHandler.List)
			r.Get("/roles/{id}", roleHandler.Get)
			r.Put("/roles/{id}", roleHandler.Update)
			r.Delete("/roles/{id}", roleHandler.Delete)
			r.Post("/roles/{id}/users", roleHandler.AssignUser)
			r.Delete("/roles/{id}/users/{userId}", roleHandler.UnassignUser)

			// Policies
			r.Post("/policies", policyHandler.Create)
			r.Get("/policies", policyHandler.List)
			r.Get("/policies/{id}", policyHandler.Get)
			r.Put("/policies/{id}", policyHandler.Update)
			r.Delete("/policies/{id}", policyHandler.Delete)
			r.Post("/policies/{id}/attach", policyHandler.Attach)
			r.Post("/policies/{id}/detach", policyHandler.Detach)

			// Policy Simulator
			r.Post("/simulate", simulatorHandler.Simulate)

			// API Keys
			r.Post("/api-keys", apiKeyHandler.Create)
			r.Get("/api-keys", apiKeyHandler.List)
			r.Delete("/api-keys/{id}", apiKeyHandler.Delete)

			// Audit Logs
			r.Get("/audit-logs", auditHandler.List)
		})
	})

	// =========================================================================
	// Start server
	// =========================================================================
	srv := &http.Server{
		Addr:         cfg.Server.Addr(),
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	go func() {
		slog.Info("starting server", "addr", cfg.Server.Addr())
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			cancel()
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped gracefully")
}
