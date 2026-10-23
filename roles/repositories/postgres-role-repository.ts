


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

interface RoleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
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
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        organization_id,
        name,
        description,
        created_at,
        updated_at
    `;

    const values = [
      id,
      input.organizationId,
      input.name,
      input.description ?? null,
      now,
      now,
    ];

    try {
      const rows = transaction
        ? await transaction.query<RoleRow>(sql, values)
        : await this.database.query<RoleRow>(sql, values);

      return this.toRole(rows[0]);
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
          created_at,
          updated_at
        FROM roles
        WHERE id = $1
      `,
      [id],
    );

    return rows.length > 0 ? this.toRole(rows[0]) : null;
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
          created_at,
          updated_at
        FROM roles
        WHERE organization_id = $1
          AND name = $2
      `,
      [organizationId, name],
    );

    return rows.length > 0 ? this.toRole(rows[0]) : null;
  }

  async findByOrganization(organizationId: string): Promise<Role[]> {
    const rows = await this.database.query<RoleRow>(
      `
        SELECT
          id,
          organization_id,
          name,
          description,
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
          created_at,
          updated_at
      `,
      values,
    );

    return rows.length > 0 ? this.toRole(rows[0]) : null;
  }

  async delete(id: string): Promise<void> {
    await this.database.query(
      `
        DELETE FROM roles
        WHERE id = $1
      `,
      [id],
    );
  }

  private toRole(row: RoleRow): Role {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}