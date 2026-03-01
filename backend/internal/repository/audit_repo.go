package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// AuditRepository defines data access for audit logs (PostgreSQL fallback).
type AuditRepository interface {
	Create(ctx context.Context, log *models.AuditLog) error
	List(ctx context.Context, limit, offset int) ([]models.AuditLog, int, error)
}

type auditRepo struct {
	pool *pgxpool.Pool
}

func NewAuditRepository(pool *pgxpool.Pool) AuditRepository {
	return &auditRepo{pool: pool}
}

func (r *auditRepo) Create(ctx context.Context, log *models.AuditLog) error {
	query := `
		INSERT INTO audit_logs (id, actor_id, actor_type, action, resource, result, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING timestamp`

	return r.pool.QueryRow(ctx, query,
		log.ID, log.ActorID, log.ActorType, log.Action,
		log.Resource, log.Result, log.Details, log.IPAddress,
	).Scan(&log.Timestamp)
}

func (r *auditRepo) List(ctx context.Context, limit, offset int) ([]models.AuditLog, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs`).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting audit logs: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, actor_id, actor_type, action, resource, result, details, ip_address, timestamp
		 FROM audit_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing audit logs: %w", err)
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		if err := rows.Scan(&l.ID, &l.ActorID, &l.ActorType, &l.Action,
			&l.Resource, &l.Result, &l.Details, &l.IPAddress, &l.Timestamp); err != nil {
			return nil, 0, fmt.Errorf("scanning audit log row: %w", err)
		}
		logs = append(logs, l)
	}
	return logs, total, nil
}
