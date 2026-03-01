package models

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog represents a record of an access request and its outcome.
type AuditLog struct {
	ID        uuid.UUID      `json:"id"`
	ActorID   uuid.UUID      `json:"actor_id"`
	ActorType string         `json:"actor_type"`
	Action    string         `json:"action"`
	Resource  string         `json:"resource"`
	Result    string         `json:"result"`
	Details   map[string]any `json:"details"`
	IPAddress string         `json:"ip_address"`
	Timestamp time.Time      `json:"timestamp"`
}

// AuditResult constants.
const (
	AuditResultAllowed = "allowed"
	AuditResultDenied  = "denied"
	AuditResultError   = "error"
)
