
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PostgresDatabase } from "../../database/adapters/postgres/postgres-database";
import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";
import { PostgresOrganizationMemberRepository } from "../../organizations/repositories/postgres-organization-member-repository";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";
import { OrganizationMemberService } from "../../organizations/organization-member-service";

async function main() {
  const database = new PostgresDatabase();
  await database.connect();

  const organizationIds: string[] = [];
  const userIds: string[] = [];

  try {
    const organizationRepository = new PostgresOrganizationRepository(database);
    const memberRepository = new PostgresOrganizationMemberRepository(database);
    const roleRepository = new PostgresRoleRepository(database);

    const service = new OrganizationMemberService(
      database,
      organizationRepository,
      memberRepository,
      roleRepository,
    );

    const suffix = randomUUID();

    async function createUser(label: string) {
      const id = randomUUID();
      userIds.push(id);

      await database.query(
        `INSERT INTO users (
          id, email, name, created_at, updated_at, status
        ) VALUES ($1, $2, $3, NOW(), NOW(), 'active')`,
        [id, `${label}-${suffix}@example.com`, label],
      );

      return id;
    }

    async function createOrganization(label: string) {
      const organization = await organizationRepository.create({
        name: `${label} ${suffix}`,
        slug: `${label.toLowerCase()}-${suffix}`,
      });

      organizationIds.push(organization.id);

      const ownerRole = await roleRepository.create({
        organizationId: organization.id,
        name: "Owner",
        isSystem: true,
        isOwner: true,
      });

      const memberRole = await roleRepository.create({
        organizationId: organization.id,
        name: "Member",
        isSystem: false,
        isOwner: false,
      });

      return { organization, ownerRole, memberRole };
    }

    // 1. Changing one of two Owners is allowed.
    {
      const { organization, ownerRole, memberRole } =
        await createOrganization("change-two-owners");

      const ownerA = await createUser("owner-a");
      const ownerB = await createUser("owner-b");

      await memberRepository.create({
        userId: ownerA,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await memberRepository.create({
        userId: ownerB,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      const updated = await service.changeMemberRole(
        ownerA,
        organization.id,
        memberRole.id,
      );

      assert.equal(updated.roleId, memberRole.id);

      console.log("PASS changing one of two Owners is allowed");
    }

    // 2. Changing the last Owner is rejected.
    {
      const { organization, ownerRole, memberRole } =
        await createOrganization("change-last-owner");

      const owner = await createUser("last-owner");

      await memberRepository.create({
        userId: owner,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await assert.rejects(
        service.changeMemberRole(owner, organization.id, memberRole.id),
        { message: "Cannot remove the last owner of an organization" },
      );

      const membership = await memberRepository.findByUserAndOrganization(
        owner,
        organization.id,
      );

      assert.ok(membership);
      assert.equal(membership.roleId, ownerRole.id);

      console.log("PASS changing the last Owner is rejected");
    }

    // 3. Removing one of two Owners is allowed.
    {
      const { organization, ownerRole } =
        await createOrganization("remove-two-owners");

      const ownerA = await createUser("remove-owner-a");
      const ownerB = await createUser("remove-owner-b");

      await memberRepository.create({
        userId: ownerA,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await memberRepository.create({
        userId: ownerB,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await service.removeMember(ownerA, organization.id);

      assert.equal(
        await memberRepository.findByUserAndOrganization(
          ownerA,
          organization.id,
        ),
        null,
      );

      assert.ok(
        await memberRepository.findByUserAndOrganization(
          ownerB,
          organization.id,
        ),
      );

      console.log("PASS removing one of two Owners is allowed");
    }

    // 4. Removing the last Owner is rejected.
    {
      const { organization, ownerRole } =
        await createOrganization("remove-last-owner");

      const owner = await createUser("remove-last-owner-user");

      await memberRepository.create({
        userId: owner,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await assert.rejects(
        service.removeMember(owner, organization.id),
        { message: "Cannot remove the last owner of an organization" },
      );

      assert.ok(
        await memberRepository.findByUserAndOrganization(
          owner,
          organization.id,
        ),
      );

      console.log("PASS removing the last Owner is rejected");
    }

    // 5. Removing a normal member is allowed.
    {
      const { organization, ownerRole, memberRole } =
        await createOrganization("remove-normal-member");

      const owner = await createUser("normal-member-owner");
      const member = await createUser("normal-member-user");

      await memberRepository.create({
        userId: owner,
        organizationId: organization.id,
        roleId: ownerRole.id,
      });

      await memberRepository.create({
        userId: member,
        organizationId: organization.id,
        roleId: memberRole.id,
      });

      await service.removeMember(member, organization.id);

      assert.equal(
        await memberRepository.findByUserAndOrganization(
          member,
          organization.id,
        ),
        null,
      );

      console.log("PASS removing a normal member is allowed");
    }

    console.log("\nAll OrganizationMemberService integration tests passed!");
  } finally {
    for (const organizationId of organizationIds) {
      await database.query(
        "DELETE FROM organizations WHERE id = $1",
        [organizationId],
      );
    }

    for (const userId of userIds) {
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
