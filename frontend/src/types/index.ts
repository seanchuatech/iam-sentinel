// =============================================================================
// Sentinel — TypeScript Types (mirrors Go backend models)
// =============================================================================

// User
export interface User {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

// Group
export interface Group {
  id: string;
  name: string;
  description: string;
  path: string;
  created_at: string;
  updated_at: string;
}

// Role
export interface Role {
  id: string;
  name: string;
  description: string;
  trust_policy: Record<string, unknown>;
  max_session_duration: number;
  created_at: string;
  updated_at: string;
}

// Policy
export interface PolicyStatement {
  effect: 'Allow' | 'Deny';
  action: string[];
  resource: string[];
}

export interface PolicyDocument {
  version: string;
  statement: PolicyStatement[];
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  policy_type: 'managed' | 'inline';
  document: PolicyDocument;
  version: number;
  created_at: string;
  updated_at: string;
}

// API Key
export interface APIKey {
  id: string;
  user_id: string;
  key_id: string;
  name: string;
  status: 'active' | 'inactive';
  last_used: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateAPIKeyResponse {
  api_key: APIKey;
  secret: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actor_id: string;
  actor_type: string;
  action: string;
  resource: string;
  result: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

// Simulator
export interface SimulateRequest {
  user_id: string;
  action: string;
  resource: string;
}

export interface SimulateResult {
  decision: 'ALLOW' | 'DENY' | 'IMPLICIT_DENY';
  reason: string;
}

// API Response wrappers
export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  [key: string]: T[] | number;
}

export interface LoginResponse {
  token: string;
  user: User;
}
