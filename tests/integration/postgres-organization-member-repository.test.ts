//35. ¿Qué estamos comprobando realmente?
// Además de probar el CRUD, estamos validando dos reglas esenciales de tu SaaS:
// - Aislamiento entre organizaciones: una membresía no puede utilizar un rol de otra organización.
// - Identidad de la membresía: el mismo usuario puede tener distintos roles en distintas organizaciones, pero solo una membresía por organización.


import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createDatabase } from "../../database/database-provider";

import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";
import { PostgresOrganizationMemberRepository } from "../../organizations/repositories/postgres-organization-member-repository";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";

async function main() {
  const database = createDatabase();
  await database.connect();

  let userId: string | undefined;
  let organizationAId: string | undefined;
  let organizationBId: string | undefined;

  try {
    const organizationRepository =
      new PostgresOrganizationRepository(database);

    const roleRepository = new PostgresRoleRepository(database);

    const memberRepository =
      new PostgresOrganizationMemberRepository(database);

    const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;

    // 1. Create a test user.
    userId = randomUUID();

    await database.query(
      `
        INSERT INTO users (
        id,
        email,
        name,
        created_at,
        updated_at,
        status
        )
        VALUES ($1, $2, $3, NOW(), NOW(), $4)
      `,
      [
        userId,
        `member-test-${suffix}@example.com`,
        "Organization Member Tester",
        "active",
      ],
    );

    // 2. Create two organizations.
    const organizationA = await organizationRepository.create({
      name: `Member Test A ${suffix}`,
      slug: `member-test-a-${suffix}`,
    });

    organizationAId = organizationA.id;

    const organizationB = await organizationRepository.create({
      name: `Member Test B ${suffix}`,
      slug: `member-test-b-${suffix}`,
    });

    organizationBId = organizationB.id;

    // 3. Create a role in each organization.
    const roleA = await roleRepository.create({
      organizationId: organizationA.id,
      name: "Member",
    });

    const roleB = await roleRepository.create({
      organizationId: organizationB.id,
      name: "Administrator",
    });

    console.log("PASS create test user, organizations and roles");

    // 4. Add the user to organization A.
    const membershipA = await memberRepository.create({
      userId,
      organizationId: organizationA.id,
      roleId: roleA.id,
    });

    assert.equal(membershipA.userId, userId);
    assert.equal(membershipA.organizationId, organizationA.id);
    assert.equal(membershipA.roleId, roleA.id);
    assert.ok(membershipA.createdAt instanceof Date);

    console.log("PASS create organization membership");

    // 5. Retrieve the membership.
    const found = await memberRepository.findByUserAndOrganization(
      userId,
      organizationA.id,
    );

    assert.ok(found);
    assert.equal(found.roleId, roleA.id);

    const missing = await memberRepository.findByUserAndOrganization(
      userId,
      organizationB.id,
    );

    assert.equal(missing, null);

    console.log("PASS find membership by user and organization");

    // 6. A user can belong to two different organizations.
    const membershipB = await memberRepository.create({
      userId,
      organizationId: organizationB.id,
      roleId: roleB.id,
    });

    assert.equal(membershipB.organizationId, organizationB.id);
    assert.equal(membershipB.roleId, roleB.id);

    console.log("PASS user can belong to multiple organizations");

    // 7. A user cannot have two memberships in the same organization.
    await assert.rejects(
      memberRepository.create({
        userId,
        organizationId: organizationA.id,
        roleId: roleA.id,
      }),
    );

    console.log("PASS duplicate membership is rejected");

    // 8. A role from organization B cannot be assigned in organization A.
    const anotherUserId = randomUUID();

    await database.query(
      `
        INSERT INTO users (
        id,
        email,
        name,
        created_at,
        updated_at,
        status
        )
        VALUES ($1, $2, $3, NOW(), NOW(), $4)
      `,
      [
        anotherUserId,
        `member-test-other-${suffix}@example.com`,
        "Another Member Tester",
        "active",
      ],
    );

    try {
      await assert.rejects(
        memberRepository.create({
          userId: anotherUserId,
          organizationId: organizationA.id,
          roleId: roleB.id,
        }),
      );

      assert.equal(
        await memberRepository.findByUserAndOrganization(
          anotherUserId,
          organizationA.id,
        ),
        null,
      );
    } finally {
      await database.query(
        "DELETE FROM users WHERE id = $1",
        [anotherUserId],
      );
    }

    console.log("PASS cross-organization role assignment is rejected");

    // 9. List the members of organization A.
    const members = await memberRepository.findByOrganization(
      organizationA.id,
    );

    assert.equal(members.length, 1);
    assert.equal(members[0].userId, userId);

    console.log("PASS list organization members");

    // 10. Change the user's role within organization A.
    const anotherRoleA = await roleRepository.create({
      organizationId: organizationA.id,
      name: "Manager",
    });

    const updated = await memberRepository.updateRole(
      userId,
      organizationA.id,
      anotherRoleA.id,
    );

    assert.ok(updated);
    assert.equal(updated.roleId, anotherRoleA.id);

    console.log("PASS update member role");

    // 11. Updating a nonexistent membership returns null.
    assert.equal(
      await memberRepository.updateRole(
        randomUUID(),
        organizationA.id,
        anotherRoleA.id,
      ),
      null,
    );

    console.log("PASS updating nonexistent membership returns null");

    // 12. Delete a membership.
    await memberRepository.delete(userId, organizationA.id);

    assert.equal(
      await memberRepository.findByUserAndOrganization(
        userId,
        organizationA.id,
      ),
      null,
    );

    console.log("PASS delete membership");

    // 13. Deleting a nonexistent membership is harmless.
    await memberRepository.delete(userId, organizationA.id);

    console.log("PASS deleting nonexistent membership is harmless");

    console.log(
      "\nAll PostgreSQL organization-member integration tests passed!",
    );
  } finally {
    // Organizations cascade to their memberships and roles.
    if (organizationAId) {
      await database.query(
        "DELETE FROM organizations WHERE id = $1",
        [organizationAId],
      );
    }

    if (organizationBId) {
      await database.query(
        "DELETE FROM organizations WHERE id = $1",
        [organizationBId],
      );
    }

    if (userId) {
      await database.query(
        "DELETE FROM users WHERE id = $1",
        [userId],
      );
    }

    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
