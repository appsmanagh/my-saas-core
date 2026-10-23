
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createDatabase } from "../../database/database-provider";
import type { TransactionalDatabase } from "../../database/transactional-database";

import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";
import { PostgresOrganizationMemberRepository } from "../../organizations/repositories/postgres-organization-member-repository";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";
import { PostgresRolePermissionRepository } from "../../roles/repositories/postgres-role-permission-repository";
import { PostgresPermissionRepository } from "../../permissions/repositories/postgres-permission-repository";

import { OrganizationService } from "../../organizations/organization-service";
import { RoleService } from "../../roles/role-service";
import { RolePermissionService } from "../../roles/role-permission-service";
import { PermissionService } from "../../permissions/permission-service";
import { CreateOrganizationWithOwnerService } from "../../organizations/create-organization-with-owner-service";

async function main() {
  const database = createDatabase();
  await database.connect();

  let userId: string | undefined;
  let organizationId: string | undefined;

  try {
    if (typeof (database as Partial<TransactionalDatabase>).transaction !== "function") {
      throw new Error(
        "This integration test requires a transactional database provider",
      );
    }

    const transactionalDatabase = database as TransactionalDatabase;

    const organizationRepository =
      new PostgresOrganizationRepository(database);

    const roleRepository =
      new PostgresRoleRepository(database);

    const memberRepository =
      new PostgresOrganizationMemberRepository(transactionalDatabase);

    const rolePermissionRepository =
      new PostgresRolePermissionRepository(transactionalDatabase);

    const permissionRepository =
      new PostgresPermissionRepository(database);

    const organizationService =
      new OrganizationService(organizationRepository);

    const roleService =
      new RoleService(roleRepository);

    const permissionService =
      new PermissionService(permissionRepository);

    const rolePermissionService =
      new RolePermissionService(
        roleService,
        permissionService,
        rolePermissionRepository,
      );

    const onboardingService =
      new CreateOrganizationWithOwnerService(
        transactionalDatabase,
        organizationService,
        roleService,
        rolePermissionService,
        memberRepository,
      );

    const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;

    // Create an existing user for the success case.
    userId = randomUUID();

    await database.query(
      `
        INSERT INTO users (
          id, email, name, created_at, updated_at, status
        )
        VALUES ($1, $2, $3, NOW(), NOW(), $4)
      `,
      [
        userId,
        `onboarding-${suffix}@example.com`,
        "Onboarding Tester",
        "active",
      ],
    );

    // Case A: successful onboarding.
    const result = await onboardingService.execute(
      {
        name: `Onboarding Test ${suffix}`,
        slug: `onboarding-test-${suffix}`,
      },
      userId,
    );

    organizationId = result.organization.id;

    assert.equal(result.ownerRole.organizationId, organizationId);
    assert.equal(result.ownerRole.name, "Owner");
    assert.equal(result.membership.userId, userId);
    assert.equal(result.membership.organizationId, organizationId);
    assert.equal(result.membership.roleId, result.ownerRole.id);

    const assignedPermissions =
      await rolePermissionRepository.findPermissionKeysByRoleId(
        result.ownerRole.id,
      );

    for (const key of [
      "users:read",
      "users:update",
      "users:delete",
      "roles:read",
      "roles:create",
      "roles:update",
      "roles:delete",
      "roles:assign",
    ] as const) {
      assert.ok(
        assignedPermissions.includes(key),
        `Owner is missing permission: ${key}`,
      );
    }

    console.log("PASS onboarding creates organization, Owner role, permissions and membership");

    // Case B: force a failure at membership creation using a nonexistent user.
    const failedSlug = `onboarding-rollback-${suffix}`;

    await assert.rejects(
      onboardingService.execute(
        {
          name: `Rollback Test ${suffix}`,
          slug: failedSlug,
        },
        randomUUID(),
      ),
    );

    const organizationAfterFailure =
      await organizationRepository.findBySlug(failedSlug);

    
assert.equal(
    organizationAfterFailure,
    null,
    "Organization should have been rolled back",
    );

    const remainingRoles = await database.query<{ count: number }>(
    `
        SELECT COUNT(*)::int AS count
        FROM roles r
        INNER JOIN organizations o
        ON o.id = r.organization_id
        WHERE o.slug = $1
    `,
    [failedSlug],
    );

    assert.equal(
    Number(remainingRoles[0].count),
    0,
    "Roles should have been rolled back",
    );

    const remainingAssignments = await database.query<{ count: number }>(
    `
        SELECT COUNT(*)::int AS count
        FROM role_permissions rp
        INNER JOIN roles r
        ON r.id = rp.role_id
        INNER JOIN organizations o
        ON o.id = r.organization_id
        WHERE o.slug = $1
    `,
    [failedSlug],
    );

    assert.equal(
    Number(remainingAssignments[0].count),
    0,
    "Permission assignments should have been rolled back",
    );

    console.log("PASS failed onboarding rolls back organization, roles and permission assignments");


    console.log(
      "\nAll create-organization-with-owner integration tests passed!",
    );
  } finally {
    if (organizationId) {
      await database.query(
        "DELETE FROM organizations WHERE id = $1",
        [organizationId],
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
