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

//21. se importa el login-rate-limit
import {
  LoginRateLimit,
} from "../security/login-rate-limit";

import {
  ConflictError,
  UnauthorizedError,
} from "../errors";

//21. se importa el modulo de validate password
import {
  validatePassword,
} from "../security/password-policy";

export interface AuthSessionResult {
  user: User;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private readonly sessionTokenService =
    new SessionTokenService();

    //21. se incluye el rite limiter en el constructor
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly authRepository: AuthRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly loginRateLimit: LoginRateLimit,
  ) {}

  async register(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {


//21. asi se usa el modulo de validate password
    validatePassword(input.password);

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
    input: {
      email: string;
      password: string;
      ip: string;
    },
  ): Promise<AuthSessionResult> {

    const normalizedEmail =
      input.email.trim().toLowerCase();


    // 21. Comprobar rate limit
    await this.loginRateLimit.check({
      ip: input.ip,
      email: normalizedEmail,
    });


    // 2. Buscar usuario
    const user =
      await this.userService.findUserByEmail(
        normalizedEmail,
      );


    // 21. Usuario inexistente
    if (!user) {

      await this.loginRateLimit.recordFailure({
        ip: input.ip,
        email: normalizedEmail,
      });

      throw new UnauthorizedError(
        "Invalid email or password",
      );
    }


    // 4. Buscar credenciales
    const credentials =
      await this.authRepository.findByUserId(
        user.id,
      );


    // 21. Credenciales inexistentes
    if (!credentials) {

      await this.loginRateLimit.recordFailure({
        ip: input.ip,
        email: normalizedEmail,
      });

      throw new UnauthorizedError(
        "Invalid email or password",
      );
    }


    // 6. Verificar contraseña
    const passwordValid =
      await this.passwordService.verifyPassword(
        input.password,
        credentials.passwordHash,
      );


    // 21. Contraseña incorrecta
    if (!passwordValid) {

      await this.loginRateLimit.recordFailure({
        ip: input.ip,
        email: normalizedEmail,
      });

      throw new UnauthorizedError(
        "Invalid email or password",
      );
    }


    // 21. Login correcto → limpiar rate limit
    await this.loginRateLimit.reset({
      ip: input.ip,
      email: normalizedEmail,
    });


    // 9. Generar token de sesión
    const token =
      this.sessionTokenService.generateToken();


    // 10. Hashear token antes de almacenarlo
    const tokenHash =
      this.sessionTokenService.hashToken(token);


    // 11. Crear sesión
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


    await this.sessionRepository.create(
      session,
    );


    // 12. Devolver token real al API
    return {
      user,
      token,
      expiresAt,
    };
  }

  //18. esta funtion es para validar una session 
  async getUserBySessionToken(
    token: string,
  ): Promise<User> {
    if (!token) {
      throw new UnauthorizedError(
        "Invalid session",
      );
    }

    const tokenHash =
      this.sessionTokenService.hashToken(token);

    const session =
      await this.sessionRepository.findByTokenHash(
        tokenHash,
      );

    if (!session) {
      throw new UnauthorizedError(
        "Invalid session",
      );
    }

    const user =
      await this.userService.getUserById(
        session.userId,
      );

    if (user.status !== "active") {
      throw new UnauthorizedError(
        "Invalid session",
      );
    }

    return user;
  }

//18. function de logout
  async logout(token: string): Promise<void> {
    if (!token) {
      return;
    }

    const tokenHash =
      this.sessionTokenService.hashToken(token);

    const session =
      await this.sessionRepository.findByTokenHash(
        tokenHash,
      );

    if (!session) {
      return;
    }

    await this.sessionRepository.delete(
      session.id,
    );
  }
}