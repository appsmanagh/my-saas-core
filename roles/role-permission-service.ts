
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
    // Si no hay una transacción externa, validamos el rol normalmente.
    // Si sí la hay, el rol podría haberse creado dentro de esa
    // transacción y aún no ser visible desde una consulta independiente.
    if (!transaction) {
      await this.roleService.getRoleById(roleId);
    }

    // Eliminar duplicados preservando el orden.
    const uniqueKeys = [...new Set(permissionKeys)];

    if (uniqueKeys.length === 0) {
      throw new ValidationError(
        "At least one permission is required",
      );
    }

    // Validar que todas las claves existan en el catálogo.
    await this.permissionService.getPermissionsByKeys(uniqueKeys);

    // Usar la transacción compartida, si se proporcionó.
    await this.rolePermissionRepository.assignMany(
      roleId,
      uniqueKeys,
      transaction,
    );
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