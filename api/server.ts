// 19. Este archivo será el punto donde conectamos Express con nuestro Core.

import express from "express";

import { createDatabase } from "../database/database-provider";

import { UserService } from "../users/user-service";
import { PostgresUserRepository } from "../users/repositories/postgres-user-repository";

import { PasswordService } from "../auth/password-service";
import { PostgresAuthRepository } from "../auth/repositories/postgres-auth-repository";

import { PostgresSessionRepository } from "../auth/sessions/postgres-session-repository";

import { AuthService } from "../auth/auth-service";

import { createAuthRoutes } from "./routes/auth-routes";
import { createAuthMiddleware } from "./middleware/auth-middleware";

//19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
import cookieParser from "cookie-parser";


//19. aqui se importa el middleware para traducir los errores de cada aplication de la api
import { errorMiddleware } 
from "./middleware/error-middleware";


//20. asi se importa una nueva ruta de endpoints 
import { createUserRoutes } 
from "./routes/user-routes";

//22. composition root - LoginRateLimit
import {
  InMemoryRateLimiter,
} from "../security/adapters/in-memory-rate-limiter";

//22. composition root - LoginRateLimit
import {
  LoginRateLimit,
} from "../security/login-rate-limit";


//39. estos son los nuevos modulos importados para transactions support 

import type { Database } from "../database/database";
import type { TransactionalDatabase } from "../database/transactional-database";

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

import { createOrganizationRoutes } from "./routes/organization-routes";
//39. end----

const app = express();

app.use(express.json());

// 19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
app.use(cookieParser());

//39.Esta function comprueba la capacidad real del adaptador durante la ejecución. No basta con que TypeScript permita una conversión de tipos.


function supportsTransactions(
  database: Database,
): database is Database & TransactionalDatabase {
  return (
    typeof (
      database as Partial<TransactionalDatabase>
    ).transaction === "function"
  );
}
//39. end----

async function bootstrap() {
  const database = createDatabase();

  await database.connect();

 //39. aqui se usan los mudulos importados arriba

if (!supportsTransactions(database)) {
  await database.disconnect();

  throw new Error(
    "Organization onboarding requires a transactional database provider.",
  );
}

const transactionalDatabase = database;

const organizationRepository =
  new PostgresOrganizationRepository(database);

const organizationService =
  new OrganizationService(organizationRepository);

const roleRepository =
  new PostgresRoleRepository(database);

const roleService =
  new RoleService(roleRepository);

const permissionRepository =
  new PostgresPermissionRepository(database);

const permissionService =
  new PermissionService(permissionRepository);

const rolePermissionRepository =
  new PostgresRolePermissionRepository(transactionalDatabase);

const rolePermissionService =
  new RolePermissionService(
    roleService,
    permissionService,
    rolePermissionRepository,
  );

const organizationMemberRepository =
  new PostgresOrganizationMemberRepository(
    transactionalDatabase,
  );

const onboardingService =
  new CreateOrganizationWithOwnerService(
    transactionalDatabase,
    organizationService,
    roleService,
    rolePermissionService,
    organizationMemberRepository,
  );
//39 end---

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

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Rate limiter por IP
  const ipRateLimiter =
    new InMemoryRateLimiter(
      10,
      60,
    );

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Rate limiter por email
  const emailRateLimiter =
    new InMemoryRateLimiter(
      5,
      60,
    );

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Política de rate limiting para login
  const loginRateLimit =
    new LoginRateLimit(
      ipRateLimiter,
      emailRateLimiter,
    );

//22 se agrega loginRateLimit a AuthService
  const authService =
    new AuthService(
      userService,
      passwordService,
      authRepository,
      sessionRepository,
      loginRateLimit,
    );

  const requireAuth =
    createAuthMiddleware(authService);

  app.use(
    "/api/auth",
    createAuthRoutes(
      authService,
      requireAuth,
    ),
  );

//20. asi se importa una nueva ruta de endpoints 
  app.use(
    "/api/users",
    createUserRoutes(
      userService,
      requireAuth,
    ),
  );

  //39. aqui se llama la nueva ruta de organizations
  app.use(
    "/api/organizations",
    createOrganizationRoutes(onboardingService, requireAuth),
  );

  app.use(
    errorMiddleware,
    );

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