
import type { Database } from "./database";

export interface DatabaseTransaction {
  query<T>(
    text: string,
    values?: unknown[],
  ): Promise<T[]>;
}

export interface TransactionalDatabase extends Database {
  transaction<T>(
    callback: (
      transaction: DatabaseTransaction,
    ) => Promise<T>,
  ): Promise<T>;
}

// 33. Aquí estamos definiendo dos cosas:

// DatabaseTransaction: permite ejecutar consultas dentro de una transacción.

// TransactionalDatabase: amplía el contrato Database con la capacidad de ejecutar una función transaccional.