
import assert from "node:assert/strict";

import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "../roles/role";
import type { RoleRepository } from "../../roles/role-repository";
import { RoleService } from "../../roles/role-service";

import type { Permission, PermissionKey } from "../../permissions/permission";
import { PERMISSION_KEYS } from "../../permissions/permission";
import type { PermissionRepository } from "../../permissions/permission-repository";
import { PermissionService } from "../../permissions/permission-service";

import type { RolePermissionRepository } from "../../roles/role-permission-repository";
import { RolePermissionService } from "../../roles/role-permission-service";

import {
  ValidationError,
  NotFoundError,
} from "../../errors";

class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, Role>();

  async create(input: CreateRoleInput): Promise<Role> {
    const now = new Date();

    const role: Role = {
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(role.id, role);
    return { ...role };
  }

  async findById(id: string): Promise<Role | null> {
    const role = this.roles.get(id);
    return role ? { ...role } : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<Role | null> {
    for (const role of this.roles.values()) {
      if (
        role.organizationId === organizationId &&
        role.name === name
      ) {
        return { ...role };
      }
    }

    return null;
  }

  async findByOrganization(organizationId: string): Promise<Role[]> {
    return [...this.roles.values()]
      .filter((role) => role.organizationId === organizationId)
      .map((role) => ({ ...role }));
  }

  async update(
    id: string,
    input: UpdateRoleInput,
  ): Promise<Role | null> {
    const role = this.roles.get(id);
    if (!role) return null;

    const updated: Role = {
      ...role,
      ...input,
      updatedAt: new Date(),
    };

    this.roles.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.roles.delete(id);
  }
}

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
    return this.permissions.filter((permission) =>
      keys.includes(permission.key as PermissionKey),
    );
  }

  async findAll(): Promise<Permission[]> {
    return [...this.permissions];
  }
}

class InMemoryRolePermissionRepository implements RolePermissionRepository {
  private readonly assignments = new Map<string, Set<PermissionKey>>();
  readonly assignCalls: string[] = [];

  async assign(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void> {
    const permissions = this.assignments.get(roleId) ?? new Set<PermissionKey>();

    permissions.add(permissionKey);
    this.assignments.set(roleId, permissions);
    this.assignCalls.push(`${roleId}:${permissionKey}`);
  }

  async remove(
    roleId: string,
    permissionKey: PermissionKey,
  ): Promise<void> {
    this.assignments.get(roleId)?.delete(permissionKey);
  }

  async findPermissionKeysByRoleId(
    roleId: string,
  ): Promise<PermissionKey[]> {
    return [...(this.assignments.get(roleId) ?? new Set<PermissionKey>())];
  }
}

async function main() {
  const roleRepository = new InMemoryRoleRepository();
  const permissionRepository = new InMemoryPermissionRepository();
  const rolePermissionRepository = new InMemoryRolePermissionRepository();

  const roleService = new RoleService(roleRepository);
  const permissionService = new PermissionService(permissionRepository);

  const service = new RolePermissionService(
    roleService,
    permissionService,
    rolePermissionRepository,
  );

  const role = await roleService.createRole({
    organizationId: "org-1",
    name: "Editor",
  });

  // 1. Assign multiple permissions.
  await service.assignPermissions(role.id, [
    PERMISSION_KEYS.USERS_READ,
    PERMISSION_KEYS.USERS_UPDATE,
  ]);

  let assigned = await service.getPermissionsByRole(role.id);

  assert.equal(assigned.length, 2);
  assert.ok(assigned.includes(PERMISSION_KEYS.USERS_READ));
  assert.ok(assigned.includes(PERMISSION_KEYS.USERS_UPDATE));
  console.log("PASS: assign multiple permissions");

  // 2. Duplicate keys are assigned only once per request.
  const callsBefore = rolePermissionRepository.assignCalls.length;

  await service.assignPermissions(role.id, [
    PERMISSION_KEYS.USERS_READ,
    PERMISSION_KEYS.USERS_READ,
  ]);

  assert.equal(
    rolePermissionRepository.assignCalls.length - callsBefore,
    1,
  );
  console.log("PASS: deduplicate permission assignments");

  // 3. An empty permission list is rejected.
  await assert.rejects(
    () => service.assignPermissions(role.id, []),
    ValidationError,
  );
  console.log("PASS: reject empty permission list");

  // 4. Unknown permission keys are rejected.
  await assert.rejects(
    () =>
      service.assignPermissions(role.id, [
        "unknown:permission" as PermissionKey,
      ]),
    NotFoundError,
  );
  console.log("PASS: reject unknown permission");

  // 5. Remove an assigned permission.
  await service.removePermission(role.id, PERMISSION_KEYS.USERS_READ);

  assigned = await service.getPermissionsByRole(role.id);

  assert.ok(!assigned.includes(PERMISSION_KEYS.USERS_READ));
  assert.ok(assigned.includes(PERMISSION_KEYS.USERS_UPDATE));
  console.log("PASS: remove permission");

  // 6. A missing role cannot receive permissions.
  await assert.rejects(
    () =>
      service.assignPermissions("missing-role", [
        PERMISSION_KEYS.USERS_READ,
      ]),
    NotFoundError,
  );
  console.log("PASS: reject assignment to missing role");

  // 7. A missing role cannot have its permissions queried.
  await assert.rejects(
    () => service.getPermissionsByRole("missing-role"),
    NotFoundError,
  );
  console.log("PASS: reject permission lookup for missing role");

  // 8. An unknown permission cannot be removed.
  await assert.rejects(
    () =>
      service.removePermission(
        role.id,
        "unknown:permission" as PermissionKey,
      ),
    NotFoundError,
  );
  console.log("PASS: reject removal of unknown permission");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});