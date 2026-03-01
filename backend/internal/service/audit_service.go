package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/repository"
)

// AuditService handles audit log recording.
type AuditService struct {
	auditRepo repository.AuditRepository
}

func NewAuditService(auditRepo repository.AuditRepository) *AuditService {
	return &AuditService{auditRepo: auditRepo}
}

func (s *AuditService) Log(ctx context.Context, log *models.AuditLog) error {
	log.ID = uuid.New()
	if err := s.auditRepo.Create(ctx, log); err != nil {
		return fmt.Errorf("recording audit log: %w", err)
	}
	return nil
}

func (s *AuditService) List(ctx context.Context, limit, offset int) ([]models.AuditLog, int, error) {
	return s.auditRepo.List(ctx, limit, offset)
}
