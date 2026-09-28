//4. este es le repository de user 
//aqui van las demas functions propias de user
// UserRepository no sabe absolutamente nada de:
// Supabase
// PostgreSQL
// MongoDB
// Neon
// InMemoryDatabase

import type { User } from "./user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  create(user: User): Promise<User>;

  update(user: User): Promise<User | null>;

  delete(id: string): Promise<void>;
}