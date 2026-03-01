-- 004_create_policies.sql
-- Policies with JSONB document + polymorphic attachment table.

CREATE TABLE policies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(128) NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT '',
    policy_type VARCHAR(20)  NOT NULL DEFAULT 'managed'
                CHECK (policy_type IN ('managed', 'inline')),
    document    JSONB        NOT NULL,
    version     INTEGER      NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Polymorphic attachment: a policy can be attached to a user, group, or role.
CREATE TABLE policy_attachments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id      UUID        NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    principal_id   UUID        NOT NULL,
    principal_type VARCHAR(20) NOT NULL
                   CHECK (principal_type IN ('user', 'group', 'role')),
    attached_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (policy_id, principal_id, principal_type)
);

CREATE INDEX idx_policy_attachments_principal
    ON policy_attachments (principal_id, principal_type);
CREATE INDEX idx_policies_document
    ON policies USING GIN (document);
