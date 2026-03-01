package models

import (
	"time"

	"github.com/google/uuid"
)

// Role represents an assumable identity with temporary permissions.
type Role struct {
	ID                 uuid.UUID      `json:"id"`
	Name               string         `json:"name"`
	Description        string         `json:"description"`
	TrustPolicy        map[string]any `json:"trust_policy"`
	MaxSessionDuration int            `json:"max_session_duration"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
}

// CreateRoleRequest is the input for creating a new role.
type CreateRoleRequest struct {
	Name               string         `json:"name"         validate:"required,min=3,max=128"`
	Description        string         `json:"description,omitempty"`
	TrustPolicy        map[string]any `json:"trust_policy" validate:"required"`
	MaxSessionDuration int            `json:"max_session_duration,omitempty"`
}

// UpdateRoleRequest is the input for updating an existing role.
type UpdateRoleRequest struct {
	Name               *string        `json:"name,omitempty"        validate:"omitempty,min=3,max=128"`
	Description        *string        `json:"description,omitempty"`
	TrustPolicy        map[string]any `json:"trust_policy,omitempty"`
	MaxSessionDuration *int           `json:"max_session_duration,omitempty"`
}
