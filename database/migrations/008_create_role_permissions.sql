
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT role_permissions_pkey
        PRIMARY KEY (role_id, permission_id),

    CONSTRAINT role_permissions_role_fk
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT role_permissions_permission_fk
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx
    ON role_permissions (permission_id);


-- ¿Qué garantiza este esquema?

-- La clave primaria compuesta (role_id, permission_id) impide asignar dos veces el mismo permiso al mismo rol.

-- La clave foránea role_id exige que el rol exista.

-- La clave foránea permission_id exige que el permiso exista en nuestro catálogo.

-- ON DELETE CASCADE elimina las asignaciones si se elimina el rol o el permiso.

-- El índice sobre permission_id ayuda a buscar qué roles tienen un permiso.

-- La tabla almacena IDs, no textos como "users:read". Así las asignaciones referencian directamente el registro del catálogo de permisos.