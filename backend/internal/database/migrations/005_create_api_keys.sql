-- 005_create_api_keys.sql
-- API keys for programmatic access. Secret is hashed (SHA-256), never stored raw.

CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_id      VARCHAR(32)  NOT NULL UNIQUE,
    secret_hash VARCHAR(64)  NOT NULL,
    name        VARCHAR(128) NOT NULL DEFAULT '',
    status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive')),
    last_used   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX idx_api_keys_key_id ON api_keys (key_id);
