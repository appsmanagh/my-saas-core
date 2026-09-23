//5. este es el file service que menja validations, 
// mi pregunta es aqui van todas las functions get update delete etc ??

import type { UserRepository } from "./user-repository";
import type { CreateUserInput, User } from "./user";

// 6. asi se usa el module de errors
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../errors";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    if (!email) {
    //6. asi se usa este module de error
      throw new ValidationError("Email is required");
    }

    if (!name) {
        //6. asi se usa este module de error
      throw new ValidationError("Name is required");
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
        //6. asi se usa este module de error
      throw new ConflictError(
        "A user with this email already exists",
        );
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

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
    }
}