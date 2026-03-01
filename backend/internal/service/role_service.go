package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
)

// RoleService handles role business logic.
type RoleService struct {
	roleRepo repository.RoleRepository
}

func NewRoleService(roleRepo repository.RoleRepository) *RoleService {
	return &RoleService{roleRepo: roleRepo}
}

func (s *RoleService) Create(ctx context.Context, req models.CreateRoleRequest) (*models.Role, error) {
	role := &models.Role{
		ID:                 uuid.New(),
		Name:               req.Name,
		Description:        req.Description,
		TrustPolicy:        req.TrustPolicy,
		MaxSessionDuration: req.MaxSessionDuration,
	}
	if role.MaxSessionDuration == 0 {
		role.MaxSessionDuration = 3600
	}

	if err := s.roleRepo.Create(ctx, role); err != nil {
		return nil, fmt.Errorf("creating role: %w", err)
	}
	return role, nil
}

func (s *RoleService) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	return s.roleRepo.GetByID(ctx, id)
}

func (s *RoleService) List(ctx context.Context, limit, offset int) ([]models.Role, int, error) {
	return s.roleRepo.List(ctx, limit, offset)
}

func (s *RoleService) Update(ctx context.Context, id uuid.UUID, req models.UpdateRoleRequest) (*models.Role, error) {
	role, err := s.roleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting role for update: %w", err)
	}

	if req.Name != nil {
		role.Name = *req.Name
	}
	if req.Description != nil {
		role.Description = *req.Description
	}
	if req.TrustPolicy != nil {
		role.TrustPolicy = req.TrustPolicy
	}
	if req.MaxSessionDuration != nil {
		role.MaxSessionDuration = *req.MaxSessionDuration
	}

	if err := s.roleRepo.Update(ctx, role); err != nil {
		return nil, fmt.Errorf("updating role: %w", err)
	}
	return role, nil
}

func (s *RoleService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.roleRepo.Delete(ctx, id)
}

func (s *RoleService) AssignUser(ctx context.Context, roleID, userID uuid.UUID) error {
	return s.roleRepo.AssignUser(ctx, roleID, userID)
}

func (s *RoleService) UnassignUser(ctx context.Context, roleID, userID uuid.UUID) error {
	return s.roleRepo.UnassignUser(ctx, roleID, userID)
}
