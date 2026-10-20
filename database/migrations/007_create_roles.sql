
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT roles_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT roles_name_not_empty
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT roles_name_unique_per_organization
        UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS roles_organization_id_idx
    ON roles (organization_id);