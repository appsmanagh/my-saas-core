
// 27. ¿Qué estamos comprobando realmente?
// Estos tests verifican reglas importantes de nuestro core:
// Un nombre se normaliza eliminando espacios exteriores.
// Una organización no puede tener dos roles con el mismo nombre.
// Dos organizaciones sí pueden tener roles con el mismo nombre.
// No se pueden crear roles con nombres vacíos.
// No se pueden actualizar roles inexistentes ni enviar actualizaciones vacías.
// La eliminación hace que el rol deje de encontrarse.


import assert from "node:assert/strict";

import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "../../roles/role";

import type {
  RoleRepository,
} from "../../roles/role-repository";

import { RoleService } from "../../roles/role-service";

import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../errors";

class InMemoryRoleRepository implements RoleRepository {
  private roles = new Map<string, Role>();

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

  async findByOrganization(
    organizationId: string,
  ): Promise<Role[]> {
    return [...this.roles.values()]
      .filter(
        (role) => role.organizationId === organizationId,
      )
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

async function main() {
  const repository = new InMemoryRoleRepository();
  const service = new RoleService(repository);

  // 1. Create a role.
  const role = await service.createRole({
    organizationId: "org-1",
    name: "  editor  ",
    description: "Content editor",
  });

  assert.equal(role.name, "editor");
  assert.equal(role.organizationId, "org-1");

  console.log("PASS: create role");

  // 2. Reject an empty name.
  await assert.rejects(
    () =>
      service.createRole({
        organizationId: "org-1",
        name: "   ",
      }),
    ValidationError,
  );

  console.log("PASS: reject empty role name");

  // 3. Reject duplicate names within the same organization.
  await assert.rejects(
    () =>
      service.createRole({
        organizationId: "org-1",
        name: "editor",
      }),
    ConflictError,
  );

  console.log("PASS: reject duplicate role name");

  // 4. Allow the same name in a different organization.
  const otherRole = await service.createRole({
    organizationId: "org-2",
    name: "editor",
  });

  assert.notEqual(otherRole.id, role.id);

  console.log("PASS: same role name in different organizations");

  // 5. Update the role.
  const updated = await service.updateRole(role.id, {
    name: "manager",
  });

  assert.equal(updated.name, "manager");

  console.log("PASS: update role");

  // 6. Reject an update with no fields.
  await assert.rejects(
    () => service.updateRole(role.id, {}),
    ValidationError,
  );

  console.log("PASS: reject empty update");

  // 7. Reject a missing role.
  await assert.rejects(
    () => service.getRoleById("missing-role"),
    NotFoundError,
  );

  console.log("PASS: reject missing role");

  // 8. Delete the role.
  await service.deleteRole(role.id);

  await assert.rejects(
    () => service.getRoleById(role.id),
    NotFoundError,
  );

  console.log("PASS: delete role");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});