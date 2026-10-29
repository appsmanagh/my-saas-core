// 41. ¿Cómo funciona?
// 1. Membresía
// Si el usuario no pertenece a la organización, devuelve false sin continuar.

// 2. Aislamiento del tenant
// Comprueba que el rol asignado pertenece a la organización solicitada.

// 3. Permisos
// Solo devuelve true si el permiso solicitado está asignado al rol.

// Una decisión de diseño: este método devuelve false cuando no hay autorización, 
// pero deja que los errores inesperados de la base de datos se propaguen. 
// Así no confundimos un fallo técnico con una denegación de permisos.
// 41. end ---


import type { OrganizationMemberRepository } from "../organizations/organization-member-repository";
import type { RoleService } from "../roles/role-service";
import type { RolePermissionService } from "../roles/role-permission-service";
import type { PermissionKey } from "../permissions/permission";
import { ValidationError } from "../errors";

export class AuthorizationService {
  constructor(
    private readonly organizationMemberRepository: OrganizationMemberRepository,
    private readonly roleService: Pick<RoleService, "getRoleById">,
    private readonly rolePermissionService: Pick<
      RolePermissionService,
      "getPermissionsByRole"
    >,
  ) {}

  async hasPermission(
    userId: string,
    organizationId: string,
    permissionKey: PermissionKey,
  ): Promise<boolean> {
    if (!userId.trim()) {
      throw new ValidationError("User ID is required");
    }

    if (!organizationId.trim()) {
      throw new ValidationError("Organization ID is required");
    }

    // 1. Comprobar que el usuario pertenece a la organización.
    const membership =
      await this.organizationMemberRepository.findByUserAndOrganization(
        userId,
        organizationId,
      );

    if (!membership) {
      return false;
    }

    // 2. Comprobar que el rol pertenece a esa misma organización.
    const role = await this.roleService.getRoleById(
      membership.roleId,
    );

    if (role.organizationId !== organizationId) {
      return false;
    }

    // 3. Comprobar que el rol tiene el permiso solicitado.
    const permissions =
      await this.rolePermissionService.getPermissionsByRole(
        role.id,
      );

    return permissions.includes(permissionKey);
  }
}
