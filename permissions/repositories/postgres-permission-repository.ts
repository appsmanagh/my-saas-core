//28. PostgresPermissionRepository implementa ese contrato usando SQL parametrizado.


import type { Database } from "../../database/database";
import type { PermissionRepository } from "../permission-repository";
import type { Permission, PermissionKey } from "../permission";

interface PermissionRow {
  id: string;
  key: PermissionKey;
  description: string;
  created_at: Date;
}

export class PostgresPermissionRepository implements PermissionRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Permission | null> {
    const rows = await this.database.query<PermissionRow>(
      `
        SELECT id, key, description, created_at
        FROM permissions
        WHERE id = $1
      `,
      [id],
    );

    return rows.length > 0 ? this.toPermission(rows[0]) : null;
  }

  async findByKey(key: PermissionKey): Promise<Permission | null> {
    const rows = await this.database.query<PermissionRow>(
      `
        SELECT id, key, description, created_at
        FROM permissions
        WHERE key = $1
      `,
      [key],
    );

    return rows.length > 0 ? this.toPermission(rows[0]) : null;
  }

  async findByKeys(keys: PermissionKey[]): Promise<Permission[]> {
    if (keys.length === 0) {
      return [];
    }

    const rows = await this.database.query<PermissionRow>(
      `
        SELECT id, key, description, created_at
        FROM permissions
        WHERE key = ANY($1::varchar[])
      `,
      [keys],
    );

    return rows.map((row) => this.toPermission(row));
  }

  async findAll(): Promise<Permission[]> {
    const rows = await this.database.query<PermissionRow>(
      `
        SELECT id, key, description, created_at
        FROM permissions
        ORDER BY key ASC
      `,
    );

    return rows.map((row) => this.toPermission(row));
  }

  private toPermission(row: PermissionRow): Permission {
    return {
      id: row.id,
      key: row.key,
      description: row.description,
      createdAt: row.created_at,
    };
  }
}