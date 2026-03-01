package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/seanchuatech/iam-sentinel/backend/internal/engine"
	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
)

// PolicyService handles policy CRUD and evaluation.
type PolicyService struct {
	policyRepo repository.PolicyRepository
}

func NewPolicyService(policyRepo repository.PolicyRepository) *PolicyService {
	return &PolicyService{policyRepo: policyRepo}
}

func (s *PolicyService) Create(ctx context.Context, req models.CreatePolicyRequest) (*models.Policy, error) {
	policy := &models.Policy{
		ID:          uuid.New(),
		Name:        req.Name,
		Description: req.Description,
		PolicyType:  req.PolicyType,
		Document:    req.Document,
		Version:     1,
	}
	if policy.PolicyType == "" {
		policy.PolicyType = models.PolicyTypeManaged
	}

	if err := s.policyRepo.Create(ctx, policy); err != nil {
		return nil, fmt.Errorf("creating policy: %w", err)
	}
	return policy, nil
}

func (s *PolicyService) GetByID(ctx context.Context, id uuid.UUID) (*models.Policy, error) {
	return s.policyRepo.GetByID(ctx, id)
}

func (s *PolicyService) List(ctx context.Context, limit, offset int) ([]models.Policy, int, error) {
	return s.policyRepo.List(ctx, limit, offset)
}

func (s *PolicyService) Update(ctx context.Context, id uuid.UUID, req models.UpdatePolicyRequest) (*models.Policy, error) {
	policy, err := s.policyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting policy for update: %w", err)
	}

	if req.Name != nil {
		policy.Name = *req.Name
	}
	if req.Description != nil {
		policy.Description = *req.Description
	}
	if req.Document != nil {
		policy.Document = *req.Document
	}

	if err := s.policyRepo.Update(ctx, policy); err != nil {
		return nil, fmt.Errorf("updating policy: %w", err)
	}
	return policy, nil
}

func (s *PolicyService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.policyRepo.Delete(ctx, id)
}

func (s *PolicyService) AttachPolicy(ctx context.Context, req models.AttachPolicyRequest) error {
	att := &models.PolicyAttachment{
		ID:            uuid.New(),
		PolicyID:      req.PolicyID,
		PrincipalID:   req.PrincipalID,
		PrincipalType: req.PrincipalType,
	}
	return s.policyRepo.AttachPolicy(ctx, att)
}

func (s *PolicyService) DetachPolicy(ctx context.Context, policyID, principalID uuid.UUID, principalType string) error {
	return s.policyRepo.DetachPolicy(ctx, policyID, principalID, principalType)
}

// SimulatorService handles interactive policy simulation.
type SimulatorService struct {
	policyRepo repository.PolicyRepository
}

func NewSimulatorService(policyRepo repository.PolicyRepository) *SimulatorService {
	return &SimulatorService{policyRepo: policyRepo}
}

// SimulateRequest is the input for a policy simulation.
type SimulateRequest struct {
	UserID   uuid.UUID `json:"user_id"  validate:"required"`
	Action   string    `json:"action"   validate:"required"`
	Resource string    `json:"resource" validate:"required"`
}

// Simulate evaluates policies for a user against an action/resource.
func (s *SimulatorService) Simulate(ctx context.Context, req SimulateRequest) (*engine.EvalResult, error) {
	docs, err := s.policyRepo.GetAllPoliciesForUser(ctx, req.UserID)
	if err != nil {
		return nil, fmt.Errorf("getting policies for simulation: %w", err)
	}

	result := engine.Evaluate(docs, engine.EvalRequest{
		Action:   req.Action,
		Resource: req.Resource,
	})
	return &result, nil
}
