
import assert from "node:assert/strict";

import { createDatabase } from "../../database/database-provider";
import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";

async function main() {
  const database = createDatabase();

  await database.connect();

  let organizationId: string | undefined;
  let roleId: string | undefined;

  try {
    const organizationRepository =
      new PostgresOrganizationRepository(database);

    const roleRepository = new PostgresRoleRepository(database);

    // 1. Create a test organization
    const organization = await organizationRepository.create({
      name: `Role Test ${Date.now()}`,
      slug: `role-test-${Date.now()}`,
    });

    organizationId = organization.id;

    assert.ok(organization.id);
    console.log("PASS create organization in PostgreSQL");

    // 2. Create a role
    const role = await roleRepository.create({
      organizationId: organization.id,
      name: "Admin",
      description: "Administrator role",
    });

    roleId = role.id;

    assert.equal(role.organizationId, organization.id);
    assert.equal(role.name, "Admin");
    console.log("PASS create role in PostgreSQL");

    // 9. Duplicate role name within the same organization
    let duplicateRejected = false;

    try {
      await roleRepository.create({
        organizationId: organization.id,
        name: "Admin",
        description: "Duplicate role",
      });
    } catch (error) {
      duplicateRejected = true;
      console.log("Duplicate role error:", (error as Error).message);
    }

    assert.equal(
      duplicateRejected,
      true,
      "PostgreSQL should reject duplicate role names within an organization",
    );

    console.log("PASS duplicate role name is rejected");


    // 10. Same role name in a different organization
    const anotherOrganization =
      await organizationRepository.create({
        name: `Other Role Test ${Date.now()}`,
        slug: `other-role-test-${Date.now()}`,
      });

    try {
      const otherRole = await roleRepository.create({
        organizationId: anotherOrganization.id,
        name: "Admin",
        description: "Admin in another organization",
      });

      assert.equal(otherRole.name, "Admin");
      assert.equal(
        otherRole.organizationId,
        anotherOrganization.id,
      );

      console.log("PASS same role name is allowed in another organization");

      await roleRepository.delete(otherRole.id);
    } finally {
      await organizationRepository.delete(anotherOrganization.id);
    }


    // 11. Organization deletion cascades to its roles
    const cascadeOrganization =
      await organizationRepository.create({
        name: `Cascade Test ${Date.now()}`,
        slug: `cascade-test-${Date.now()}`,
      });

    const cascadeRole = await roleRepository.create({
      organizationId: cascadeOrganization.id,
      name: "Temporary Role",
    });

    await organizationRepository.delete(cascadeOrganization.id);

    const deletedRole = await roleRepository.findById(cascadeRole.id);

    assert.equal(deletedRole, null);

    console.log("PASS deleting an organization cascades to its roles");

    // 3. Find by ID
    const found = await roleRepository.findById(role.id);

    assert.equal(found?.id, role.id);
    console.log("PASS find role by ID");

    // 4. Find by name within the organization
    const foundByName = await roleRepository.findByName(
      organization.id,
      "Admin",
    );

    assert.equal(foundByName?.id, role.id);
    console.log("PASS find role by organization and name");

    // 5. List roles by organization
    const roles = await roleRepository.findByOrganization(organization.id);

    assert.ok(roles.some((item) => item.id === role.id));
    console.log("PASS list roles by organization");

    // 6. Update role
    const updated = await roleRepository.update(role.id, {
      name: "Owner",
      description: "Organization owner",
    });

    assert.equal(updated?.name, "Owner");
    assert.equal(updated?.description, "Organization owner");
    console.log("PASS update role");

    // 7. Verify missing role
    const missing = await roleRepository.findById(
      "00000000-0000-4000-8000-000000000001",
    );

    assert.equal(missing, null);
    console.log("PASS missing role returns null");

    // 8. Delete role
    await roleRepository.delete(role.id);
    roleId = undefined;

    assert.equal(await roleRepository.findById(role.id), null);
    console.log("PASS delete role");

    console.log("\nAll PostgreSQL role integration tests passed!");
  } finally {
    // Clean up test data even when an assertion fails.
    if (roleId) {
      await database.query("DELETE FROM roles WHERE id = $1", [roleId]);
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