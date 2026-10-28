import { createDatabase } from "../../database/database-provider";
import { PostgresUserRepository } from "../../users/repositories/postgres-user-repository";
import type { User } from "../../users/user";

async function main() {
  const database = createDatabase();

  await database.connect();

  const repository = new PostgresUserRepository(database);

 const user: User = {
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: "Postgres Test",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdUser = await repository.create(user);

  console.log("Created:", createdUser);

  const foundUser = await repository.findById(user.id);

  console.log("Found:", foundUser);

  const foundByEmail = await repository.findByEmail(user.email);

  console.log("Found by email:", foundByEmail);

  await repository.delete(user.id);

  const deletedUser = await repository.findById(user.id);

  console.log("After delete:", deletedUser);

  await database.disconnect();
}

main();