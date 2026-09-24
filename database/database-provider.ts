
// 3. "¿Qué implementación de Database voy a utilizar?"
// EX: 
// No queremos que users haga esto:
    // const database = new InMemoryDatabase();

import { env } from "../config/env";
import type { Database } from "./database";
import { InMemoryDatabase } from "./adapters/in-memory/in-memory-database";

//7. añadimos la dddbb de postgres 
import { PostgresDatabase } from "./adapters/postgres/postgres-database";

export function createDatabase(): Database {
  switch (env.DATABASE_PROVIDER) {
    case "in-memory":
      return new InMemoryDatabase();

    case "supabase":
      throw new Error("Supabase database adapter is not implemented yet.");

    case "postgres":
      return new PostgresDatabase();
      //7. el case postgres es para la ddbb de postgres

    default:
      throw new Error(
        `Unsupported database provider: ${env.DATABASE_PROVIDER}`,
      );
  }
}