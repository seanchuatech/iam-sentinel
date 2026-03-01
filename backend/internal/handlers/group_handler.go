package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// GroupHandler handles group CRUD and membership endpoints.
type GroupHandler struct {
	groupService *service.GroupService
}

func NewGroupHandler(groupService *service.GroupService) *GroupHandler {
	return &GroupHandler{groupService: groupService}
}

// Create handles POST /api/v1/groups
func (h *GroupHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateGroupRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "group name is required")
		return
	}

	group, err := h.groupService.Create(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create group")
		return
	}

	respondJSON(w, http.StatusCreated, group)
}

// List handles GET /api/v1/groups
func (h *GroupHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, offset := parsePagination(r)
	groups, total, err := h.groupService.List(r.Context(), limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list groups")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"groups": groups,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// Get handles GET /api/v1/groups/{id}
func (h *GroupHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
		return
	}

	group, err := h.groupService.GetByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "group not found")
		return
	}

	respondJSON(w, http.StatusOK, group)
}

// Update handles PUT /api/v1/groups/{id}
func (h *GroupHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
		return
	}

	var req models.UpdateGroupRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	group, err := h.groupService.Update(r.Context(), id, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update group")
		return
	}

	respondJSON(w, http.StatusOK, group)
}

// Delete handles DELETE /api/v1/groups/{id}
func (h *GroupHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
		return
	}

	if err := h.groupService.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete group")
		return
	}

	respondJSON(w, http.StatusNoContent, nil)
}

// AddUser handles POST /api/v1/groups/{id}/users
func (h *GroupHandler) AddUser(w http.ResponseWriter, r *http.Request) {
	groupID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
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

	if err := h.groupService.AddUser(r.Context(), groupID, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to add user to group")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "user added"})
}

// RemoveUser handles DELETE /api/v1/groups/{id}/users/{userId}
func (h *GroupHandler) RemoveUser(w http.ResponseWriter, r *http.Request) {
	groupID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
		return
	}

	userID, err := parseUUID(chi.URLParam(r, "userId"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.groupService.RemoveUser(r.Context(), groupID, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to remove user from group")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "user removed"})
}

// ListUsers handles GET /api/v1/groups/{id}/users
func (h *GroupHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	groupID, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid group id")
		return
	}

	users, err := h.groupService.ListUsers(r.Context(), groupID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list group members")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{"users": users})
}
