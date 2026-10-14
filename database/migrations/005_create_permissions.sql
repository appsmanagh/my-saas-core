
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO permissions (key, description)
VALUES
    ('users:read', 'Read users'),
    ('users:update', 'Update users'),
    ('users:delete', 'Delete users'),
    ('roles:read', 'Read roles'),
    ('roles:create', 'Create roles'),
    ('roles:update', 'Update roles'),
    ('roles:delete', 'Delete roles'),
    ('roles:assign', 'Assign permissions to roles')
ON CONFLICT (key) DO NOTHING;