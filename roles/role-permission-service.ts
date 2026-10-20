
// 26. Este servicio coordinará tres cosas:
// Comprobar que el rol existe.
// Verificar que los permisos solicitados están definidos en nuestro catálogo.
// Asignar, retirar y consultar los permisos del rol.

import type { PermissionKey } from "../permissions/permission";
import type { PermissionService } from "../permissions/permission-service";
import type { RolePermissionRepository } from "./role-permission-repository";
import type { RoleService } from "./role-service";
import { ValidationError } from "../errors";

export class RolePermissionService {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  async assignPermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
  ): Promise<void> {
    // Validate the role before changing its permissions.
    await this.roleService.getRoleById(roleId);

    // Remove duplicate keys while preserving their order.
    const uniqueKeys = [...new Set(permissionKeys)];

    if (uniqueKeys.length === 0) {
      throw new ValidationError(
        "At least one permission is required",
      );
    }

    // Validate all requested permissions before writing anything.
    await this.permissionService.getPermissionsByKeys(uniqueKeys);

    // The repository currently performs each assignment separately.
    // We'll make this operation atomic when we add transaction support.
    for (const permissionKey of uniqueKeys) {
      await this.rolePermissionRepository.assign(
        roleId,
        permissionKey,
      );
    }
  }

  async removePermission(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void> {
    // Validate the role and permission before removing the assignment.
    await this.roleService.getRoleById(roleId);

    await this.permissionService.getPermissionByKey(permissionKey);

    await this.rolePermissionRepository.remove(
      roleId,
      permissionKey,
    );
  }

  async getPermissionsByRole(
    roleId: string,
  ): Promise<PermissionKey[]> {
    // Avoid returning an empty list for a role that doesn't exist.
    await this.roleService.getRoleById(roleId);

    return this.rolePermissionRepository.findPermissionKeysByRoleId(
      roleId,
    );
  }
}