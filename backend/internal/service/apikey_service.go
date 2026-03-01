package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/google/uuid"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
)

// APIKeyService handles API key generation and management.
type APIKeyService struct {
	apiKeyRepo repository.APIKeyRepository
}

func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository) *APIKeyService {
	return &APIKeyService{apiKeyRepo: apiKeyRepo}
}

// Create generates a new API key. The plaintext secret is returned only once.
func (s *APIKeyService) Create(ctx context.Context, userID uuid.UUID, req models.CreateAPIKeyRequest) (*models.CreateAPIKeyResponse, error) {
	// Generate a random key ID (SENTINEL_ prefix + 20 hex chars)
	keyID, err := generateRandomHex(10)
	if err != nil {
		return nil, fmt.Errorf("generating key id: %w", err)
	}
	keyID = "SENTINEL_" + keyID

	// Generate a random secret (40 hex chars)
	secret, err := generateRandomHex(20)
	if err != nil {
		return nil, fmt.Errorf("generating secret: %w", err)
	}

	// Hash the secret with SHA-256 before storage
	secretHash := hashSHA256(secret)

	key := &models.APIKey{
		ID:         uuid.New(),
		UserID:     userID,
		KeyID:      keyID,
		SecretHash: secretHash,
		Name:       req.Name,
		Status:     models.APIKeyStatusActive,
		ExpiresAt:  req.ExpiresAt,
	}

	if err := s.apiKeyRepo.Create(ctx, key); err != nil {
		return nil, fmt.Errorf("creating api key: %w", err)
	}

	// Return the key with plaintext secret (shown only once)
	return &models.CreateAPIKeyResponse{
		APIKey: *key,
		Secret: secret,
	}, nil
}

func (s *APIKeyService) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error) {
	return s.apiKeyRepo.ListByUserID(ctx, userID)
}

func (s *APIKeyService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.apiKeyRepo.Delete(ctx, id)
}

// ValidateKey validates an API key pair and returns the associated key record.
func (s *APIKeyService) ValidateKey(ctx context.Context, keyID, secret string) (*models.APIKey, error) {
	key, err := s.apiKeyRepo.GetByKeyID(ctx, keyID)
	if err != nil {
		return nil, fmt.Errorf("looking up api key: %w", err)
	}

	if key.Status != models.APIKeyStatusActive {
		return nil, fmt.Errorf("api key is inactive")
	}

	if key.ExpiresAt != nil && key.ExpiresAt.Before(key.CreatedAt) {
		return nil, fmt.Errorf("api key has expired")
	}

	// Compare hashed secret
	if hashSHA256(secret) != key.SecretHash {
		return nil, fmt.Errorf("invalid api key secret")
	}

	// Update last used timestamp (fire-and-forget)
	_ = s.apiKeyRepo.UpdateLastUsed(ctx, key.ID)

	return key, nil
}

// generateRandomHex returns n random bytes encoded as hex (2n chars).
func generateRandomHex(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// hashSHA256 returns the hex-encoded SHA-256 hash of the input.
func hashSHA256(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}
