//12. este file es para probar el crud completo de users so far

import { createDatabase } from "../../database/database-provider";
import { PostgresUserRepository } from "../../users/repositories/postgres-user-repository";
import { UserService } from "../../users/user-service";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const repository = new PostgresUserRepository(database);
    const service = new UserService(repository);

    // CREATE
    const user = await service.createUser({
      email: `crud-${Date.now()}@example.com`,
      name: "John Doe",
    });

    console.log("1. CREATED");
    console.log(user);

    // GET BY ID
    const foundById = await service.getUserById(user.id);

    console.log("2. FOUND BY ID");
    console.log(foundById);

    // GET BY EMAIL
    const foundByEmail =
      await service.getUserByEmail(user.email);

    console.log("3. FOUND BY EMAIL");
    console.log(foundByEmail);

    // UPDATE
    const updated =
      await service.updateProfile(user.id, {
        name: "John Updated",
      });

    console.log("4. UPDATED");
    console.log(updated);

    // DEACTIVATE
    const deactivated =
      await service.deactivateUser(user.id);

    console.log("5. DEACTIVATED");
    console.log(deactivated);

    // ACTIVATE
    const activated =
      await service.activateUser(user.id);

    console.log("6. ACTIVATED");
    console.log(activated);

    // DELETE
    await service.deleteUser(user.id);

    console.log("7. DELETED");

    // VERIFY DELETE
    try {
      await service.getUserById(user.id);
    } catch (error) {
      console.log("8. DELETE VERIFIED");

      if (error instanceof Error) {
        console.log(error.name);
        console.log(error.message);
      }
    }
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});