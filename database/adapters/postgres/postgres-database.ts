//7. se crea este file para acoplar las function diseñadas en este api a las 
// functions propias de la linreria pg para manejar postgress
import { Pool } from "pg";
import { env } from "../../../config/env";
import type { Database } from "../../database";
//33. se importan las functions para el transactional support
import type {
  DatabaseTransaction,
  TransactionalDatabase,
} from "../../transactional-database";

export class PostgresDatabase implements Database, TransactionalDatabase {
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
    const result = await this.pool.query(text, values);
    return result.rows as T[];
  }

  //33. se agrega esta function para transactional support

  //33. ¿Qué hace el código nuevo?

  // BEGIN
  // PostgreSQL inicia la transacción en una conexión reservada.
  // Ejecutar consultas
  // Todas usan el mismo cliente, en vez de llamar a pool.query() por separado.
  // Éxito: COMMIT
  //   Se confirman todas las operaciones.
  // Error: ROLLBACK
  //   Se revierten las operaciones de la transacción.
  async transaction<T>(
    callback: (
      transaction: DatabaseTransaction,
    ) => Promise<T>,
  ): Promise<T> {
    //33. All queries in this transaction use the same connection.
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const transaction: DatabaseTransaction = {

        query: async <Row>(
          text: string,
          values: unknown[] = [],
        ): Promise<Row[]> => {
          const result = await client.query(text, values);
          return result.rows as Row[];
        },
      };

      try {
        const result = await callback(transaction);

        await client.query("COMMIT");

        return result;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // Preserve the original error if rollback also fails.
        }

        throw error;
      }
    } finally {
      client.release();
    }
  }
}