
-- Ensure a role can be referenced together with its organization.
ALTER TABLE roles
    ADD CONSTRAINT roles_id_organization_unique
    UNIQUE (id, organization_id);

-- Link users to organizations and assign one role per organization.
CREATE TABLE IF NOT EXISTS organization_members (
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    role_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT organization_members_pkey
        PRIMARY KEY (user_id, organization_id),

    CONSTRAINT organization_members_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT organization_members_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT organization_members_role_organization_fk
        FOREIGN KEY (role_id, organization_id)
        REFERENCES roles(id, organization_id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS organization_members_role_id_idx
    ON organization_members (role_id);

CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx
    ON organization_members (organization_id);



-- 35. ¿Qué garantiza esta migración?
-- - Un usuario puede pertenecer a varias organizaciones.
-- - Un usuario solo puede tener un rol por organización, por ahora.
-- - No puedes asignar un rol que pertenezca a otra organización.
-- - Si eliminas un usuario o una organización, sus membresías se eliminan.
-- - No puedes eliminar un rol mientras siga asignado a miembros.
-- Una decisión importante: dejamos role_id obligatorio. Así, no puede existir una membresía sin rol asignado.