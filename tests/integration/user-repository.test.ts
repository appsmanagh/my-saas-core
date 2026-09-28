//4. Y con este file se prueban las function de repository

import { InMemoryUserRepository } from "../users/repositories/in-memory-user-repository";
import type { User } from "../users/user";

async function main() {
  const repository = new InMemoryUserRepository();

  const user: User = {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdUser = await repository.create(user);

  console.log("Created:", createdUser);

  const foundUser = await repository.findById("user-1");

  console.log("Found:", foundUser);

  const foundByEmail = await repository.findByEmail("test@example.com");

  console.log("Found by email:", foundByEmail);

  await repository.delete("user-1");

  const deletedUser = await repository.findById("user-1");

  console.log("After delete:", deletedUser);
}

main();