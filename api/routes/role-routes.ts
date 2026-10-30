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
import { ForbiddenError } from "../../errors";

//43. se necesita este service rolpermission
import type { RolePermissionService } from "../../roles/role-permission-service";

//43. se injecta RolePermissionService al constructor 
export function createRoleRoutes(
  roleService: RoleService,
  rolePermissionService: RolePermissionService,
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

  //42. se agrega este endpoint para crear un rol
  //42. POST /api/organizations/:organizationId/roles
  //42. Crea un rol dentro de la organización autorizada.
//   ¿Qué protege este endpoint?
// - requireAuth: exige autenticación.
// - requirePermission("roles:create"): verifica la autorización dentro de la organización.
// - roleService.createRole(...): valida el nombre y evita roles duplicados en la misma organización.
// - 201 Created: indica que el rol se creó correctamente.
// No aceptamos organizationId desde el cuerpo de la petición: lo obtenemos de la URL, que es la que el middleware utiliza para comprobar los permisos.
//42. end ---
  router.post(
    "/organizations/:organizationId/roles",
    requireAuth,
    requirePermission("roles:create"),
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

        const role = await roleService.createRole({
          organizationId,
          name: request.body?.name,
          description: request.body?.description,
        });

        response.status(201).json({ role });
      } catch (error) {
        next(error);
      }
    },
  );



  // 43. Asignar varios permisos a un rol.
  //43. POST /api/organizations/:organizationId/roles/:roleId/permissions
  //43. permite asignar varios permisos a un rol.
//   43. El endpoint deberá:
// 1. Exigir una sesión válida.
// 2. Comprobar el permiso roles:assign dentro de la organización.
// 3. Verificar que el rol pertenezca a esa organización.
// 4. Validar que permissionKeys sea un array no vacío de strings.
// 5. Delegar la asignación a RolePermissionService.
// 6. Responder con 200 OK y los permisos asignados.
  router.post(
    "/organizations/:organizationId/roles/:roleId/permissions",
    requireAuth,
    requirePermission("roles:assign"),
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { organizationId, roleId } = request.params;

        if (
          typeof organizationId !== "string" ||
          typeof roleId !== "string"
        ) {
          response.status(400).json({
            error: {
              message: "Invalid organization or role ID",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const existingRole =
          await roleService.getRoleById(roleId);

        if (existingRole.organizationId !== organizationId) {
          throw new ForbiddenError(
            "Role does not belong to this organization",
          );
        }

        const permissionKeys: unknown =
          request.body?.permissionKeys;

        if (
          !Array.isArray(permissionKeys) ||
          permissionKeys.length === 0 ||
          !permissionKeys.every(
            (key: unknown) => typeof key === "string",
          )
        ) {
          response.status(400).json({
            error: {
              message:
                "permissionKeys must be a non-empty array of strings",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        // El servicio valida las claves contra el catálogo.
        await rolePermissionService.assignPermissions(
          roleId,
          permissionKeys as PermissionKey[],
        );

        const permissions =
          await rolePermissionService.getPermissionsByRole(
            roleId,
          );

        response.status(200).json({ permissions });
      } catch (error) {
        next(error);
      }
    },
  );


  //43. Retirar un permiso de un rol.
  //43. DELETE /api/organizations/:organizationId/roles/:roleId/permissions/:permissionKey
  //43. endpoint para retirar un permiso de un rol.
  router.delete(
    "/organizations/:organizationId/roles/:roleId/permissions/:permissionKey",
    requireAuth,
    requirePermission("roles:assign"),
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { organizationId, roleId, permissionKey } =
          request.params;

        if (
          typeof organizationId !== "string" ||
          typeof roleId !== "string" ||
          typeof permissionKey !== "string"
        ) {
          response.status(400).json({
            error: {
              message: "Invalid organization, role or permission",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const existingRole =
          await roleService.getRoleById(roleId);

        if (existingRole.organizationId !== organizationId) {
          throw new ForbiddenError(
            "Role does not belong to this organization",
          );
        }

        // Validamos la clave contra el catálogo antes de retirarla.
        await rolePermissionService.removePermission(
          roleId,
          permissionKey as PermissionKey,
        );

        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );




  //42. PATCH /api/organizations/:organizationId/roles/:roleId
  //42. Ahora toca actualizar un rol (PATCH). Aquí debemos cuidar especialmente que el rol pertenezca a la organización de la URL; 
  //42. no basta con validar que exista.
  router.patch(
    "/organizations/:organizationId/roles/:roleId",
    requireAuth,
    requirePermission("roles:update"),
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { organizationId, roleId } = request.params;

        if (
          typeof organizationId !== "string" ||
          typeof roleId !== "string"
        ) {
          response.status(400).json({
            error: {
              message: "Invalid organization or role ID",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const existingRole =
          await roleService.getRoleById(roleId);

        if (existingRole.organizationId !== organizationId) {
          throw new ForbiddenError(
            "Role does not belong to this organization",
          );
        }

        const role = await roleService.updateRole(roleId, {
          name: request.body?.name,
          description: request.body?.description,
        });

        response.status(200).json({ role });
      } catch (error) {
        next(error);
      }
    },
  );



  //42. DELETE /api/organizations/:organizationId/roles/:roleId
  //42. El usuario debe tener el permiso roles:delete en la organización.
  //42. El rol que se quiere eliminar debe pertenecer a esa misma organización.
  router.delete(
    "/organizations/:organizationId/roles/:roleId",
    requireAuth,
    requirePermission("roles:delete"),
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const { organizationId, roleId } = request.params;

        if (
          typeof organizationId !== "string" ||
          typeof roleId !== "string"
        ) {
          response.status(400).json({
            error: {
              message: "Invalid organization or role ID",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const existingRole =
          await roleService.getRoleById(roleId);

        if (existingRole.organizationId !== organizationId) {
          throw new ForbiddenError(
            "Role does not belong to this organization",
          );
        }

        await roleService.deleteRole(roleId);

        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  

  return router;
}
