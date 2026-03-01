package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/seanchuatech/iam-sentinel/backend/internal/middleware"
	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// APIKeyHandler handles API key management endpoints.
type APIKeyHandler struct {
	apiKeyService *service.APIKeyService
}

func NewAPIKeyHandler(apiKeyService *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{apiKeyService: apiKeyService}
}

// Create handles POST /api/v1/api-keys
func (h *APIKeyHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req models.CreateAPIKeyRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "api key name is required")
		return
	}

	result, err := h.apiKeyService.Create(r.Context(), claims.UserID, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create api key")
		return
	}

	respondJSON(w, http.StatusCreated, result)
}

// List handles GET /api/v1/api-keys
func (h *APIKeyHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r.Context())
	if claims == nil {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	keys, err := h.apiKeyService.ListByUserID(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to list api keys")
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{"api_keys": keys})
}

// Delete handles DELETE /api/v1/api-keys/{id}
func (h *APIKeyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(chi.URLParam(r, "id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid api key id")
		return
	}

	if err := h.apiKeyService.Delete(r.Context(), id); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete api key")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "api key revoked"})
}
