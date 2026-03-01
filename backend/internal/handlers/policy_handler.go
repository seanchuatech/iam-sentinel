package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// PolicyHandler handles policy CRUD and attachment endpoints.
type PolicyHandler struct {
	policyService *service.PolicyService
}

func NewPolicyHandler(policyService *service.PolicyService) *PolicyHandler {
	return &PolicyHandler{policyService: policyService}
}

// Create handles POST /api/v1/policies
func (h *PolicyHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePolicyRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "policy name is required")
		return
	}

	policy, err := h.policyService.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create policy")
		return
	}

	respondJSON(w, http.StatusCreated, policy)
}

// List handles GET /api/v1/policies
func (h *PolicyHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	policies, total, err := h.policyService.List(r.Context(), limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list policies")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"policies": policies,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// Get handles GET /api/v1/policies/{id}
func (h *PolicyHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid policy id")
		return
	}

	policy, err := h.policyService.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "policy not found")
		return
	}

	respondJSON(w, http.StatusOK, policy)
}

// Update handles PUT /api/v1/policies/{id}
func (h *PolicyHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid policy id")
		return
	}

	var req models.UpdatePolicyRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	policy, err := h.policyService.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update policy")
		return
	}

	respondJSON(w, http.StatusOK, policy)
}

// Delete handles DELETE /api/v1/policies/{id}
func (h *PolicyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid policy id")
		return
	}

	if err := h.policyService.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete policy")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}

// Attach handles POST /api/v1/policies/{id}/attach
func (h *PolicyHandler) Attach(w http.ResponseWriter, r *http.Request) {
	policyID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid policy id")
		return
	}

	var req models.AttachPolicyRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.PolicyID = policyID

	if err := h.policyService.AttachPolicy(r.Context(), req); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to attach policy")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "attached"})
}

// Detach handles POST /api/v1/policies/{id}/detach
func (h *PolicyHandler) Detach(w http.ResponseWriter, r *http.Request) {
	policyID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid policy id")
		return
	}

	var req struct {
		PrincipalID   string `json:"principal_id"`
		PrincipalType string `json:"principal_type"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	principalID, err := parseUUID(req.PrincipalID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid principal id")
		return
	}

	if err := h.policyService.DetachPolicy(r.Context(), policyID, principalID, req.PrincipalType); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to detach policy")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "detached"})
}
