package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// GroupRepository defines data access for groups.
type GroupRepository interface {
	Create(ctx context.Context, group *models.Group) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Group, error)
	List(ctx context.Context, limit, offset int) ([]models.Group, int, error)
	Update(ctx context.Context, group *models.Group) error
	Delete(ctx context.Context, id uuid.UUID) error
	AddUser(ctx context.Context, groupID, userID uuid.UUID) error
	RemoveUser(ctx context.Context, groupID, userID uuid.UUID) error
	ListUsers(ctx context.Context, groupID uuid.UUID) ([]models.User, error)
	ListGroupsForUser(ctx context.Context, userID uuid.UUID) ([]models.Group, error)
}

type groupRepo struct {
	pool *pgxpool.Pool
}

func NewGroupRepository(pool *pgxpool.Pool) GroupRepository {
	return &groupRepo{pool: pool}
}

func (r *groupRepo) Create(ctx context.Context, group *models.Group) error {
	query := `
		INSERT INTO groups (id, name, description, path)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at`

	return r.pool.QueryRow(ctx, query,
		group.ID, group.Name, group.Description, group.Path,
	).Scan(&group.CreatedAt, &group.UpdatedAt)
}

func (r *groupRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Group, error) {
	group := &models.Group{}
	query := `SELECT id, name, description, path, created_at, updated_at FROM groups WHERE id = $1`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&group.ID, &group.Name, &group.Description, &group.Path,
		&group.CreatedAt, &group.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("getting group by id: %w", err)
	}
	return group, nil
}

func (r *groupRepo) List(ctx context.Context, limit, offset int) ([]models.Group, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM groups`).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting groups: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, path, created_at, updated_at
		 FROM groups ORDER BY name LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing groups: %w", err)
	}
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.Path, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("scanning group row: %w", err)
		}
		groups = append(groups, g)
	}
	return groups, total, nil
}

func (r *groupRepo) Update(ctx context.Context, group *models.Group) error {
	query := `
		UPDATE groups SET name = $1, description = $2, path = $3, updated_at = now()
		WHERE id = $4
		RETURNING updated_at`

	return r.pool.QueryRow(ctx, query,
		group.Name, group.Description, group.Path, group.ID,
	).Scan(&group.UpdatedAt)
}

func (r *groupRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM groups WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting group: %w", err)
	}
	return nil
}

func (r *groupRepo) AddUser(ctx context.Context, groupID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_groups (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		groupID, userID)
	if err != nil {
		return fmt.Errorf("adding user to group: %w", err)
	}
	return nil
}

func (r *groupRepo) RemoveUser(ctx context.Context, groupID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM user_groups WHERE group_id = $1 AND user_id = $2`,
		groupID, userID)
	if err != nil {
		return fmt.Errorf("removing user from group: %w", err)
	}
	return nil
}

func (r *groupRepo) ListUsers(ctx context.Context, groupID uuid.UUID) ([]models.User, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT u.id, u.username, u.email, u.password_hash, u.status, u.metadata, u.created_at, u.updated_at
		 FROM users u JOIN user_groups ug ON u.id = ug.user_id
		 WHERE ug.group_id = $1 ORDER BY u.username`, groupID)
	if err != nil {
		return nil, fmt.Errorf("listing group users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash,
			&u.Status, &u.Metadata, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning user row: %w", err)
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *groupRepo) ListGroupsForUser(ctx context.Context, userID uuid.UUID) ([]models.Group, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT g.id, g.name, g.description, g.path, g.created_at, g.updated_at
		 FROM groups g JOIN user_groups ug ON g.id = ug.group_id
		 WHERE ug.user_id = $1 ORDER BY g.name`, userID)
	if err != nil {
		return nil, fmt.Errorf("listing user groups: %w", err)
	}
	defer rows.Close()

	var groups []models.Group
	for rows.Next() {
		var g models.Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.Path, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning group row: %w", err)
		}
		groups = append(groups, g)
	}
	return groups, nil
}
