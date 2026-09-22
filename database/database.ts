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
}