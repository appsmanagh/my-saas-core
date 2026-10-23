//26. este es un contrato de repositorio intermedio.
// La implementación PostgreSQL podrá usar una tabla intermedia role_permissions, 
// sin que nuestros servicios tengan que conocer SQL.

import type { PermissionKey } from "../permissions/permission";
import type { DatabaseTransaction } from "../database/transactional-database";

export interface RolePermissionRepository {

  //36. se agrego transaction?: DatabaseTransaction, a esta funcion para transaction support organization+rolowner+permissions+membresia
  assign(
    roleId: string,
    permissionKey: PermissionKey,
    transaction?: DatabaseTransaction,
  ): Promise<void>;

   //34. se agrego esta function para manejar transaction support
   //36. se agrego transaction?: DatabaseTransaction, a esta funcion para transaction support organization+rolowner+permissions+membresia
  assignMany(
    roleId: string,
    permissionKeys: PermissionKey[],
    transaction?: DatabaseTransaction,
  ): Promise<void>;

  remove(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void>;

  findPermissionKeysByRoleId(
    roleId: string,
  ): Promise<PermissionKey[]>;
}

