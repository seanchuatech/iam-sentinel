package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// RoleRepository defines data access for roles.
type RoleRepository interface {
	Create(ctx context.Context, role *models.Role) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error)
	List(ctx context.Context, limit, offset int) ([]models.Role, int, error)
	Update(ctx context.Context, role *models.Role) error
	Delete(ctx context.Context, id uuid.UUID) error
	AssignUser(ctx context.Context, roleID, userID uuid.UUID) error
	UnassignUser(ctx context.Context, roleID, userID uuid.UUID) error
	ListRolesForUser(ctx context.Context, userID uuid.UUID) ([]models.Role, error)
}

type roleRepo struct {
	pool *pgxpool.Pool
}

func NewRoleRepository(pool *pgxpool.Pool) RoleRepository {
	return &roleRepo{pool: pool}
}

func (r *roleRepo) Create(ctx context.Context, role *models.Role) error {
	query := `
		INSERT INTO roles (id, name, description, trust_policy, max_session_duration)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at, updated_at`

	return r.pool.QueryRow(ctx, query,
		role.ID, role.Name, role.Description, role.TrustPolicy, role.MaxSessionDuration,
	).Scan(&role.CreatedAt, &role.UpdatedAt)
}

func (r *roleRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	role := &models.Role{}
	query := `
		SELECT id, name, description, trust_policy, max_session_duration, created_at, updated_at
		FROM roles WHERE id = $1`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&role.ID, &role.Name, &role.Description, &role.TrustPolicy,
		&role.MaxSessionDuration, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("getting role by id: %w", err)
	}
	return role, nil
}

func (r *roleRepo) List(ctx context.Context, limit, offset int) ([]models.Role, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM roles`).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting roles: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, trust_policy, max_session_duration, created_at, updated_at
		 FROM roles ORDER BY name LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing roles: %w", err)
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var rl models.Role
		if err := rows.Scan(&rl.ID, &rl.Name, &rl.Description, &rl.TrustPolicy,
			&rl.MaxSessionDuration, &rl.CreatedAt, &rl.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("scanning role row: %w", err)
		}
		roles = append(roles, rl)
	}
	return roles, total, nil
}

func (r *roleRepo) Update(ctx context.Context, role *models.Role) error {
	query := `
		UPDATE roles SET name = $1, description = $2, trust_policy = $3,
		       max_session_duration = $4, updated_at = now()
		WHERE id = $5
		RETURNING updated_at`

	return r.pool.QueryRow(ctx, query,
		role.Name, role.Description, role.TrustPolicy,
		role.MaxSessionDuration, role.ID,
	).Scan(&role.UpdatedAt)
}

func (r *roleRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM roles WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting role: %w", err)
	}
	return nil
}

func (r *roleRepo) AssignUser(ctx context.Context, roleID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_roles (role_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		roleID, userID)
	if err != nil {
		return fmt.Errorf("assigning user to role: %w", err)
	}
	return nil
}

func (r *roleRepo) UnassignUser(ctx context.Context, roleID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2`,
		roleID, userID)
	if err != nil {
		return fmt.Errorf("unassigning user from role: %w", err)
	}
	return nil
}

func (r *roleRepo) ListRolesForUser(ctx context.Context, userID uuid.UUID) ([]models.Role, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT r.id, r.name, r.description, r.trust_policy, r.max_session_duration, r.created_at, r.updated_at
		 FROM roles r JOIN user_roles ur ON r.id = ur.role_id
		 WHERE ur.user_id = $1 ORDER BY r.name`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing user roles: %w", err)
	}
	defer rows.Close()

	var roles []models.Role
	for rows.Next() {
		var rl models.Role
		if err := rows.Scan(&rl.ID, &rl.Name, &rl.Description, &rl.TrustPolicy,
			&rl.MaxSessionDuration, &rl.CreatedAt, &rl.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning role row: %w", err)
		}
		roles = append(roles, rl)
	}
	return roles, nil
}
