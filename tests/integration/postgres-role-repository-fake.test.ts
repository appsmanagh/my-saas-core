
import assert from "node:assert/strict";
import type { Database } from "../../database/database";
import { PostgresRoleRepository } from "../../roles/repositories/postgres-role-repository";

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

const sampleRole = {
  id: "role-123",
  organization_id: "org-123",
  name: "Admin",
  description: "Administrator role",
  created_at: new Date("2026-01-01T10:00:00Z"),
  updated_at: new Date("2026-01-01T10:00:00Z"),
};

async function main() {
  const database = new FakeDatabase();
  const repository = new PostgresRoleRepository(database);

  // 1. Create
  database.responses.push([sampleRole]);

  const created = await repository.create({
    organizationId: "org-123",
    name: "Admin",
    description: "Administrator role",
  });

  assert.equal(created.id, "role-123");
  assert.equal(created.organizationId, "org-123");
  assert.equal(created.name, "Admin");
  assert.equal(created.description, "Administrator role");
  assert.match(database.calls[0].text, /INSERT INTO roles/i);
  assert.deepEqual(database.calls[0].values?.slice(1, 4), [
    "org-123",
    "Admin",
    "Administrator role",
  ]);
  console.log("PASS create maps the returned row");

  // 2. Find by ID
  database.responses.push([sampleRole]);

  const found = await repository.findById("role-123");

  assert.equal(found?.id, "role-123");
  assert.match(database.calls[1].text, /WHERE id = \$1/i);
  assert.deepEqual(database.calls[1].values, ["role-123"]);
  console.log("PASS findById uses a parameterized query");

  // 3. Missing role
  database.responses.push([]);

  const missing = await repository.findById("missing");

  assert.equal(missing, null);
  console.log("PASS findById returns null when missing");

  // 4. Find by organization
  database.responses.push([sampleRole]);

  const roles = await repository.findByOrganization("org-123");

  assert.equal(roles.length, 1);
  assert.equal(roles[0].organizationId, "org-123");
  assert.match(database.calls[3].text, /ORDER BY name ASC/i);
  console.log("PASS findByOrganization maps the results");

  // 5. Update only the name
  database.responses.push([{ ...sampleRole, name: "Owner" }]);

  const updated = await repository.update("role-123", {
    name: "Owner",
  });

  assert.equal(updated?.name, "Owner");
  assert.match(database.calls[4].text, /name = \$2/i);
  assert.deepEqual(database.calls[4].values, ["role-123", "Owner"]);
  console.log("PASS update builds the expected parameterized query");

  // 6. Delete
  await repository.delete("role-123");

  assert.match(database.calls[5].text, /DELETE FROM roles/i);
  assert.deepEqual(database.calls[5].values, ["role-123"]);
  console.log("PASS delete uses a parameterized query");

  console.log("\nAll PostgresRoleRepository tests passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});