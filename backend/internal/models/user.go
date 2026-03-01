package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents an individual identity that can authenticate.
type User struct {
	ID           uuid.UUID      `json:"id"`
	Username     string         `json:"username"`
	Email        string         `json:"email"`
	PasswordHash string         `json:"-"` // never expose in JSON
	Status       string         `json:"status"`
	Metadata     map[string]any `json:"metadata"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// UserStatus constants.
const (
	UserStatusActive    = "active"
	UserStatusInactive  = "inactive"
	UserStatusSuspended = "suspended"
)

// CreateUserRequest is the input for creating a new user.
type CreateUserRequest struct {
	Username string         `json:"username" validate:"required,min=3,max=64"`
	Email    string         `json:"email"    validate:"required,email"`
	Password string         `json:"password" validate:"required,min=8"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

// UpdateUserRequest is the input for updating an existing user.
type UpdateUserRequest struct {
	Username *string        `json:"username,omitempty" validate:"omitempty,min=3,max=64"`
	Email    *string        `json:"email,omitempty"    validate:"omitempty,email"`
	Status   *string        `json:"status,omitempty"   validate:"omitempty,oneof=active inactive suspended"`
	Metadata map[string]any `json:"metadata,omitempty"`
}
