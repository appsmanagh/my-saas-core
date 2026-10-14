
import assert from "node:assert/strict";

import { createDatabase } from "../../database/database-provider";
import { PostgresPermissionRepository } from "../../permissions/repositories/postgres-permission-repository";
import { PERMISSION_KEYS } from "../../permissions/permission";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const repository = new PostgresPermissionRepository(database);

    const permission = await repository.findByKey(
      PERMISSION_KEYS.USERS_READ,
    );

    assert.ok(permission);
    assert.equal(permission.key, PERMISSION_KEYS.USERS_READ);
    console.log("PASS: find permission by key");

    const permissions = await repository.findByKeys([
      PERMISSION_KEYS.USERS_READ,
      PERMISSION_KEYS.USERS_UPDATE,
    ]);

    assert.equal(permissions.length, 2);
    console.log("PASS: find multiple permissions");

    const emptyResult = await repository.findByKeys([]);
    assert.deepEqual(emptyResult, []);
    console.log("PASS: empty permission key list");

    const allPermissions = await repository.findAll();
    assert.equal(allPermissions.length, 8);
    console.log("PASS: find all permissions");

    const missingPermission = await repository.findByKey(
      "unknown:permission" as typeof PERMISSION_KEYS.USERS_READ,
    );

    assert.equal(missingPermission, null);
    console.log("PASS: return null for missing permission");
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});