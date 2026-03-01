package models

import (
	"time"

	"github.com/google/uuid"
)

// APIKey represents a programmatic access credential.
type APIKey struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	KeyID      string     `json:"key_id"`
	SecretHash string     `json:"-"` // never expose in JSON
	Name       string     `json:"name"`
	Status     string     `json:"status"`
	LastUsed   *time.Time `json:"last_used,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// APIKeyStatus constants.
const (
	APIKeyStatusActive   = "active"
	APIKeyStatusInactive = "inactive"
)

// CreateAPIKeyRequest is the input for generating a new API key.
type CreateAPIKeyRequest struct {
	Name      string     `json:"name"       validate:"required,min=1,max=128"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

// CreateAPIKeyResponse includes the secret shown only once at creation time.
type CreateAPIKeyResponse struct {
	APIKey
	Secret string `json:"secret"` // plaintext secret, shown only once
}
