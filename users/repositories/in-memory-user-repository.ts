// 4. se crea este file simulando una mini DDBB

import type { UserRepository } from "../user-repository";
import type { User } from "../user";

export class InMemoryUserRepository implements UserRepository {
  //4. Es básicamente nuestra mini base de datos temporal:
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);

    return user;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);

    return user;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  
}