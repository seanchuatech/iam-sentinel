package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// PolicyRepository defines data access for policies.
type PolicyRepository interface {
	Create(ctx context.Context, policy *models.Policy) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Policy, error)
	List(ctx context.Context, limit, offset int) ([]models.Policy, int, error)
	Update(ctx context.Context, policy *models.Policy) error
	Delete(ctx context.Context, id uuid.UUID) error
	AttachPolicy(ctx context.Context, att *models.PolicyAttachment) error
	DetachPolicy(ctx context.Context, policyID, principalID uuid.UUID, principalType string) error
	ListPoliciesForPrincipal(ctx context.Context, principalID uuid.UUID, principalType string) ([]models.Policy, error)
	GetAllPoliciesForUser(ctx context.Context, userID uuid.UUID) ([]models.PolicyDocument, error)
}

type policyRepo struct {
	pool *pgxpool.Pool
}

func NewPolicyRepository(pool *pgxpool.Pool) PolicyRepository {
	return &policyRepo{pool: pool}
}

func (r *policyRepo) Create(ctx context.Context, policy *models.Policy) error {
	docJSON, err := json.Marshal(policy.Document)
	if err != nil {
		return fmt.Errorf("marshaling policy document: %w", err)
	}

	query := `
		INSERT INTO policies (id, name, description, policy_type, document, version)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at`

	return r.pool.QueryRow(ctx, query,
		policy.ID, policy.Name, policy.Description, policy.PolicyType, docJSON, policy.Version,
	).Scan(&policy.CreatedAt, &policy.UpdatedAt)
}

func (r *policyRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Policy, error) {
	policy := &models.Policy{}
	var docJSON []byte

	query := `
		SELECT id, name, description, policy_type, document, version, created_at, updated_at
		FROM policies WHERE id = $1`

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&policy.ID, &policy.Name, &policy.Description, &policy.PolicyType,
		&docJSON, &policy.Version, &policy.CreatedAt, &policy.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("getting policy by id: %w", err)
	}

	if err := json.Unmarshal(docJSON, &policy.Document); err != nil {
		return nil, fmt.Errorf("unmarshaling policy document: %w", err)
	}
	return policy, nil
}

func (r *policyRepo) List(ctx context.Context, limit, offset int) ([]models.Policy, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM policies`).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("counting policies: %w", err)
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, name, description, policy_type, document, version, created_at, updated_at
		 FROM policies ORDER BY name LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("listing policies: %w", err)
	}
	defer rows.Close()

	var policies []models.Policy
	for rows.Next() {
		var p models.Policy
		var docJSON []byte
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.PolicyType,
			&docJSON, &p.Version, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("scanning policy row: %w", err)
		}
		if err := json.Unmarshal(docJSON, &p.Document); err != nil {
			return nil, 0, fmt.Errorf("unmarshaling policy document: %w", err)
		}
		policies = append(policies, p)
	}
	return policies, total, nil
}

func (r *policyRepo) Update(ctx context.Context, policy *models.Policy) error {
	docJSON, err := json.Marshal(policy.Document)
	if err != nil {
		return fmt.Errorf("marshaling policy document: %w", err)
	}

	query := `
		UPDATE policies SET name = $1, description = $2, document = $3,
		       version = version + 1, updated_at = now()
		WHERE id = $4
		RETURNING version, updated_at`

	return r.pool.QueryRow(ctx, query,
		policy.Name, policy.Description, docJSON, policy.ID,
	).Scan(&policy.Version, &policy.UpdatedAt)
}

func (r *policyRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM policies WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting policy: %w", err)
	}
	return nil
}

func (r *policyRepo) AttachPolicy(ctx context.Context, att *models.PolicyAttachment) error {
	query := `
		INSERT INTO policy_attachments (id, policy_id, principal_id, principal_type)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (policy_id, principal_id, principal_type) DO NOTHING
		RETURNING attached_at`

	return r.pool.QueryRow(ctx, query,
		att.ID, att.PolicyID, att.PrincipalID, att.PrincipalType,
	).Scan(&att.AttachedAt)
}

func (r *policyRepo) DetachPolicy(ctx context.Context, policyID, principalID uuid.UUID, principalType string) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM policy_attachments WHERE policy_id = $1 AND principal_id = $2 AND principal_type = $3`,
		policyID, principalID, principalType)
	if err != nil {
		return fmt.Errorf("detaching policy: %w", err)
	}
	return nil
}

func (r *policyRepo) ListPoliciesForPrincipal(ctx context.Context, principalID uuid.UUID, principalType string) ([]models.Policy, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.id, p.name, p.description, p.policy_type, p.document, p.version, p.created_at, p.updated_at
		 FROM policies p JOIN policy_attachments pa ON p.id = pa.policy_id
		 WHERE pa.principal_id = $1 AND pa.principal_type = $2
		 ORDER BY p.name`, principalID, principalType)
	if err != nil {
		return nil, fmt.Errorf("listing policies for principal: %w", err)
	}
	defer rows.Close()

	var policies []models.Policy
	for rows.Next() {
		var p models.Policy
		var docJSON []byte
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.PolicyType,
			&docJSON, &p.Version, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning policy row: %w", err)
		}
		if err := json.Unmarshal(docJSON, &p.Document); err != nil {
			return nil, fmt.Errorf("unmarshaling policy document: %w", err)
		}
		policies = append(policies, p)
	}
	return policies, nil
}

// GetAllPoliciesForUser collects policies from:
// 1. Direct user attachments
// 2. Policies attached to the user's groups
// 3. Policies attached to the user's roles
// This is the input to the policy evaluation engine.
func (r *policyRepo) GetAllPoliciesForUser(ctx context.Context, userID uuid.UUID) ([]models.PolicyDocument, error) {
	query := `
		SELECT DISTINCT p.document
		FROM policies p
		JOIN policy_attachments pa ON p.id = pa.policy_id
		WHERE
			(pa.principal_type = 'user' AND pa.principal_id = $1)
			OR (pa.principal_type = 'group' AND pa.principal_id IN (
				SELECT group_id FROM user_groups WHERE user_id = $1
			))
			OR (pa.principal_type = 'role' AND pa.principal_id IN (
				SELECT role_id FROM user_roles WHERE user_id = $1
			))`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("getting all policies for user: %w", err)
	}
	defer rows.Close()

	var docs []models.PolicyDocument
	for rows.Next() {
		var docJSON []byte
		if err := rows.Scan(&docJSON); err != nil {
			return nil, fmt.Errorf("scanning policy document: %w", err)
		}
		var doc models.PolicyDocument
		if err := json.Unmarshal(docJSON, &doc); err != nil {
			return nil, fmt.Errorf("unmarshaling policy document: %w", err)
		}
		docs = append(docs, doc)
	}
	return docs, nil
}
