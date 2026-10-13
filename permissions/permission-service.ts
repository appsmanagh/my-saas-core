// 26. ¿Qué responsabilidad tiene este servicio?

// Consultar un permiso por su clave.

// Recuperar varios permisos sin repetir claves.

// Comprobar que todas las claves solicitadas existen.

// Consultar el catálogo completo.


import type {
  Permission,
  PermissionKey,
} from "./permission";

import type {
  PermissionRepository,
} from "./permission-repository";

import { NotFoundError } from "../errors";

export class PermissionService {
  constructor(
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async getPermissionByKey(
    key: PermissionKey,
  ): Promise<Permission> {
    const permission =
      await this.permissionRepository.findByKey(key);

    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    return permission;
  }

  async getPermissionsByKeys(
    keys: PermissionKey[],
  ): Promise<Permission[]> {
    if (keys.length === 0) {
      return [];
    }

    const uniqueKeys = [...new Set(keys)];

    const permissions =
      await this.permissionRepository.findByKeys(
        uniqueKeys,
      );

    if (permissions.length !== uniqueKeys.length) {
      throw new NotFoundError(
        "One or more permissions were not found",
      );
    }

    return permissions;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }
}