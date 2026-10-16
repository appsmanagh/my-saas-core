//30. estos son los tests de organizations services
import assert from "node:assert/strict";

import { OrganizationService } from "../../organizations/organization-service";
import { InMemoryOrganizationRepository } from "../../organizations/repositories/in-memory-organization-repository";

async function expectError(
  operation: () => Promise<unknown>,
  errorName: string,
): Promise<void> {
  try {
    await operation();
    assert.fail(`Expected ${errorName} to be thrown`);
  } catch (error) {
    if (error instanceof assert.AssertionError) {
      throw error;
    }

    assert.equal(
      (error as Error).constructor.name,
      errorName,
      `Expected ${errorName}, received ${(error as Error).constructor.name}`,
    );
  }
}

async function main() {
  const repository = new InMemoryOrganizationRepository();
  const service = new OrganizationService(repository);

  // 1. Create organization and normalize values
  const organization = await service.createOrganization({
    name: "  My Company  ",
    slug: "  My-Company  ",
  });

  assert.equal(organization.name, "My Company");
  assert.equal(organization.slug, "my-company");
  assert.ok(organization.id);
  console.log("PASS create organization and normalize values");

  // 2. Reject empty name
  await expectError(
    () => service.createOrganization({ name: "  ", slug: "company" }),
    "ValidationError",
  );
  console.log("PASS reject empty organization name");

  // 3. Reject invalid slug
  await expectError(
    () => service.createOrganization({ name: "Company", slug: "My Company!" }),
    "ValidationError",
  );
  console.log("PASS reject invalid slug");

  // 4. Reject duplicate slug
  await expectError(
    () => service.createOrganization({ name: "Another Company", slug: "MY-COMPANY" }),
    "ConflictError",
  );
  console.log("PASS reject duplicate slug");

  // 5. Find organization by slug, case-insensitively
  const found = await service.getOrganizationBySlug("  MY-COMPANY  ");

  assert.equal(found.id, organization.id);
  console.log("PASS find organization by normalized slug");

  // 6. Reject missing organization
  await expectError(
    () => service.getOrganizationById("missing-id"),
    "NotFoundError",
  );
  console.log("PASS reject missing organization");

  // 7. Update organization
  const updated = await service.updateOrganization(organization.id, {
    name: "Updated Company",
  });

  assert.equal(updated.name, "Updated Company");
  assert.ok(updated.updatedAt instanceof Date);
  console.log("PASS update organization");

  // 8. Reject empty update
  await expectError(
    () => service.updateOrganization(organization.id, {}),
    "ValidationError",
  );
  console.log("PASS reject empty update");

  // 9. Reject slug collision during update
  const second = await service.createOrganization({
    name: "Second Company",
    slug: "second-company",
  });

  await expectError(
    () => service.updateOrganization(second.id, { slug: "my-company" }),
    "ConflictError",
  );
  console.log("PASS reject duplicate slug during update");

  // 10. Delete organization
  await service.deleteOrganization(second.id);

  assert.equal(await repository.findById(second.id), null);
  console.log("PASS delete organization");

  // 11. Reject deletion of a missing organization
  await expectError(
    () => service.deleteOrganization("missing-id"),
    "NotFoundError",
  );
  console.log("PASS reject deletion of missing organization");

  console.log("\nAll OrganizationService tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});