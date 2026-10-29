//41. Escenario	Resultado esperado
// Miembro con permiso asignado	true
// Miembro sin permiso	false
// Usuario sin membresía	false
// Rol de otra organización	false
// Error inesperado de dependencia	Se propaga el error
//41.end ---


import assert from "node:assert/strict";

import type { OrganizationMember } from "../../organizations/organization-member";
import type { OrganizationMemberRepository } from "../../organizations/organization-member-repository";
import type { Role } from "../../roles/role";
import type { PermissionKey } from "../../permissions/permission";

import { AuthorizationService } from "../../authorization/authorization-service";
import { PERMISSION_KEYS } from "../../permissions/permission";
import { NotFoundError } from "../../errors";

class FakeOrganizationMemberRepository
  implements OrganizationMemberRepository
{
  membership: OrganizationMember | null = null;

  async create(): Promise<OrganizationMember> {
    throw new Error("Not implemented");
  }

  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMember | null> {
    if (
      this.membership?.userId === userId &&
      this.membership.organizationId === organizationId
    ) {
      return { ...this.membership };
    }

    return null;
  }

  async findByUser(): Promise<OrganizationMember[]> {
    return this.membership ? [{ ...this.membership }] : [];
  }

  async findByOrganization(): Promise<OrganizationMember[]> {
    return this.membership ? [{ ...this.membership }] : [];
  }

  async updateRole(): Promise<OrganizationMember | null> {
    return null;
  }

  async delete(): Promise<void> {}
}

class FakeRoleService {
  constructor(private readonly roles: Map<string, Role>) {}

  async getRoleById(id: string): Promise<Role> {
    const role = this.roles.get(id);

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return role;
  }
}

class FakeRolePermissionService {
  constructor(
    private readonly assignments: Map<string, PermissionKey[]>,
  ) {}

  async getPermissionsByRole(roleId: string): Promise<PermissionKey[]> {
    return [...(this.assignments.get(roleId) ?? [])];
  }
}

async function main() {
  const members = new FakeOrganizationMemberRepository();

  const roleA: Role = {
    id: "role-a",
    organizationId: "org-a",
    name: "Admin",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const roleB: Role = {
    id: "role-b",
    organizationId: "org-b",
    name: "Admin",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const roles = new Map<string, Role>([
    [roleA.id, roleA],
    [roleB.id, roleB],
  ]);

  const rolePermissions = new Map<string, PermissionKey[]>([
    [roleA.id, [PERMISSION_KEYS.USERS_READ]],
    [roleB.id, [PERMISSION_KEYS.USERS_READ]],
  ]);

  const service = new AuthorizationService(
    members,
    new FakeRoleService(roles),
    new FakeRolePermissionService(rolePermissions),
  );

  members.membership = {
    userId: "user-1",
    organizationId: "org-a",
    roleId: "role-a",
    createdAt: new Date(),
  };

  // 1. A member with the requested permission is authorized.
  assert.equal(
    await service.hasPermission(
      "user-1",
      "org-a",
      PERMISSION_KEYS.USERS_READ,
    ),
    true,
  );
  console.log("PASS: authorize member with permission");

  // 2. A member without the requested permission is denied.
  assert.equal(
    await service.hasPermission(
      "user-1",
      "org-a",
      PERMISSION_KEYS.USERS_DELETE,
    ),
    false,
  );
  console.log("PASS: deny member without permission");

  // 3. A user without membership is denied.
  assert.equal(
    await service.hasPermission(
      "user-2",
      "org-a",
      PERMISSION_KEYS.USERS_READ,
    ),
    false,
  );
  console.log("PASS: deny user without membership");

  // 4. A role from another organization must never grant access.
  members.membership = {
    userId: "user-1",
    organizationId: "org-a",
    roleId: "role-b",
    createdAt: new Date(),
  };

  assert.equal(
    await service.hasPermission(
      "user-1",
      "org-a",
      PERMISSION_KEYS.USERS_READ,
    ),
    false,
  );
  console.log("PASS: deny role belonging to another organization");

  // 5. An unexpected dependency error is propagated.
  const failingMembers: OrganizationMemberRepository = {
  create: async () => {
    throw new Error("Not implemented");
  },

  findByUserAndOrganization: async () => {
    throw new Error("Database unavailable");
  },

  findByUser: async () => [],
  findByOrganization: async () => [],
  updateRole: async () => null,
  delete: async () => {},
};

const failingService = new AuthorizationService(
  failingMembers,
  new FakeRoleService(roles) as never,
  new FakeRolePermissionService(rolePermissions) as never,
);

  await assert.rejects(
    () =>
      failingService.hasPermission(
        "user-1",
        "org-a",
        PERMISSION_KEYS.USERS_READ,
      ),
    /Database unavailable/,
  );
  console.log("PASS: propagate dependency errors");

  // 6. Invalid identifiers are rejected.
  await assert.rejects(
    () => service.hasPermission("", "org-a", PERMISSION_KEYS.USERS_READ),
  );

  await assert.rejects(
    () => service.hasPermission("user-1", " ", PERMISSION_KEYS.USERS_READ),
  );
  console.log("PASS: reject empty identifiers");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
