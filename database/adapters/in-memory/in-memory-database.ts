

import type { Database } from "../../database";

// 3. Esta clase será una implementación concreta del contrato Database.
export class InMemoryDatabase implements Database {

// 3. Al inicio la db esta disconect y cambia cuando se conecta
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }
}