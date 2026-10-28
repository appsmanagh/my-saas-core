
//10. este es el file que prueba user con DDBB postgres y el fluj completo del api(con usaerservice) 

import { createDatabase } from "../../database/database-provider";
import { PostgresUserRepository } from "../../users/repositories/postgres-user-repository";
import { UserService } from "../../users/user-service";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const repository = new PostgresUserRepository(database);
    const service = new UserService(repository);

    const email = `test-${Date.now()}@example.com`;

    const user = await service.createUser({
      email: `  ${email.toUpperCase()}  `,
      name: "  John Doe  ",
    });

    console.log("Created user:");
    console.log(user);

    const foundUser = await service.getUserById(user.id);

    console.log("Found user:");
    console.log(foundUser);

    try {
      await service.createUser({
        email,
        name: "Another User",
      });
    } catch (error) {
      console.log("Expected duplicate error:");

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