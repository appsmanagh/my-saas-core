// 14. este file prueba el repository de auth 

import { createDatabase } from "../../database/database-provider";
import { PostgresAuthRepository } from "../../auth/repositories/postgres-auth-repository";
import { PasswordService } from "../../auth/password-service";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const authRepository =
      new PostgresAuthRepository(database);

    const passwordService =
      new PasswordService();

    /*
     * Para este test necesitamos un usuario existente.
     *
     * Utilizamos uno de los usuarios que ya tenemos
     * en PostgreSQL.
     */
    const users = await database.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM users
        LIMIT 1
      `,
    );

    if (users.length === 0) {
      throw new Error(
        "No users found. Create a user before running this test.",
      );
    }

    const userId = users[0].id;

    const password = "MySecurePassword123!";

    const passwordHash =
      await passwordService.hashPassword(password);

    const now = new Date();

    const credentials = {
      userId,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    // CREATE

    const created =
      await authRepository.create(credentials);

    console.log("1. CREATED");
    console.log(created);

    // FIND

    const found =
      await authRepository.findByUserId(userId);

    console.log("2. FOUND");
    console.log(found);

    // VERIFY PASSWORD

    if (!found) {
      throw new Error("Credentials not found");
    }

    const valid =
      await passwordService.verifyPassword(
        password,
        found.passwordHash,
      );

    console.log("3. PASSWORD VALID");
    console.log(valid);

    // UPDATE PASSWORD

    const newPassword =
      "MyNewSecurePassword456!";

    const newPasswordHash =
      await passwordService.hashPassword(newPassword);

    const updated =
      await authRepository.update({
        ...found,
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      });

    console.log("4. UPDATED");
    console.log(updated);

    // DELETE

    await authRepository.deleteByUserId(userId);

    console.log("5. DELETED");

    // VERIFY DELETE

    const deleted =
      await authRepository.findByUserId(userId);

    console.log("6. DELETE VERIFIED");
    console.log(deleted);
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});