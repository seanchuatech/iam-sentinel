package models

import (
	"time"

	"github.com/google/uuid"
)

// Group represents a collection of users that share permissions.
type Group struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Path        string    `json:"path"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreateGroupRequest is the input for creating a new group.
type CreateGroupRequest struct {
	Name        string `json:"name"        validate:"required,min=3,max=128"`
	Description string `json:"description,omitempty"`
	Path        string `json:"path,omitempty"`
}

// UpdateGroupRequest is the input for updating an existing group.
type UpdateGroupRequest struct {
	Name        *string `json:"name,omitempty"        validate:"omitempty,min=3,max=128"`
	Description *string `json:"description,omitempty"`
	Path        *string `json:"path,omitempty"`
}
