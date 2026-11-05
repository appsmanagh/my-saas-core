

// 26. Este servicio coordinará tres cosas:
// Comprobar que el rol existe.
// Verificar que los permisos solicitados están definidos en nuestro catálogo.
// Asignar, retirar y consultar los permisos del rol.
import type { PermissionKey } from "../permissions/permission";
import type { PermissionService } from "../permissions/permission-service";
import type { RolePermissionRepository } from "./role-permission-repository";
import type { RoleService } from "./role-service";
import { ValidationError } from "../errors";
//37. se inporta el modulo de transaction para transaction support para organization+rolowner+permissions+membresia
import type { DatabaseTransaction } from "../database/transactional-database";

export class RolePermissionService {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  //34. esta es la function que se encargar de asignar permissions y ya cuenta con transaction support
  // 37. se agrega DatabaseTransaction para manejar transactio support
  async assignPermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
    transaction?: DatabaseTransaction,
  ): Promise<void> {
    const role = await this.roleService.getRoleById(
      roleId,
      transaction,
    );

    if (role.isSystem) {
      throw new ValidationError(
        "Permissions of system roles cannot be modified",
      );
    }

    await this.assignValidatedPermissions(
      roleId,
      permissionKeys,
      transaction,
    );
  }

  // Asignación especial para roles del sistema.
  // Reservada para flujos internos como el onboarding.
  async assignSystemRolePermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
    transaction: DatabaseTransaction,
  ): Promise<void> {
    const role = await this.roleService.getRoleById(
      roleId,
      transaction,
    );

    if (!role.isSystem) {
      throw new ValidationError(
        "This operation is only allowed for system roles",
      );
    }

    if (!role.isOwner) {
      throw new ValidationError(
        "This operation is only allowed for the Owner role",
      );
    }

    await this.assignValidatedPermissions(
      roleId,
      permissionKeys,
      transaction,
    );
  }

  // Validación compartida antes de persistir los permisos.
  private async assignValidatedPermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
    transaction?: DatabaseTransaction,
  ): Promise<void> {
    if (!roleId.trim()) {
      throw new ValidationError("Role ID is required");
    }

    const uniqueKeys = [...new Set(permissionKeys)];

    if (uniqueKeys.length === 0) {
      throw new ValidationError(
        "At least one permission is required",
      );
    }

    await this.permissionService.getPermissionsByKeys(uniqueKeys);

    await this.rolePermissionRepository.assignMany(
      roleId,
      uniqueKeys,
      transaction,
    );
  }

   //44. se modifica esta function para manejar el rol owner
  async removePermission(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void> {
    const role = await this.roleService.getRoleById(roleId);

    if (role.isSystem) {
      throw new ValidationError(
        "Permissions of system roles cannot be modified",
      );
    }

    await this.permissionService.getPermissionByKey(
      permissionKey,
    );

    await this.rolePermissionRepository.remove(
      roleId,
      permissionKey,
    );
  }

  async getPermissionsByRole(
    roleId: string,
  ): Promise<PermissionKey[]> {
    await this.roleService.getRoleById(roleId);

    return this.rolePermissionRepository.findPermissionKeysByRoleId(
      roleId,
    );
  }
}
