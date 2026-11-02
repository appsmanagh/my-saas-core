
import type { Database } from "../../database/database";
//36. se agrega de modulo de transaction support
import type { DatabaseTransaction } from "../../database/transactional-database";

import type { RoleRepository } from "../role-repository";
import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "../role";

import { translatePostgresError } from "../../database/adapters/postgres/postgres-error";

//44. se agrego la column is_system para proteger el role owner
//44. se agrego tambien en las functions
interface RoleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgresRoleRepository implements RoleRepository {
  constructor(private readonly database: Database) {}

  //36. ¿Por qué así?
  // - Si llamas create(input), usa el Database del repositorio como antes.
  // - Si llamas create(input, transaction), la inserción usa la transacción que le pasó el servicio coordinador.
  // - El SQL y la traducción de errores se mantienen en un solo lugar.
  async create(
    input: CreateRoleInput,
    transaction?: DatabaseTransaction,
  ): Promise<Role> {
    const id = crypto.randomUUID();
    const now = new Date();

    const sql = `
      INSERT INTO roles (
        id,
        organization_id,
        name,
        description,
        is_system,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        organization_id,
        name,
        description,
        is_system,
        created_at,
        updated_at
    `;

    const values = [
      id,
      input.organizationId,
      input.name,
      input.description ?? null,
      input.isSystem ?? false,
      now,
      now,
    ];

    try {
      const rows = transaction
        ? await transaction.query<RoleRow>(sql, values)
        : await this.database.query<RoleRow>(sql, values);

      const row = rows[0];

      if (!row) {
        throw new Error("Failed to create role: no row returned");
      }

      return this.toRole(row);
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async findById(id: string): Promise<Role | null> {
    const rows = await this.database.query<RoleRow>(
      `
        SELECT
          id,
          organization_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        FROM roles
        WHERE id = $1
      `,
      [id],
    );

    const row = rows[0];

    return row ? this.toRole(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<Role | null> {
    const rows = await this.database.query<RoleRow>(
      `
        SELECT
          id,
          organization_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        FROM roles
        WHERE organization_id = $1
          AND name = $2
      `,
      [organizationId, name],
    );

    const row = rows[0];

    return row ? this.toRole(row) : null;
  }

  async findByOrganization(organizationId: string): Promise<Role[]> {
    const rows = await this.database.query<RoleRow>(
      `
        SELECT
          id,
          organization_id,
          name,
          description,
          is_system,
          created_at,
          updated_at
        FROM roles
        WHERE organization_id = $1
        ORDER BY name ASC
      `,
      [organizationId],
    );

    return rows.map((row) => this.toRole(row));
  }

  async update(
    id: string,
    input: UpdateRoleInput,
  ): Promise<Role | null> {
    const assignments: string[] = [];
    const values: unknown[] = [id];

    if (input.name !== undefined) {
      values.push(input.name);
      assignments.push(`name = $${values.length}`);
    }

    if (input.description !== undefined) {
      values.push(input.description);
      assignments.push(`description = $${values.length}`);
    }

    if (assignments.length === 0) {
      return this.findById(id);
    }

    assignments.push("updated_at = NOW()");

    try {
      const rows = await this.database.query<RoleRow>(
        `
          UPDATE roles
          SET ${assignments.join(", ")}
          WHERE id = $1
          RETURNING
            id,
            organization_id,
            name,
            description,
            is_system,
            created_at,
            updated_at
        `,
        values,
      );

      const row = rows[0];

      return row ? this.toRole(row) : null;
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.database.query(
        `
          DELETE FROM roles
          WHERE id = $1
        `,
        [id],
      );
    } catch (error) {
      translatePostgresError(error);
    }
  }

  private toRole(row: RoleRow): Role {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      isSystem: row.is_system,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
