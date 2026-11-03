
ALTER TABLE roles
ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX roles_one_owner_role_per_organization_idx
ON roles (organization_id)
WHERE is_owner = TRUE;
