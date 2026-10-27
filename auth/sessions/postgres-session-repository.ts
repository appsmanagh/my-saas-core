import type { Database } from "../../database/database";
import type { SessionRepository } from "./session-repository";
import type { Session } from "./session";

interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export class PostgresSessionRepository
  implements SessionRepository
{
  constructor(
    private readonly database: Database,
  ) {}

  async findByTokenHash(
    tokenHash: string,
  ): Promise<Session | null> {
    const rows = await this.database.query<SessionRow>(
      `
        SELECT
          id,
          user_id,
          token_hash,
          expires_at,
          created_at
        FROM auth_sessions
        WHERE token_hash = $1
          AND expires_at > NOW()
      `,
      [tokenHash],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return this.toSession(row);
  }

  async create(
    session: Session,
  ): Promise<Session> {
    const rows = await this.database.query<SessionRow>(
      `
        INSERT INTO auth_sessions (
          id,
          user_id,
          token_hash,
          expires_at,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          user_id,
          token_hash,
          expires_at,
          created_at
      `,
      [
        session.id,
        session.userId,
        session.tokenHash,
        session.expiresAt,
        session.createdAt,
      ],
    );

    const row = rows[0];

    if (!row) {
      throw new Error(
        "Creating session returned no row",
      );
    }

    return this.toSession(row);
  }

  async delete(sessionId: string): Promise<void> {
    await this.database.query(
      `
        DELETE FROM auth_sessions
        WHERE id = $1
      `,
      [sessionId],
    );
  }

  async deleteByUserId(
    userId: string,
  ): Promise<void> {
    await this.database.query(
      `
        DELETE FROM auth_sessions
        WHERE user_id = $1
      `,
      [userId],
    );
  }

  async deleteExpired(): Promise<void> {
    await this.database.query(
      `
        DELETE FROM auth_sessions
        WHERE expires_at <= NOW()
      `,
    );
  }

  private toSession(
    row: SessionRow,
  ): Session {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }
}