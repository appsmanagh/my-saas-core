// 32. Qué validamos

// Que el repositorio resuelve las claves del catálogo a IDs.

// Que las asignaciones se guardan y se pueden consultar.

// Que repetir una asignación no duplica la fila.

// Que quitar una asignación funciona.

// Que al borrar un rol se eliminan sus asociaciones, gracias al ON DELETE CASCADE.


import assert from "node:assert/strict";

//32.  Usa aquí el mismo import de createDatabase que ya funciona
// en tests/integration/postgres-role-repository.test.ts.
import { createDatabase } from "../../database/database-provider";

import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";
import { PostgresRolePermissionRepository } from "../../roles/repositories/postgres-role-permission-repository";
import { PERMISSION_KEYS } from "../../permissions/permission";

async function main() {
  const database = createDatabase();
  await database.connect();

  let organizationId: string | undefined;
  let roleId: string | undefined;

  try {
    const organizationRepository =
      new PostgresOrganizationRepository(database);
    const roleRepository = new PostgresRoleRepository(database);
    const rolePermissionRepository =
      new PostgresRolePermissionRepository(database);

    // 1. Create a temporary organization and role.
    const suffix = Date.now();

    const organization = await organizationRepository.create({
      name: `Permission Test ${suffix}`,
      slug: `permission-test-${suffix}`,
    });

    organizationId = organization.id;

    const role = await roleRepository.create({
      organizationId: organization.id,
      name: "Permission Tester",
    });

    roleId = role.id;

    console.log("PASS create test organization and role");

    // 2. Assign two existing catalog permissions.
    await rolePermissionRepository.assign(
      role.id,
      PERMISSION_KEYS.USERS_READ,
    );

    await rolePermissionRepository.assign(
      role.id,
      PERMISSION_KEYS.ROLES_READ,
    );

    console.log("PASS assign permissions");

    // 3. Read assigned permission keys.
    const assigned = await rolePermissionRepository
      .findPermissionKeysByRoleId(role.id);

    assert.deepEqual(assigned, [
      PERMISSION_KEYS.ROLES_READ,
      PERMISSION_KEYS.USERS_READ,
    ]);

    console.log("PASS read assigned permissions");

    // 4. Assign one permission again; it should not create a duplicate.
    await rolePermissionRepository.assign(
      role.id,
      PERMISSION_KEYS.USERS_READ,
    );

    const afterRepeatedAssignment = await rolePermissionRepository
      .findPermissionKeysByRoleId(role.id);

    assert.deepEqual(afterRepeatedAssignment, [
      PERMISSION_KEYS.ROLES_READ,
      PERMISSION_KEYS.USERS_READ,
    ]);

    console.log("PASS repeated assignment does not duplicate");

    // 5. Remove one permission.
    await rolePermissionRepository.remove(
      role.id,
      PERMISSION_KEYS.USERS_READ,
    );

    const afterRemoval = await rolePermissionRepository
      .findPermissionKeysByRoleId(role.id);

    assert.deepEqual(afterRemoval, [
      PERMISSION_KEYS.ROLES_READ,
    ]);

    console.log("PASS remove permission");

    // 6. Removing an already removed assignment is harmless.
    await rolePermissionRepository.remove(
      role.id,
      PERMISSION_KEYS.USERS_READ,
    );

    assert.deepEqual(
      await rolePermissionRepository.findPermissionKeysByRoleId(role.id),
      [PERMISSION_KEYS.ROLES_READ],
    );

    console.log("PASS removing absent assignment is harmless");

    // 7. Deleting the role cascades to its permission assignments.
    await roleRepository.delete(role.id);
    roleId = undefined;

    const rowsAfterRoleDeletion = await database.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM role_permissions
        WHERE role_id = $1
      `,
      [role.id],
    );

    assert.equal(rowsAfterRoleDeletion[0].count, "0");

    console.log("PASS deleting role removes its permission assignments");

    console.log("\nAll PostgreSQL role-permission integration tests passed!");
  } finally {
    // Cleanup if a test fails before normal deletion.
    if (roleId) {
      await database.query(
        "DELETE FROM roles WHERE id = $1",
        [roleId],
      );
    }

    if (organizationId) {
      await database.query(
        "DELETE FROM organizations WHERE id = $1",
        [organizationId],
      );
    }

    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});