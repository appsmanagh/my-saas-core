
import assert from "node:assert/strict";

import type { Database } from "../../database/database";
import { PostgresOrganizationRepository } from "../../organizations/repositories/postgres-organization-repository";

class FakeDatabase implements Database {
  calls: { text: string; values?: unknown[] }[] = [];
  responses: unknown[][] = [];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async query<T>(
    text: string,
    values?: unknown[],
  ): Promise<T[]> {
    this.calls.push({ text, values });
    return (this.responses.shift() ?? []) as T[];
  }
}

const sampleOrganization = {
  id: "org-123",
  name: "My Company",
  slug: "my-company",
  created_at: new Date("2026-01-01T10:00:00Z"),
  updated_at: new Date("2026-01-01T10:00:00Z"),
};

async function main() {
  const database = new FakeDatabase();
  const repository = new PostgresOrganizationRepository(database);

  // 1. Create
  database.responses.push([sampleOrganization]);

  const created = await repository.create({
    name: "My Company",
    slug: "my-company",
  });

  assert.equal(created.id, "org-123");
  assert.equal(created.name, "My Company");
  assert.equal(created.slug, "my-company");
  assert.ok(created.createdAt instanceof Date);
  assert.match(database.calls[0].text, /INSERT INTO organizations/i);
  assert.deepEqual(database.calls[0].values?.slice(1), [
    "My Company",
    "my-company",
  ]);
  console.log("PASS create maps the returned row");

  // 2. Find by ID
  database.responses.push([sampleOrganization]);

  const foundById = await repository.findById("org-123");

  assert.equal(foundById?.id, "org-123");
  assert.match(database.calls[1].text, /WHERE id = \$1/i);
  assert.deepEqual(database.calls[1].values, ["org-123"]);
  console.log("PASS findById uses a parameterized query");

  // 3. Find by slug
  database.responses.push([sampleOrganization]);

  const foundBySlug = await repository.findBySlug("my-company");

  assert.equal(foundBySlug?.slug, "my-company");
  assert.match(database.calls[2].text, /WHERE slug = \$1/i);
  assert.deepEqual(database.calls[2].values, ["my-company"]);
  console.log("PASS findBySlug uses a parameterized query");

  // 4. Missing organization
  database.responses.push([]);

  const missing = await repository.findById("missing-id");

  assert.equal(missing, null);
  console.log("PASS findById returns null when missing");

  // 5. Find all
  database.responses.push([
    sampleOrganization,
    {
      ...sampleOrganization,
      id: "org-456",
      name: "Another Company",
      slug: "another-company",
    },
  ]);

  const organizations = await repository.findAll();

  assert.equal(organizations.length, 2);
  assert.equal(organizations[1].slug, "another-company");
  assert.match(database.calls[4].text, /ORDER BY name ASC/i);
  console.log("PASS findAll maps the returned rows");

  // 6. Update name
  database.responses.push([
    { ...sampleOrganization, name: "Updated Company" },
  ]);

  const updated = await repository.update("org-123", {
    name: "Updated Company",
  });

  assert.equal(updated?.name, "Updated Company");
  assert.match(database.calls[5].text, /name = \$2/i);
  assert.deepEqual(database.calls[5].values, [
    "org-123",
    "Updated Company",
  ]);
  console.log("PASS update builds a parameterized query");

  // 7. Update with no fields
  database.responses.push([sampleOrganization]);

  const unchanged = await repository.update("org-123", {});

  assert.equal(unchanged?.id, "org-123");
  assert.match(database.calls[6].text, /WHERE id = \$1/i);
  console.log("PASS empty update delegates to findById");

  // 8. Delete
  await repository.delete("org-123");

  assert.match(database.calls[7].text, /DELETE FROM organizations/i);
  assert.deepEqual(database.calls[7].values, ["org-123"]);
  console.log("PASS delete uses a parameterized query");

  console.log("\nAll PostgresOrganizationRepository tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});