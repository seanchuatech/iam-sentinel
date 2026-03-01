package engine

import (
	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

// Decision represents the result of a policy evaluation.
type Decision string

const (
	DecisionAllow        Decision = "ALLOW"
	DecisionDeny         Decision = "DENY"
	DecisionImplicitDeny Decision = "IMPLICIT_DENY"
)

// EvalRequest is the input to the policy evaluator.
type EvalRequest struct {
	Action   string // e.g., "users:List"
	Resource string // e.g., "arn:sentinel:users/*"
}

// EvalResult is the output of a policy evaluation.
type EvalResult struct {
	Decision Decision `json:"decision"`
	Reason   string   `json:"reason"`
}

// Evaluate performs AWS-style deny-override policy evaluation.
//
// Algorithm:
//  1. Default: IMPLICIT_DENY (nothing is allowed unless explicitly granted)
//  2. Gather all statements from all policies
//  3. If any statement explicitly DENIes the action+resource → DENY
//  4. If any statement explicitly ALLOWs the action+resource → ALLOW
//  5. Otherwise → IMPLICIT_DENY
//
// This function is pure logic — no I/O, no database calls.
// It is deterministic: same input always produces same output.
func Evaluate(policies []models.PolicyDocument, req EvalRequest) EvalResult {
	if len(policies) == 0 {
		return EvalResult{
			Decision: DecisionImplicitDeny,
			Reason:   "no policies attached",
		}
	}

	hasAllow := false
	allowReason := ""

	for _, doc := range policies {
		for _, stmt := range doc.Statement {
			// Check if this statement applies to the requested action + resource
			actionMatch := MatchAny(stmt.Action, req.Action)
			resourceMatch := MatchAny(stmt.Resource, req.Resource)

			if !actionMatch || !resourceMatch {
				continue
			}

			switch stmt.Effect {
			case models.EffectDeny:
				// Explicit deny always wins — short circuit immediately
				return EvalResult{
					Decision: DecisionDeny,
					Reason:   "explicit deny",
				}
			case models.EffectAllow:
				hasAllow = true
				allowReason = "explicit allow"
			}
		}
	}

	if hasAllow {
		return EvalResult{
			Decision: DecisionAllow,
			Reason:   allowReason,
		}
	}

	return EvalResult{
		Decision: DecisionImplicitDeny,
		Reason:   "no matching allow statement",
	}
}
