
// 19. Este archivo será el punto donde conectamos Express con nuestro Core.

import express from "express";

// 19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
import cookieParser from "cookie-parser";

// 19. Aqui se importa el middleware para traducir los errores de cada aplicación de la API.
import { errorMiddleware } from "./middleware/error-middleware";

// 19. Middleware de autenticación.
import { createAuthMiddleware } from "./middleware/auth-middleware";

// 20. Asi se importan las rutas de endpoints.
import { createAuthRoutes } from "./routes/auth-routes";
import { createUserRoutes } from "./routes/user-routes";

// 39. Rutas de organizations.
import { createOrganizationRoutes } from "./routes/organization-routes";

// 41. Se importan estos módulos para el feature de authorization.
import { createPermissionMiddleware } from "./middleware/permission-middleware";

// 41. Se agregan las rutas de roles.
import { createRoleRoutes } from "./routes/role-routes";

// Tipos de los servicios que necesita Express.
import type { UserService } from "../users/user-service";
import type { AuthService } from "../auth/auth-service";
import type { OrganizationService } from "../organizations/organization-service";
import type { CreateOrganizationWithOwnerService } from "../organizations/create-organization-with-owner-service";
import type { RoleService } from "../roles/role-service";
import type { RolePermissionService } from "../roles/role-permission-service";
import type { AuthorizationService } from "../authorization/authorization-service";
import type { OrganizationMemberRepository } from "../organizations/organization-member-repository";
import type { PermissionKey } from "../permissions/permission";

// Dependencias que recibe la aplicación Express.
interface AppDependencies {
  userService: UserService;
  authService: AuthService;
  organizationService: OrganizationService;
  onboardingService: CreateOrganizationWithOwnerService;
  roleService: RoleService;
  rolePermissionService: RolePermissionService;
  authorizationService: AuthorizationService;
  organizationMemberRepository: OrganizationMemberRepository;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.use(express.json());

  // 19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
  app.use(cookieParser());

  // 41. Se define requireAuth.
  const requireAuth =
    createAuthMiddleware(dependencies.authService);

  // 41. Se define requirePermission.
  const requirePermission = (
    permissionKey: PermissionKey,
    organizationIdParam = "organizationId",
  ) =>
    createPermissionMiddleware(
      dependencies.authorizationService,
      permissionKey,
      organizationIdParam,
    );

  // 20. Se registran las rutas de autenticación.
  app.use(
    "/api/auth",
    createAuthRoutes(
      dependencies.authService,
      requireAuth,
    ),
  );

  // 20. Asi se registra una nueva ruta de endpoints.
  app.use(
    "/api/users",
    createUserRoutes(
      dependencies.userService,
      requireAuth,
    ),
  );

  // 39. Aqui se llama la nueva ruta de organizations.
  // 40. Se envia organizationService tambien a createOrganizationRoutes.
  app.use(
    "/api/organizations",
    createOrganizationRoutes(
      dependencies.organizationService,
      dependencies.onboardingService,
      requireAuth,
    ),
  );

  // 41. Se llaman los componentes del feature de authorization.
  // Aqui ya se usa authorizationService para saber si el user puede hacer la acción.
  // 43. Se agrega rolePermissionService a createRoleRoutes.
  app.use(
    "/api",
    createRoleRoutes(
      dependencies.roleService,
      dependencies.rolePermissionService,
      dependencies.authorizationService,
      requireAuth,
      dependencies.organizationMemberRepository,
    ),
  );

  // 19. Middleware para traducir los errores de la API.
  app.use(errorMiddleware);

  return app;
}
