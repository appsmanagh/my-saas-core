//7. se crea este file para acoplar las function diseñadas en este api a las 
// functions propias de la linreria pg para manejar postgress

import { Pool } from "pg";
import { env } from "../../../config/env";
import type { Database } from "../../database";

export class PostgresDatabase implements Database {
  private readonly pool: Pool;

  constructor() {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for PostgreSQL");
    }

    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
    });
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();

    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");

      return true;
    } catch {
      return false;
    }
  }

  //7. esta function es para acceder a los querys por medio de pg, 
  // es una function dedicada a esto por lo que se comento que :
  // private readonly pool: Pool; quedo como variable privada
  async query<T>(
    text: string,
    values: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, values);

    return result.rows;
  }
}