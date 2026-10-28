// 32. Qué hace cada método
// assign: busca el permiso en el catálogo y guarda su ID junto al ID del rol. Si ya estaba asignado, no duplica la fila.
// remove: resuelve el ID del permiso y elimina la asociación.
// findPermissionKeysByRoleId: hace un JOIN para devolver claves legibles, como "users:read", en lugar de IDs.
// La asignación es idempotente: llamar assign dos veces con el mismo rol y permiso deja una sola asociación. Eso es útil para APIs, donde un cliente podría repetir una petición.

//34. se reemplaza este import de database
//import type { Database } from "../../database/database";
//34. por el import de TransactionalDatabase
import type {
  TransactionalDatabase,
  DatabaseTransaction,
} from "../../database/transactional-database";

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
  constructor(
    private readonly database: TransactionalDatabase,
  ) {}
   //36. se agrego transaction?: DatabaseTransaction, a esta funcion para transaction support organization+rolowner+permissions+membresia
  async assign(
    roleId: string,
    permissionKey: PermissionKey,
    transaction?: DatabaseTransaction,
  ): Promise<void> {
    await this.assignMany(roleId, [permissionKey], transaction);
  }
   //36. se agrego transaction?: DatabaseTransaction, a esta funcion para transaction support organization+rolowner+permissions+membresia
  //36.  ¿Qué conseguimos?
  // - Transacción externa: si pasas transaction, las consultas utilizan esa transacción sin abrir otra.
  // - Llamada independiente: si no pasas una, assignMany() abre su propia transacción como antes.
  // - Asignación individual: assign() reutiliza la lógica de assignMany(), evitando duplicación.
  // - Permisos inexistentes: se detectan antes de insertar asignaciones.
  // - Duplicados: se mantienen idempotentes gracias a ON CONFLICT DO NOTHING.
  // Un detalle importante: cuando se proporciona una transacción externa, el servicio que la abrió es responsable de hacer COMMIT o ROLLBACK. El repositorio no debe finalizarla por su cuenta.
  async assignMany(
    roleId: string,
    permissionKeys: PermissionKey[],
    transaction?: DatabaseTransaction,
  ): Promise<void> {
    if (permissionKeys.length === 0) {
      return;
    }

    try {
      if (transaction) {
        await this.assignManyInTransaction(
          transaction,
          roleId,
          permissionKeys,
        );
        return;
      }

      await this.database.transaction(async (tx) => {
        await this.assignManyInTransaction(
          tx,
          roleId,
          permissionKeys,
        );
      });
    } catch (error) {
      translatePostgresError(error);
    }
  }

  private async assignManyInTransaction(
    transaction: DatabaseTransaction,
    roleId: string,
    permissionKeys: PermissionKey[],
  ): Promise<void> {
    // 1. Resolve all permission keys to database IDs.
    const permissionRows = await transaction.query<{
      id: string;
      key: PermissionKey;
    }>(
      `
        SELECT id, key
        FROM permissions
        WHERE key = ANY($1)
      `,
      [permissionKeys],
    );

    // 2. Ensure every requested permission exists.
    const permissionIds = new Map(
      permissionRows.map((row) => [row.key, row.id]),
    );

    const missingKeys = [
      ...new Set(permissionKeys.filter(
        (key) => !permissionIds.has(key),
      )),
    ];

    if (missingKeys.length > 0) {
      throw new NotFoundError(
        `Permission not found: ${missingKeys.join(", ")}`,
      );
    }

    // 3. Insert all assignments using the same transaction.
    for (const permissionKey of new Set(permissionKeys)) {
      const permissionId = permissionIds.get(permissionKey)!;

      await transaction.query<AssignedRoleRow>(
        `
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
          RETURNING role_id
        `,
        [roleId, permissionId],
      );
    }
  }

  async remove(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void> {
    const permissionRows = await this.database.query<PermissionIdRow>(
      `
        SELECT id
        FROM permissions
        WHERE key = $1
      `,
      [permissionKey],
    );

    const permissionRow = permissionRows[0];

    if (!permissionRow) {
      throw new NotFoundError("Permission not found");
    }

    await this.database.query(
      `
        DELETE FROM role_permissions
        WHERE role_id = $1
          AND permission_id = $2
      `,
      [roleId, permissionRow.id],
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
