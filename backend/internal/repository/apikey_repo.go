package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// APIKeyRepository defines data access for API keys.
type APIKeyRepository interface {
	Create(ctx context.Context, key *models.APIKey) error
	GetByKeyID(ctx context.Context, keyID string) (*models.APIKey, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error)
	UpdateLastUsed(ctx context.Context, id uuid.UUID) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type apiKeyRepo struct {
	pool *pgxpool.Pool
}

func NewAPIKeyRepository(pool *pgxpool.Pool) APIKeyRepository {
	return &apiKeyRepo{pool: pool}
}

func (r *apiKeyRepo) Create(ctx context.Context, key *models.APIKey) error {
	query := `
		INSERT INTO api_keys (id, user_id, key_id, secret_hash, name, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at`

	return r.pool.QueryRow(ctx, query,
		key.ID, key.UserID, key.KeyID, key.SecretHash, key.Name, key.Status, key.ExpiresAt,
	).Scan(&key.CreatedAt)
}

func (r *apiKeyRepo) GetByKeyID(ctx context.Context, keyID string) (*models.APIKey, error) {
	key := &models.APIKey{}
	query := `
		SELECT id, user_id, key_id, secret_hash, name, status, last_used, expires_at, created_at
		FROM api_keys WHERE key_id = $1`

	err := r.pool.QueryRow(ctx, query, keyID).Scan(
		&key.ID, &key.UserID, &key.KeyID, &key.SecretHash,
		&key.Name, &key.Status, &key.LastUsed, &key.ExpiresAt, &key.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("getting api key by key_id: %w", err)
	}
	return key, nil
}

func (r *apiKeyRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, key_id, secret_hash, name, status, last_used, expires_at, created_at
		 FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing api keys: %w", err)
	}
	defer rows.Close()

	var keys []models.APIKey
	for rows.Next() {
		var k models.APIKey
		if err := rows.Scan(&k.ID, &k.UserID, &k.KeyID, &k.SecretHash,
			&k.Name, &k.Status, &k.LastUsed, &k.ExpiresAt, &k.CreatedAt); err != nil {
			return nil, fmt.Errorf("scanning api key row: %w", err)
		}
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *apiKeyRepo) UpdateLastUsed(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `UPDATE api_keys SET last_used = now() WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("updating api key last_used: %w", err)
	}
	return nil
}

func (r *apiKeyRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM api_keys WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting api key: %w", err)
	}
	return nil
}
