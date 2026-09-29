
// 14. Buscar sesión
// findByTokenHash()

// Cuando llegue una petición autenticada:

// token
//  ↓
// hash
//  ↓
// findByTokenHash()
// Crear
// create()

// Para el login.

// Eliminar una sesión
// delete()

// Para logout.

// Eliminar todas las sesiones de un usuario
// deleteByUserId()

// Esto será útil, por ejemplo, para:

// "cerrar sesión en todos los dispositivos"
// Limpiar sesiones expiradas
// deleteExpired()

// Más adelante podremos ejecutarlo periódicamente.

import type { Session } from "./session";

export interface SessionRepository {
  findByTokenHash(
    tokenHash: string,
  ): Promise<Session | null>;

  create(session: Session): Promise<Session>;

  delete(sessionId: string): Promise<void>;

  deleteByUserId(userId: string): Promise<void>;

  deleteExpired(): Promise<void>;
}