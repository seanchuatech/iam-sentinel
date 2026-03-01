package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunMigrations applies all .sql migration files from the given directory
// in alphabetical order. It uses a simple tracking table to skip already-applied
// migrations (idempotent).
func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationsDir string) error {
	// Create migrations tracking table if it doesn't exist
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT now()
		)`)
	if err != nil {
		return fmt.Errorf("creating schema_migrations table: %w", err)
	}

	// Read migration files
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("reading migrations directory %s: %w", migrationsDir, err)
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files) // ensures 001, 002, ... order

	for _, filename := range files {
		// Check if already applied
		var exists bool
		err := pool.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE filename = $1)`,
			filename).Scan(&exists)
		if err != nil {
			return fmt.Errorf("checking migration %s: %w", filename, err)
		}
		if exists {
			slog.Debug("migration already applied, skipping", "file", filename)
			continue
		}

		// Read and execute the migration
		path := filepath.Join(migrationsDir, filename)
		sql, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("reading migration %s: %w", filename, err)
		}

		if _, err := pool.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("executing migration %s: %w", filename, err)
		}

		// Record it
		if _, err := pool.Exec(ctx,
			`INSERT INTO schema_migrations (filename) VALUES ($1)`, filename); err != nil {
			return fmt.Errorf("recording migration %s: %w", filename, err)
		}

		slog.Info("migration applied", "file", filename)
	}

	return nil
}
