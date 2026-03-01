-- 006_create_audit_log.sql
-- Local audit log fallback (primary target is DynamoDB in production).

CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID         NOT NULL,
    actor_type   VARCHAR(20)  NOT NULL DEFAULT 'user',
    action       VARCHAR(128) NOT NULL,
    resource     VARCHAR(512) NOT NULL DEFAULT '',
    result       VARCHAR(20)  NOT NULL
                 CHECK (result IN ('allowed', 'denied', 'error')),
    details      JSONB        NOT NULL DEFAULT '{}',
    ip_address   VARCHAR(45)  NOT NULL DEFAULT '',
    timestamp    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
