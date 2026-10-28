// 17. este es el service de auth

import { createDatabase } from "../../database/database-provider";

import { UserService } from "../../users/user-service";
import { PostgresUserRepository } from "../../users/repositories/postgres-user-repository";

import { PasswordService } from "../../auth/password-service";
import { PostgresAuthRepository } from "../../auth/repositories/postgres-auth-repository";

import { PostgresSessionRepository } from "../../auth/sessions/postgres-session-repository";

import { AuthService } from "../../auth/auth-service";

import { InMemoryRateLimiter } from "../../security/adapters/in-memory-rate-limiter";
import { LoginRateLimit } from "../../security/login-rate-limit";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const userRepository =
      new PostgresUserRepository(database);

    const userService =
      new UserService(userRepository);

    const passwordService =
      new PasswordService();

    const authRepository =
      new PostgresAuthRepository(database);

    const sessionRepository =
      new PostgresSessionRepository(database);

    const loginRateLimit = new LoginRateLimit(
      new InMemoryRateLimiter(10, 60),
      new InMemoryRateLimiter(5, 60),
    );

    const authService =
      new AuthService(
        userService,
        passwordService,
        authRepository,
        sessionRepository,
        loginRateLimit
      );

    const email =
      `auth-test-${crypto.randomUUID()}@example.com`;

    const password =
      "MySuperSecurePassword123!";

    // REGISTER

    const user =
      await authService.register({
        email,
        name: "Auth Test User",
        password,
      });

    console.log("1. REGISTER");
    console.log(user);

    // LOGIN

    const login = await authService.login({
      email,
      password,
      ip: "127.0.0.1",
    });

    console.log("2. LOGIN");
    console.log({
      user: login.user,
      token: login.token,
      expiresAt: login.expiresAt,
    });

    // WRONG PASSWORD

    try {
      await authService.login({
        email,
        password: "WrongPassword123!",
        ip: "127.0.0.1",
      });

      console.log(
        "3. WRONG PASSWORD FAILED",
      );
    } catch (error) {
      console.log(
        "3. WRONG PASSWORD",
      );
      console.log(error);
    }

    // VERIFY SESSION EXISTS

    const sessionTokenHash =
      new (await import(
        "../../auth/sessions/session-token-service"
      )).SessionTokenService()
        .hashToken(login.token);

    const session =
      await sessionRepository.findByTokenHash(
        sessionTokenHash,
      );

    console.log("4. SESSION");
    console.log(session);

    // CLEANUP

    if (session) {
      await sessionRepository.delete(
        session.id,
      );
    }

    await userRepository.delete(
      user.id,
    );

    console.log("5. CLEANUP COMPLETE");
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});