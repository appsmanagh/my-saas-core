// 27. Este servicio tiene una responsabilidad distinta a la de RoleService: consultar el catálogo de permisos disponibles y comprobar que todos los permisos solicitados existen.

// Vamos a cubrir cuatro casos:

// Consultar un permiso por su clave.

// Consultar varios permisos y eliminar claves duplicadas.

// Rechazar la operación si alguna clave no existe en el catálogo.

// Devolver todos los permisos disponibles.


import assert from "node:assert/strict";

import type { Permission, PermissionKey } from "../../permissions/permission";
import { PERMISSION_KEYS } from "../../permissions/permission";
import type { PermissionRepository } from "../../permissions/permission-repository";
import { PermissionService } from "../../permissions/permission-service";
import { NotFoundError } from "../../errors";

class InMemoryPermissionRepository implements PermissionRepository {
  private readonly permissions: Permission[] = [
    {
      id: "permission-1",
      key: PERMISSION_KEYS.USERS_READ,
      description: "Read users",
      createdAt: new Date(),
    },
    {
      id: "permission-2",
      key: PERMISSION_KEYS.USERS_UPDATE,
      description: "Update users",
      createdAt: new Date(),
    },
    {
      id: "permission-3",
      key: PERMISSION_KEYS.ROLES_READ,
      description: "Read roles",
      createdAt: new Date(),
    },
  ];

  async findById(id: string): Promise<Permission | null> {
    return this.permissions.find((permission) => permission.id === id) ?? null;
  }

  async findByKey(key: PermissionKey): Promise<Permission | null> {
    return this.permissions.find((permission) => permission.key === key) ?? null;
  }

  async findByKeys(keys: PermissionKey[]): Promise<Permission[]> {
    return this.permissions.filter((permission) => keys.includes(permission.key as PermissionKey));
  }

  async findAll(): Promise<Permission[]> {
    return [...this.permissions];
  }
}

async function main() {
  const repository = new InMemoryPermissionRepository();
  const service = new PermissionService(repository);

  const permission = await service.getPermissionByKey(
    PERMISSION_KEYS.USERS_READ,
  );
  assert.equal(permission.key, PERMISSION_KEYS.USERS_READ);
  console.log("PASS: get permission by key");

  const permissions = await service.getPermissionsByKeys([
    PERMISSION_KEYS.USERS_READ,
    PERMISSION_KEYS.USERS_UPDATE,
    PERMISSION_KEYS.USERS_READ,
  ]);
  assert.equal(permissions.length, 2);
  console.log("PASS: get permissions and remove duplicate keys");

  await assert.rejects(
    () =>
      service.getPermissionByKey(
        "unknown:permission" as PermissionKey,
      ),
    NotFoundError,
  );
  console.log("PASS: reject unknown permission");

  await assert.rejects(
    () =>
      service.getPermissionsByKeys([
        PERMISSION_KEYS.USERS_READ,
        "unknown:permission" as PermissionKey,
      ]),
    NotFoundError,
  );
  console.log("PASS: reject list containing unknown permission");

  const allPermissions = await service.getAllPermissions();
  assert.equal(allPermissions.length, 3);
  console.log("PASS: get all permissions");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});