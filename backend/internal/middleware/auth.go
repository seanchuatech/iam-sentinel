package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// contextKey is a private type for context keys to avoid collisions.
type contextKey string

const (
	// UserClaimsKey is the context key for the authenticated user's claims.
	UserClaimsKey contextKey = "user_claims"
)

// JWTAuth returns middleware that validates JWT tokens from the Authorization header.
func JWTAuth(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
				return
			}

			claims, err := authService.ValidateToken(parts[1])
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			// Inject claims into request context
			ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetClaims extracts the authenticated user's claims from the request context.
func GetClaims(ctx context.Context) *service.Claims {
	claims, ok := ctx.Value(UserClaimsKey).(*service.Claims)
	if !ok {
		return nil
	}
	return claims
}
