
//7. se crea este file como ultima capa de comunicacion entre el api y la ddbb postgres

//7. Mira:
// WHERE id = $1
// y:
// [id]
// No estamos haciendo:
// `WHERE id = '${id}'`
// Eso es importante porque queremos utilizar parameterized queries.
// Esto será una de las bases de nuestro módulo security.

import type { Database } from "../../database/database";
import type { UserRepository } from "../user-repository";
import type { User } from "../user";

//8. asi se implementa el modulo de postgress errors
//11. race conditions
import { translatePostgresError } from "../../database/adapters/postgres/postgres-error";

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.database.query<UserRow>(
      `
        SELECT
          id,
          email,
          name,
          created_at,
          updated_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.toUser(rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.database.query<UserRow>(
      `
        SELECT
          id,
          email,
          name,
          created_at,
          updated_at
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.toUser(rows[0]);
  }

  async create(user: User): Promise<User> {
    //8. se uso este try para implementar postgress errors
    //11. race conditions
        try {
            const rows = await this.database.query<UserRow>(
            `
                INSERT INTO users (
                id,
                email,
                name,
                created_at,
                updated_at
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                id,
                email,
                name,
                created_at,
                updated_at
            `,
            [
                user.id,
                user.email,
                user.name,
                user.createdAt,
                user.updatedAt,
            ],
            );

            return this.toUser(rows[0]);
        } catch (error) {
            //8. esi se usa postgres errors, 
            // esta validation tambien se hace en userservice al momento de crear el user 
            // pero agregando esta validation se garantiza que no se creen dos registros con el mismo email
            //11. race conditions
            translatePostgresError(error);
        }
    }

  async update(user: User): Promise<User> {
    const rows = await this.database.query<UserRow>(
      `
        UPDATE users
        SET
          email = $2,
          name = $3,
          updated_at = $4
        WHERE id = $1
        RETURNING
          id,
          email,
          name,
          created_at,
          updated_at
      `,
      [
        user.id,
        user.email,
        user.name,
        user.updatedAt,
      ],
    );

    if (rows.length === 0) {
      throw new Error("User not found");
    }

    return this.toUser(rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.database.query(
      `
        DELETE FROM users
        WHERE id = $1
      `,
      [id],
    );
  }

  private toUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}