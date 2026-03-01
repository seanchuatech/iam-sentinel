package engine

import "path"

// MatchPattern checks if a value matches a glob-like pattern.
// Supports wildcards:
//   - "*" matches any single segment (e.g., "users:*" matches "users:List")
//   - "**" or lone "*" matches everything
//
// This is used to match both Action patterns and Resource patterns.
func MatchPattern(pattern, value string) bool {
	// Exact match shortcut
	if pattern == value {
		return true
	}

	// Universal wildcard
	if pattern == "*" {
		return true
	}

	// Use Go's path.Match for glob matching.
	// path.Match handles *, ?, and character ranges [abc].
	matched, err := path.Match(pattern, value)
	if err != nil {
		// Malformed pattern — fail closed (deny)
		return false
	}

	return matched
}

// MatchAny checks if any pattern in the list matches the value.
func MatchAny(patterns []string, value string) bool {
	for _, p := range patterns {
		if MatchPattern(p, value) {
			return true
		}
	}
	return false
}
