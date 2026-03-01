package models

import (
	"time"

	"github.com/google/uuid"
)

// Policy represents an IAM policy with a JSON document defining permissions.
type Policy struct {
	ID          uuid.UUID      `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	PolicyType  string         `json:"policy_type"`
	Document    PolicyDocument `json:"document"`
	Version     int            `json:"version"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// PolicyType constants.
const (
	PolicyTypeManaged = "managed"
	PolicyTypeInline  = "inline"
)

// PolicyDocument is the JSON structure that defines IAM permissions.
// This mirrors the AWS IAM policy document format.
type PolicyDocument struct {
	Version   string            `json:"Version"`
	Statement []PolicyStatement `json:"Statement"`
}

// PolicyStatement is a single permission rule within a policy.
type PolicyStatement struct {
	Effect   string   `json:"Effect"`   // "Allow" or "Deny"
	Action   []string `json:"Action"`   // e.g., ["users:List", "users:Get"]
	Resource []string `json:"Resource"` // e.g., ["arn:sentinel:users/*"]
}

// Effect constants.
const (
	EffectAllow = "Allow"
	EffectDeny  = "Deny"
)

// PolicyAttachment links a policy to a principal (user, group, or role).
type PolicyAttachment struct {
	ID            uuid.UUID `json:"id"`
	PolicyID      uuid.UUID `json:"policy_id"`
	PrincipalID   uuid.UUID `json:"principal_id"`
	PrincipalType string    `json:"principal_type"`
	AttachedAt    time.Time `json:"attached_at"`
}

// PrincipalType constants.
const (
	PrincipalTypeUser  = "user"
	PrincipalTypeGroup = "group"
	PrincipalTypeRole  = "role"
)

// CreatePolicyRequest is the input for creating a new policy.
type CreatePolicyRequest struct {
	Name        string         `json:"name"        validate:"required,min=3,max=128"`
	Description string         `json:"description,omitempty"`
	PolicyType  string         `json:"policy_type,omitempty" validate:"omitempty,oneof=managed inline"`
	Document    PolicyDocument `json:"document"    validate:"required"`
}

// UpdatePolicyRequest is the input for updating an existing policy.
type UpdatePolicyRequest struct {
	Name        *string         `json:"name,omitempty"        validate:"omitempty,min=3,max=128"`
	Description *string         `json:"description,omitempty"`
	Document    *PolicyDocument `json:"document,omitempty"`
}

// AttachPolicyRequest is the input for attaching a policy to a principal.
type AttachPolicyRequest struct {
	PolicyID      uuid.UUID `json:"policy_id"      validate:"required"`
	PrincipalID   uuid.UUID `json:"principal_id"   validate:"required"`
	PrincipalType string    `json:"principal_type" validate:"required,oneof=user group role"`
}
