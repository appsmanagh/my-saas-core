// 3. Tenemos un contrato:
//Ahora cualquier implementación futura tendrá que respetarlo.
// Por ejemplo, imaginariamente:
// SupabaseDatabase
//        │
//        ├── connect()
//        ├── disconnect()
//        └── healthCheck()
// Y:
// PostgresDatabase
//        │
//        ├── connect()
//        ├── disconnect()
//        └── healthCheck()
// Los dos cumplen:
// Database



export interface Database {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
// 7. Se agrego esto porque nadie puede acceder al pool desde fuera.
//Eso está bien para encapsulación, pero ahora necesitamos una forma controlada de ejecutar queries.
  query<T>(
    text: string,
    values?: unknown[],
  ): Promise<T[]>;
}