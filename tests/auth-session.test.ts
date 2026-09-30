import { createDatabase } from "../database/database-provider";

import { UserService } from "../users/user-service";
import { PostgresUserRepository } from "../users/repositories/postgres-user-repository";

import { PasswordService } from "../auth/password-service";
import { PostgresAuthRepository } from "../auth/repositories/postgres-auth-repository";

import { PostgresSessionRepository } from "../auth/sessions/postgres-session-repository";
import { SessionTokenService } from "../auth/sessions/session-token-service";

import { AuthService } from "../auth/auth-service";

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

    const authService =
      new AuthService(
        userService,
        passwordService,
        authRepository,
        sessionRepository,
      );

    const email =
      `session-test-${crypto.randomUUID()}@example.com`;

    const password =
      "MySuperSecurePassword123!";

    // 1. REGISTER

    const user =
      await authService.register({
        email,
        name: "Session Test User",
        password,
      });

    console.log("1. REGISTER");
    console.log(user);

    // 2. LOGIN

    const login =
      await authService.login(
        email,
        password,
      );

    console.log("2. LOGIN");
    console.log({
      token: login.token,
      expiresAt: login.expiresAt,
    });

    // 3. VALIDATE SESSION

    const authenticatedUser =
      await authService.getUserBySessionToken(
        login.token,
      );

    console.log("3. AUTHENTICATED USER");
    console.log(authenticatedUser);

    // 4. LOGOUT

    await authService.logout(
      login.token,
    );

    console.log("4. LOGOUT");

    // 5. TOKEN SHOULD NOW BE INVALID

    try {
      await authService.getUserBySessionToken(
        login.token,
      );

      console.log(
        "5. ERROR: token should be invalid",
      );
    } catch (error) {
      console.log(
        "5. TOKEN INVALIDATED SUCCESSFULLY",
      );
      console.log(error);
    }

    // 6. CLEANUP

    await userRepository.delete(
      user.id,
    );

    console.log(
      "6. CLEANUP COMPLETE",
    );
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});