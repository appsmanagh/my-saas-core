
import type { TransactionalDatabase } from "../../database/transactional-database";
import type { DatabaseTransaction } from "../../database/transactional-database";

import type {
  OrganizationMember,
  CreateOrganizationMemberInput,
} from "../organization-member";

import type { OrganizationMemberRepository } from "../organization-member-repository";

import { translatePostgresError } from "../../database/adapters/postgres/postgres-error";

interface OrganizationMemberRow {
  user_id: string;
  organization_id: string;
  role_id: string;
  created_at: Date;
}

export class PostgresOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  constructor(
    private readonly database: TransactionalDatabase,
  ) {}

  async create(
    input: CreateOrganizationMemberInput,
  ): Promise<OrganizationMember> {
    try {
      const rows = await this.database.query<OrganizationMemberRow>(
        `
          INSERT INTO organization_members (
            user_id,
            organization_id,
            role_id
          )
          VALUES ($1, $2, $3)
          RETURNING user_id, organization_id, role_id, created_at
        `,
        [input.userId, input.organizationId, input.roleId],
      );

      return this.toOrganizationMember(rows[0]);
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null> {
    const rows = await this.database.query<OrganizationMemberRow>(
      `
        SELECT user_id, organization_id, role_id, created_at
        FROM organization_members
        WHERE user_id = $1
          AND organization_id = $2
      `,
      [userId, organizationId],
    );

    return rows.length > 0
      ? this.toOrganizationMember(rows[0])
      : null;
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    const rows = await this.database.query<OrganizationMemberRow>(
      `
        SELECT user_id, organization_id, role_id, created_at
        FROM organization_members
        WHERE organization_id = $1
        ORDER BY created_at ASC
      `,
      [organizationId],
    );

    return rows.map((row) => this.toOrganizationMember(row));
  }

  async updateRole(
    userId: string,
    organizationId: string,
    roleId: string,
  ): Promise<OrganizationMember | null> {
    try {
      const rows = await this.database.query<OrganizationMemberRow>(
        `
          UPDATE organization_members
          SET role_id = $3
          WHERE user_id = $1
            AND organization_id = $2
          RETURNING user_id, organization_id, role_id, created_at
        `,
        [userId, organizationId, roleId],
      );

      return rows.length > 0
        ? this.toOrganizationMember(rows[0])
        : null;
    } catch (error) {
      translatePostgresError(error);
    }
  }

  async delete(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    await this.database.query(
      `
        DELETE FROM organization_members
        WHERE user_id = $1
          AND organization_id = $2
      `,
      [userId, organizationId],
    );
  }

  private toOrganizationMember(
    row: OrganizationMemberRow,
  ): OrganizationMember {
    return {
      userId: row.user_id,
      organizationId: row.organization_id,
      roleId: row.role_id,
      createdAt: row.created_at,
    };
  }
}
