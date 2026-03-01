package handlers

import (
	"net/http"

	"github.com/seanchuatech/iam-sentinel/backend/internal/service"
)

// SimulatorHandler handles the policy simulator endpoint.
type SimulatorHandler struct {
	simulatorService *service.SimulatorService
}

func NewSimulatorHandler(simulatorService *service.SimulatorService) *SimulatorHandler {
	return &SimulatorHandler{simulatorService: simulatorService}
}

// Simulate handles POST /api/v1/simulate
func (h *SimulatorHandler) Simulate(w http.ResponseWriter, r *http.Request) {
	var req service.SimulateRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.simulatorService.Simulate(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "simulation failed")
		return
	}

	respondJSON(w, http.StatusOK, result)
}
