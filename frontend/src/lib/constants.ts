// =============================================================================
// Sentinel — App-wide Constants
// =============================================================================

export const APP_NAME = 'Sentinel';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Identity & Access Management';

// API
export const API_BASE_URL = '/api/v1';

// Auth
export const TOKEN_KEY = 'sentinel_token';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Policy
export const MAX_POLICY_SIZE_KB = 10;
export const MAX_STATEMENTS_PER_POLICY = 50;

// Policy Effects
export const EFFECT = {
  ALLOW: 'Allow',
  DENY: 'Deny',
} as const;

// Principal Types
export const PRINCIPAL_TYPE = {
  USER: 'user',
  GROUP: 'group',
  ROLE: 'role',
} as const;
