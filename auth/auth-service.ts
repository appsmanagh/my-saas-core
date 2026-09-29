//17. este es el service de auth

import type { User } from "../users/user";
// 17. 5. ¿Por qué AuthService llama a UserService?

// Porque no queremos duplicar:

// email normalization
// name validation
// duplicate email checking
// user creation
// user ID generation
// status
// timestamps

// Todo eso ya pertenece a:

// UserService
import type { UserService } from "../users/user-service";

import type { AuthRepository } from "./auth-repository";
import type { PasswordService } from "./password-service";
import type { SessionRepository } from "./sessions/session-repository";
import { SessionTokenService } from "./sessions/session-token-service";

import {
  ConflictError,
  UnauthorizedError,
} from "../errors";

export interface AuthSessionResult {
  user: User;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private readonly sessionTokenService =
    new SessionTokenService();

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    const user = await this.userService.createUser({
      email: input.email,
      name: input.name,
    });

    const existingCredentials =
      await this.authRepository.findByUserId(user.id);

    if (existingCredentials) {
      throw new ConflictError(
        "Authentication credentials already exist",
      );
    }

    const passwordHash =
      await this.passwordService.hashPassword(
        input.password,
      );

    const now = new Date();

    await this.authRepository.create({
      userId: user.id,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<AuthSessionResult> {


    const user =
    await this.userService.findUserByEmail(email);

    if (!user) {
        throw new UnauthorizedError(
            "Invalid email or password",
        );
    }

    const credentials =
      await this.authRepository.findByUserId(
        user.id,
      );

    if (!credentials) {
      throw new UnauthorizedError(
        "Invalid email or password",
      );
    }

    const passwordValid =
      await this.passwordService.verifyPassword(
        password,
        credentials.passwordHash,
      );

    if (!passwordValid) {
      throw new UnauthorizedError(
        "Invalid email or password",
      );
    }

    const token =
      this.sessionTokenService.generateToken();

    const tokenHash =
      this.sessionTokenService.hashToken(token);

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + 1000 * 60 * 60 * 24 * 7,
    );

    const session = {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
      createdAt: now,
    };

    await this.sessionRepository.create(session);

    return {
      user,
      token,
      expiresAt,
    };
  }
}