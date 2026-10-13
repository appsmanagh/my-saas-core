//26. este es un contrato de repositorio intermedio.
// La implementación PostgreSQL podrá usar una tabla intermedia role_permissions, 
// sin que nuestros servicios tengan que conocer SQL.

import type { PermissionKey } from "../permissions/permission";

export interface RolePermissionRepository {
  assign(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void>;

  remove(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void>;

  findPermissionKeysByRoleId(
    roleId: string,
  ): Promise<PermissionKey[]>;
}

