package handlers

import (
	"net/http"

	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// AuditHandler handles audit log query endpoints.
type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler(auditService *service.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditService}
}

// List handles GET /api/v1/audit-logs
func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	logs, total, err := h.auditService.List(r.Context(), limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list audit logs")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"audit_logs": logs,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}
