package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// RoleHandler handles role CRUD and user assignment endpoints.
type RoleHandler struct {
	roleService *service.RoleService
}

func NewRoleHandler(roleService *service.RoleService) *RoleHandler {
	return &RoleHandler{roleService: roleService}
}

// Create handles POST /api/v1/roles
func (h *RoleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "role name is required")
		return
	}

	role, err := h.roleService.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create role")
		return
	}

	respondJSON(w, http.StatusCreated, role)
}

// List handles GET /api/v1/roles
func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	roles, total, err := h.roleService.List(r.Context(), limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list roles")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"roles":  roles,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// Get handles GET /api/v1/roles/{id}
func (h *RoleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid role id")
		return
	}

	role, err := h.roleService.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "role not found")
		return
	}

	respondJSON(w, http.StatusOK, role)
}

// Update handles PUT /api/v1/roles/{id}
func (h *RoleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid role id")
		return
	}

	var req models.UpdateRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	role, err := h.roleService.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update role")
		return
	}

	respondJSON(w, http.StatusOK, role)
}

// Delete handles DELETE /api/v1/roles/{id}
func (h *RoleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid role id")
		return
	}

	if err := h.roleService.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete role")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}

// AssignUser handles POST /api/v1/roles/{id}/users
func (h *RoleHandler) AssignUser(w http.ResponseWriter, r *http.Request) {
	roleID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid role id")
		return
	}

	var req struct {
		UserID string `json:"user_id"`
	}
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	userID, err := parseUUID(req.UserID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.roleService.AssignUser(r.Context(), roleID, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to assign user to role")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "user assigned"})
}

// UnassignUser handles DELETE /api/v1/roles/{id}/users/{userId}
func (h *RoleHandler) UnassignUser(w http.ResponseWriter, r *http.Request) {
	roleID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid role id")
		return
	}

	userID, err := parseUUID(chi.URLParam(r, "userId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.roleService.UnassignUser(r.Context(), roleID, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to unassign user from role")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "user unassigned"})
}
