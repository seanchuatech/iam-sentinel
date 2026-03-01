package engine

import (
	"testing"
)

func TestMatchPattern(t *testing.T) {
	tests := []struct {
		name    string
		pattern string
		value   string
		want    bool
	}{
		// Exact matches
		{"exact match", "users:List", "users:List", true},
		{"exact mismatch", "users:List", "users:Get", false},

		// Universal wildcard
		{"star matches anything", "*", "users:List", true},
		{"star matches empty", "*", "", true},

		// Glob wildcards
		{"prefix wildcard", "users:*", "users:List", true},
		{"prefix wildcard get", "users:*", "users:Get", true},
		{"prefix wildcard mismatch", "users:*", "groups:List", false},

		// Resource pattern matching
		{"resource exact", "arn:sentinel:users/123", "arn:sentinel:users/123", true},
		{"resource mismatch", "arn:sentinel:users/123", "arn:sentinel:users/456", false},

		// Edge cases
		{"empty pattern empty value", "", "", true},
		{"empty pattern nonempty value", "", "x", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MatchPattern(tt.pattern, tt.value)
			if got != tt.want {
				t.Errorf("MatchPattern(%q, %q) = %v, want %v", tt.pattern, tt.value, got, tt.want)
			}
		})
	}
}

func TestMatchAny(t *testing.T) {
	tests := []struct {
		name     string
		patterns []string
		value    string
		want     bool
	}{
		{"one match", []string{"users:List", "users:Get"}, "users:List", true},
		{"no match", []string{"users:List", "users:Get"}, "users:Delete", false},
		{"wildcard match", []string{"users:*"}, "users:Delete", true},
		{"empty patterns", []string{}, "users:List", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := MatchAny(tt.patterns, tt.value)
			if got != tt.want {
				t.Errorf("MatchAny(%v, %q) = %v, want %v", tt.patterns, tt.value, got, tt.want)
			}
		})
	}
}
