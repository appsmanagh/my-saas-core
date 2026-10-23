
import { randomUUID } from "node:crypto";

import type { Database } from "../../database/database";
//36. se agrega de modulo de transaction support
import type { DatabaseTransaction } from "../../database/transactional-database";
import type { OrganizationRepository } from "../organization-repository";
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../organization";

import { translatePostgresError } from "../../database/adapters/postgres/postgres-error";

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresOrganizationRepository
  implements OrganizationRepository
{
  constructor(private readonly database: Database) {}

  //36. ¿Por qué así?
  // - Si llamas create(input), usa el Database del repositorio como antes.
  // - Si llamas create(input, transaction), la inserción usa la transacción que le pasó el servicio coordinador.
  // - El SQL y la traducción de errores se mantienen en un solo lugar.
  
  async create(
    input: CreateOrganizationInput,
    transaction?: DatabaseTransaction,
  ): Promise<Organization> {
    const id = randomUUID();

    const sql = `
      INSERT INTO organizations (id, name, slug)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug, created_at, updated_at
    `;

    const values = [id, input.name, input.slug];

    try {
      const rows = transaction
        ? await transaction.query<OrganizationRow>(sql, values)
        : await this.database.query<OrganizationRow>(sql, values);

      return this.toOrganization(rows[0]);
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async findById(id: string): Promise<Organization | null> {
    const rows = await this.database.query<OrganizationRow>(
      `
        SELECT id, name, slug, created_at, updated_at
        FROM organizations
        WHERE id = $1
      `,
      [id],
    );

    return rows.length > 0 ? this.toOrganization(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const rows = await this.database.query<OrganizationRow>(
      `
        SELECT id, name, slug, created_at, updated_at
        FROM organizations
        WHERE slug = $1
      `,
      [slug],
    );

    return rows.length > 0 ? this.toOrganization(rows[0]) : null;
  }

  async findAll(): Promise<Organization[]> {
    const rows = await this.database.query<OrganizationRow>(
      `
        SELECT id, name, slug, created_at, updated_at
        FROM organizations
        ORDER BY name ASC
      `,
    );

    return rows.map((row) => this.toOrganization(row));
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization | null> {
    const assignments: string[] = [];
    const values: unknown[] = [id];

    if (input.name !== undefined) {
      values.push(input.name);
      assignments.push(`name = $${values.length}`);
    }

    if (input.slug !== undefined) {
      values.push(input.slug);
      assignments.push(`slug = $${values.length}`);
    }

    if (assignments.length === 0) {
      return this.findById(id);
    }

    assignments.push("updated_at = NOW()");

    try {
      const rows = await this.database.query<OrganizationRow>(
        `
          UPDATE organizations
          SET ${assignments.join(", ")}
          WHERE id = $1
          RETURNING id, name, slug, created_at, updated_at
        `,
        values,
      );

      return rows.length > 0 ? this.toOrganization(rows[0]) : null;
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async delete(id: string): Promise<void> {
    await this.database.query(
      "DELETE FROM organizations WHERE id = $1",
      [id],
    );
  }

  private toOrganization(row: OrganizationRow): Organization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}