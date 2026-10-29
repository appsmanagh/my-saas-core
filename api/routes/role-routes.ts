//41. se crea este file para manejar las tutas api de los roles
// ¿Qué estamos consiguiendo?
// - requireAuth exige una sesión válida.
// - requirePermission("roles:read") comprueba la membresía y el permiso.
// - RoleService conserva la responsabilidad de obtener los roles.
// - La respuesta devuelve los roles de la organización solicitada.
//41. end ---

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";

import type { RoleService } from "../../roles/role-service";
import type { AuthorizationService } from "../../authorization/authorization-service";
import type { PermissionKey } from "../../permissions/permission";

import { createPermissionMiddleware } from "../middleware/permission-middleware";

export function createRoleRoutes(
  roleService: RoleService,
  authorizationService: AuthorizationService,
  requireAuth: RequestHandler,
) {
  const router = Router();

  const requirePermission = (
    permissionKey: PermissionKey,
  ): RequestHandler =>
    createPermissionMiddleware(
      authorizationService,
      permissionKey,
    );

  //41. GET /api/organizations/:organizationId/roles
  //41. Lista los roles de una organización si el usuario tiene permiso.
  router.get(
    "/organizations/:organizationId/roles",
    requireAuth,
    requirePermission("roles:read"),
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { organizationId } = request.params;

        if (typeof organizationId !== "string") {
          response.status(400).json({
            error: {
              message: "Invalid organization ID",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const roles =
          await roleService.getRolesByOrganization(
            organizationId,
          );

        response.status(200).json({ roles });
      } catch (error) {
        next(error);
      }
    },
  );
  

  return router;
}
