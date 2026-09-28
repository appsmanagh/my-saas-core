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


async createUser(input: {
  email: string;
  name: string;
}): Promise<User> {
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

  const existingUser =
    await this.userRepository.findByEmail(email);

  if (existingUser) {
      //6. asi se usa este module de error
    throw new ConflictError(
      "A user with this email already exists",
    );
  }

  const now = new Date();
  //12. aqui se agrego la nueva column de status
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name,
    status: "active",
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

// 12. Se agrego esta function al user-service
async getUserByEmail(email: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new ValidationError("Email is required");
  }

  const user =
    await this.userRepository.findByEmail(normalizedEmail);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

// 12. Se agrego esta function al user-service
// No queremos permitir que cualquier actualización cambie cosas que pertenecen a auth.
// Por ejemplo:
// ❌ password
// ❌ email verification
// ❌ sessions
// ❌ login attempts
// Eso irá en auth/.
async updateProfile(
  id: string,
  input: {
    name: string;
  },
): Promise<User> {
  const user = await this.getUserById(id);

  const name = input.name.trim();

  if (!name) {
    throw new ValidationError("Name is required");
  }

  user.name = name;
  user.updatedAt = new Date();

  return this.userRepository.update(user);
}

// 12. Se agrego esta function al user-service
async activateUser(id: string): Promise<User> {
  const user = await this.getUserById(id);

  if (user.status === "active") {
    return user;
  }

  user.status = "active";
  user.updatedAt = new Date();

  return this.userRepository.update(user);
}

// 12. Se agrego esta function al user-service
async deactivateUser(id: string): Promise<User> {
  const user = await this.getUserById(id);

  if (user.status === "inactive") {
    return user;
  }

  user.status = "inactive";
  user.updatedAt = new Date();

  return this.userRepository.update(user);
}

// 12. Se agrego esta function al user-service
async deleteUser(id: string): Promise<void> {
  await this.getUserById(id);

  await this.userRepository.delete(id);
}

}