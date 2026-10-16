
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organizations_name_not_empty
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT organizations_slug_format
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

    CONSTRAINT organizations_slug_unique
        UNIQUE (slug)
);