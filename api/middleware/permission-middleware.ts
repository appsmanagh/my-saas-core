
//41. este es el middleware para authorization 
import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

import type { AuthorizationService } from "../../authorization/authorization-service";
import type { PermissionKey } from "../../permissions/permission";

import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../../errors";

export function createPermissionMiddleware(
  authorizationService: AuthorizationService,
  permissionKey: PermissionKey,
  organizationIdParam = "organizationId",
): RequestHandler {
  return async function requirePermission(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // La autenticación debe ejecutarse antes de este middleware.
      if (!request.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const organizationId = request.params[organizationIdParam];

        if (typeof organizationId !== "string" || !organizationId.trim()) {
        throw new ValidationError(
            `Route parameter '${organizationIdParam}' is required`,
        );
        }

      const allowed = await authorizationService.hasPermission(
        request.user.id,
        organizationId,
        permissionKey,
      );

      if (!allowed) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
