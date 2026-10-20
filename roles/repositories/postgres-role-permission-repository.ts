// 32. Qué hace cada método
// assign: busca el permiso en el catálogo y guarda su ID junto al ID del rol. Si ya estaba asignado, no duplica la fila.
// remove: resuelve el ID del permiso y elimina la asociación.
// findPermissionKeysByRoleId: hace un JOIN para devolver claves legibles, como "users:read", en lugar de IDs.
// La asignación es idempotente: llamar assign dos veces con el mismo rol y permiso deja una sola asociación. Eso es útil para APIs, donde un cliente podría repetir una petición.


import type { Database } from "../../database/database";
import type { RolePermissionRepository } from "../role-permission-repository";
import type { PermissionKey } from "../../permissions/permission";

import { NotFoundError } from "../../errors";
import { translatePostgresError } from "../../database/adapters/postgres/postgres-error";

interface PermissionIdRow {
  id: string;
}

interface AssignedRoleRow {
  role_id: string;
}

interface PermissionKeyRow {
  key: PermissionKey;
}

export class PostgresRolePermissionRepository
  implements RolePermissionRepository
{
  constructor(private readonly database: Database) {}

  async assign(roleId: string, permissionKey: PermissionKey): Promise<void> {
    // Resolve the catalog key to its database ID.
    const permissionRows = await this.database.query<PermissionIdRow>(
      `
        SELECT id
        FROM permissions
        WHERE key = $1
      `,
      [permissionKey],
    );

    if (permissionRows.length === 0) {
      throw new NotFoundError("Permission not found");
    }

    const permissionId = permissionRows[0].id;

    try {
      // Idempotent: assigning an already assigned permission is a no-op.
      await this.database.query<AssignedRoleRow>(
        `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
          RETURNING role_id
        `,
        [roleId, permissionId],
      );
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async remove(roleId: string, permissionKey: PermissionKey): Promise<void> {
    const permissionRows = await this.database.query<PermissionIdRow>(
      `
        SELECT id
        FROM permissions
        WHERE key = $1
      `,
      [permissionKey],
    );

    if (permissionRows.length === 0) {
      throw new NotFoundError("Permission not found");
    }

    await this.database.query(
      `
        DELETE FROM role_permissions
        WHERE role_id = $1
          AND permission_id = $2
      `,
      [roleId, permissionRows[0].id],
    );
  }

  async findPermissionKeysByRoleId(
    roleId: string,
  ): Promise<PermissionKey[]> {
    const rows = await this.database.query<PermissionKeyRow>(
      `
        SELECT permissions.key
        FROM role_permissions
        INNER JOIN permissions
          ON permissions.id = role_permissions.permission_id
        WHERE role_permissions.role_id = $1
        ORDER BY permissions.key ASC
      `,
      [roleId],
    );

    return rows.map((row) => row.key);
  }
}