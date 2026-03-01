package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
)

// GroupService handles group business logic.
type GroupService struct {
	groupRepo repository.GroupRepository
}

func NewGroupService(groupRepo repository.GroupRepository) *GroupService {
	return &GroupService{groupRepo: groupRepo}
}

func (s *GroupService) Create(ctx context.Context, req models.CreateGroupRequest) (*models.Group, error) {
	group := &models.Group{
		ID:          uuid.New(),
		Name:        req.Name,
		Description: req.Description,
		Path:        req.Path,
	}
	if group.Path == "" {
		group.Path = "/"
	}

	if err := s.groupRepo.Create(ctx, group); err != nil {
		return nil, fmt.Errorf("creating group: %w", err)
	}
	return group, nil
}

func (s *GroupService) GetByID(ctx context.Context, id uuid.UUID) (*models.Group, error) {
	return s.groupRepo.GetByID(ctx, id)
}

func (s *GroupService) List(ctx context.Context, limit, offset int) ([]models.Group, int, error) {
	return s.groupRepo.List(ctx, limit, offset)
}

func (s *GroupService) Update(ctx context.Context, id uuid.UUID, req models.UpdateGroupRequest) (*models.Group, error) {
	group, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting group for update: %w", err)
	}

	if req.Name != nil {
		group.Name = *req.Name
	}
	if req.Description != nil {
		group.Description = *req.Description
	}
	if req.Path != nil {
		group.Path = *req.Path
	}

	if err := s.groupRepo.Update(ctx, group); err != nil {
		return nil, fmt.Errorf("updating group: %w", err)
	}
	return group, nil
}

func (s *GroupService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.groupRepo.Delete(ctx, id)
}

func (s *GroupService) AddUser(ctx context.Context, groupID, userID uuid.UUID) error {
	return s.groupRepo.AddUser(ctx, groupID, userID)
}

func (s *GroupService) RemoveUser(ctx context.Context, groupID, userID uuid.UUID) error {
	return s.groupRepo.RemoveUser(ctx, groupID, userID)
}

func (s *GroupService) ListUsers(ctx context.Context, groupID uuid.UUID) ([]models.User, error) {
	return s.groupRepo.ListUsers(ctx, groupID)
}
