package database

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/v9"

	"github.com/seanchuatech/iam-sentinel/backend/internal/config"
)

// NewRedisClient creates and validates a new Redis client connection.
func NewRedisClient(ctx context.Context, cfg config.RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// Verify connectivity
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("pinging redis: %w", err)
	}

	slog.Info("connected to Redis",
		"host", cfg.Host,
		"port", cfg.Port,
	)

	return client, nil
}
