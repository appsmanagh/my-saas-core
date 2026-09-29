// 14. este file es el contrato de auth 

import type { AuthCredentials } from "./auth-credentials";

export interface AuthRepository {
  findByUserId(userId: string): Promise<AuthCredentials | null>;

  create(credentials: AuthCredentials): Promise<AuthCredentials>;

  update(credentials: AuthCredentials): Promise<AuthCredentials | null>;

  deleteByUserId(userId: string): Promise<void>;
}