
// 5. con este file se prueba user-service
import { InMemoryUserRepository } from "../users/repositories/in-memory-user-repository";
import { UserService } from "../users/user-service";

async function main() {
  const repository = new InMemoryUserRepository();
  const service = new UserService(repository);

  const user = await service.createUser({
    email: "  TEST@Example.COM ",
    name: "  John Doe  ",
  });

  console.log("Created user:", user);

  const foundUser = await repository.findByEmail(
    "test@example.com",
  );

  console.log("Found user:", foundUser);

  try {
    await service.createUser({
      email: "TEST@example.com",
      name: "Another User",
    });
  } catch (error) {
    console.log(
      "Duplicate email error:",
      error instanceof Error ? error.message : error,
    );
  }

  const userById = await service.getUserById("abc");

  console.log("Not found user:", userById);


}

main();