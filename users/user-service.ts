//5. este es el file service que menja validations, 
// mi pregunta es aqui van todas las functions get update delete etc ??

import type { UserRepository } from "./user-repository";
import type { CreateUserInput, User } from "./user";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    if (!email) {
      throw new Error("Email is required");
    }

    if (!name) {
      throw new Error("Name is required");
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    const now = new Date();

    const user: User = {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: now,
      updatedAt: now,
    };

    return this.userRepository.create(user);
  }
}