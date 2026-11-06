
// 19. Este archivo será el punto donde conectamos Express con nuestro Core.

// 39. Estos son los módulos importados para transactions support.

import type { Database } from "../database/database";
import type { TransactionalDatabase } from "../database/transactional-database";

import { createDatabase } from "../database/database-provider";

import { UserService } from "../users/user-service";
import { PostgresUserRepository } from "../users/repositories/postgres-user-repository";

import { PasswordService } from "../auth/password-service";
import { PostgresAuthRepository } from "../auth/repositories/postgres-auth-repository";
import { PostgresSessionRepository } from "../auth/sessions/postgres-session-repository";
import { AuthService } from "../auth/auth-service";

// 22. Composition root - LoginRateLimit.
import {
  InMemoryRateLimiter,
} from "../security/adapters/in-memory-rate-limiter";

import {
  LoginRateLimit,
} from "../security/login-rate-limit";

// 39. Estos son los nuevos módulos para organizations y transactions support.

import { PostgresOrganizationRepository } from "../organizations/repositories/postgres-organization-repository";
import { PostgresOrganizationMemberRepository } from "../organizations/repositories/postgres-organization-member-repository";
import { OrganizationService } from "../organizations/organization-service";
import { CreateOrganizationWithOwnerService } from "../organizations/create-organization-with-owner-service";

import { PostgresRoleRepository } from "../roles/repositories/postgres-role-repository";
import { PostgresRolePermissionRepository } from "../roles/repositories/postgres-role-permission-repository";
import { RoleService } from "../roles/role-service";
import { RolePermissionService } from "../roles/role-permission-service";

import { PostgresPermissionRepository } from "../permissions/repositories/postgres-permission-repository";
import { PermissionService } from "../permissions/permission-service";

// 39. End.

// 41. Se importan estos módulos para el feature de authorization.
import { AuthorizationService } from "../authorization/authorization-service";

// 19. Se importa la aplicación Express ya configurada.
import { createApp } from "./app";

// 39. Esta función comprueba la capacidad real del adaptador durante la ejecución.
// No basta con que TypeScript permita una conversión de tipos.

function supportsTransactions(
  database: Database,
): database is Database & TransactionalDatabase {
  return (
    typeof (
      database as Partial<TransactionalDatabase>
    ).transaction === "function"
  );
}

// 39. End.

async function bootstrap() {
  const database = createDatabase();

  await database.connect();

  // 39. Aqui se usan los módulos importados arriba.

  if (!supportsTransactions(database)) {
    await database.disconnect();

    throw new Error(
      "Organization onboarding requires a transactional database provider.",
    );
  }

  const transactionalDatabase = database;

  // 39. Organization repository y service.
  const organizationRepository =
    new PostgresOrganizationRepository(database);

  const organizationService =
    new OrganizationService(organizationRepository);

  // 39. Role repository y service.
  const roleRepository =
    new PostgresRoleRepository(database);

  const roleService =
    new RoleService(roleRepository);

  // 39. Permission repository y service.
  const permissionRepository =
    new PostgresPermissionRepository(database);

  const permissionService =
    new PermissionService(permissionRepository);

  // 39. Role permission repository y service.
  const rolePermissionRepository =
    new PostgresRolePermissionRepository(transactionalDatabase);

  const rolePermissionService =
    new RolePermissionService(
      roleService,
      permissionService,
      rolePermissionRepository,
    );

  // 39. Organization member repository.
  const organizationMemberRepository =
    new PostgresOrganizationMemberRepository(
      transactionalDatabase,
    );

  // 39. Organization onboarding.
  const onboardingService =
    new CreateOrganizationWithOwnerService(
      transactionalDatabase,
      organizationService,
      roleService,
      rolePermissionService,
      organizationMemberRepository,
    );

  // 39. End.

  // 41. Se define authorizationService.
  const authorizationService =
    new AuthorizationService(
      organizationMemberRepository,
      roleService,
      rolePermissionService,
    );

  // 41. End.

  // Users.
  const userRepository =
    new PostgresUserRepository(database);

  const userService =
    new UserService(userRepository);

  // Authentication.
  const passwordService =
    new PasswordService();

  const authRepository =
    new PostgresAuthRepository(database);

  const sessionRepository =
    new PostgresSessionRepository(database);

  // 22. Composition root - LoginRateLimit.
  // 22. Aqui es donde se hace el cambio a Redis en el futuro.
  // Rate limiter por IP.
  const ipRateLimiter =
    new InMemoryRateLimiter(
      10,
      60,
    );

  // 22. Composition root - LoginRateLimit.
  // 22. Aqui es donde se hace el cambio a Redis en el futuro.
  // Rate limiter por email.
  const emailRateLimiter =
    new InMemoryRateLimiter(
      5,
      60,
    );

  // 22. Composition root - LoginRateLimit.
  // Política de rate limiting para login.
  const loginRateLimit =
    new LoginRateLimit(
      ipRateLimiter,
      emailRateLimiter,
    );

  // 22. Se agrega loginRateLimit a AuthService.
  const authService =
    new AuthService(
      userService,
      passwordService,
      authRepository,
      sessionRepository,
      loginRateLimit,
    );

  // 19. Se crea la aplicación Express conectada con nuestro Core.
  const app = createApp({
    userService,
    authService,
    organizationService,
    onboardingService,
    roleService,
    rolePermissionService,
    authorizationService,
    organizationMemberRepository,
  });

  // 19. Se inicia el servidor HTTP.
  const port =
    Number(process.env.PORT) || 3001;

  app.listen(port, () => {
    console.log(
      `API running on http://localhost:${port}`,
    );
  });
}

bootstrap().catch((error) => {
  console.error(
    "Failed to start API",
    error,
  );

  process.exit(1);
});
