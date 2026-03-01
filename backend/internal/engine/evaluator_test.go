package engine

import (
	"testing"

	"github.com/seanchuatech/iam-sentinel/backend/internal/models"
)

func TestEvaluate(t *testing.T) {
	allowS3Read := models.PolicyDocument{
		Version: "2024-01-01",
		Statement: []models.PolicyStatement{
			{
				Effect:   models.EffectAllow,
				Action:   []string{"s3:GetObject", "s3:ListBucket"},
				Resource: []string{"arn:sentinel:s3:bucket/*"},
			},
		},
	}

	denyS3Delete := models.PolicyDocument{
		Version: "2024-01-01",
		Statement: []models.PolicyStatement{
			{
				Effect:   models.EffectDeny,
				Action:   []string{"s3:DeleteObject"},
				Resource: []string{"arn:sentinel:s3:bucket/*"},
			},
		},
	}

	allowAll := models.PolicyDocument{
		Version: "2024-01-01",
		Statement: []models.PolicyStatement{
			{
				Effect:   models.EffectAllow,
				Action:   []string{"*"},
				Resource: []string{"*"},
			},
		},
	}

	tests := []struct {
		name     string
		policies []models.PolicyDocument
		req      EvalRequest
		want     Decision
	}{
		// Basic cases
		{
			name:     "no policies → implicit deny",
			policies: nil,
			req:      EvalRequest{Action: "s3:GetObject", Resource: "arn:sentinel:s3:bucket/file.txt"},
			want:     DecisionImplicitDeny,
		},
		{
			name:     "explicit allow matches",
			policies: []models.PolicyDocument{allowS3Read},
			req:      EvalRequest{Action: "s3:GetObject", Resource: "arn:sentinel:s3:bucket/file.txt"},
			want:     DecisionAllow,
		},
		{
			name:     "no matching action → implicit deny",
			policies: []models.PolicyDocument{allowS3Read},
			req:      EvalRequest{Action: "s3:PutObject", Resource: "arn:sentinel:s3:bucket/file.txt"},
			want:     DecisionImplicitDeny,
		},
		{
			name:     "no matching resource → implicit deny",
			policies: []models.PolicyDocument{allowS3Read},
			req:      EvalRequest{Action: "s3:GetObject", Resource: "arn:sentinel:ec2:instance/i-123"},
			want:     DecisionImplicitDeny,
		},

		// Deny override
		{
			name:     "explicit deny overrides allow",
			policies: []models.PolicyDocument{allowAll, denyS3Delete},
			req:      EvalRequest{Action: "s3:DeleteObject", Resource: "arn:sentinel:s3:bucket/file.txt"},
			want:     DecisionDeny,
		},
		{
			name:     "allow still works for non-denied action",
			policies: []models.PolicyDocument{allowAll, denyS3Delete},
			req:      EvalRequest{Action: "s3:GetObject", Resource: "arn:sentinel:s3:bucket/file.txt"},
			want:     DecisionAllow,
		},

		// Wildcard
		{
			name:     "wildcard allows everything",
			policies: []models.PolicyDocument{allowAll},
			req:      EvalRequest{Action: "iam:CreateUser", Resource: "arn:sentinel:iam:users/new"},
			want:     DecisionAllow,
		},

		// Multiple policies
		{
			name:     "deny in second policy overrides allow in first",
			policies: []models.PolicyDocument{allowAll, denyS3Delete},
			req:      EvalRequest{Action: "s3:DeleteObject", Resource: "arn:sentinel:s3:bucket/secret.txt"},
			want:     DecisionDeny,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Evaluate(tt.policies, tt.req)
			if result.Decision != tt.want {
				t.Errorf("Evaluate() = %s (%s), want %s",
					result.Decision, result.Reason, tt.want)
			}
		})
	}
}
