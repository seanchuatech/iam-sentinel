-- 003_create_roles.sql
-- Roles with trust policy + user-role assignment junction.

CREATE TABLE roles (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(128) NOT NULL UNIQUE,
    description          TEXT         NOT NULL DEFAULT '',
    trust_policy         JSONB        NOT NULL DEFAULT '{}',
    max_session_duration INTEGER      NOT NULL DEFAULT 3600,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id  UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
