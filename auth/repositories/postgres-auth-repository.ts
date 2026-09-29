// ete files es el repository de auth 

import type { Database } from "../../database/database";
import type { AuthRepository } from "../auth-repository";
import type { AuthCredentials } from "../auth-credentials";

interface AuthCredentialsRow {
  user_id: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(
    private readonly database: Database,
  ) {}

  async findByUserId(
    userId: string,
  ): Promise<AuthCredentials | null> {
    const rows =
      await this.database.query<AuthCredentialsRow>(
        `
          SELECT
            user_id,
            password_hash,
            created_at,
            updated_at
          FROM auth_credentials
          WHERE user_id = $1
        `,
        [userId],
      );

    if (rows.length === 0) {
      return null;
    }

    return this.toCredentials(rows[0]);
  }

  async create(
    credentials: AuthCredentials,
  ): Promise<AuthCredentials> {
    const rows =
      await this.database.query<AuthCredentialsRow>(
        `
          INSERT INTO auth_credentials (
            user_id,
            password_hash,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4)
          RETURNING
            user_id,
            password_hash,
            created_at,
            updated_at
        `,
        [
          credentials.userId,
          credentials.passwordHash,
          credentials.createdAt,
          credentials.updatedAt,
        ],
      );

    return this.toCredentials(rows[0]);
  }

  async update(
    credentials: AuthCredentials,
  ): Promise<AuthCredentials | null> {
    const rows =
      await this.database.query<AuthCredentialsRow>(
        `
          UPDATE auth_credentials
          SET
            password_hash = $2,
            updated_at = $3
          WHERE user_id = $1
          RETURNING
            user_id,
            password_hash,
            created_at,
            updated_at
        `,
        [
          credentials.userId,
          credentials.passwordHash,
          credentials.updatedAt,
        ],
      );

    if (rows.length === 0) {
      return null;
    }

    return this.toCredentials(rows[0]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.database.query(
      `
        DELETE FROM auth_credentials
        WHERE user_id = $1
      `,
      [userId],
    );
  }

  private toCredentials(
    row: AuthCredentialsRow,
  ): AuthCredentials {
    return {
      userId: row.user_id,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}