import { createDatabase } from "../../database/database-provider";
import { PostgresSessionRepository } from "../../auth/sessions/postgres-session-repository";
import { SessionTokenService } from "../../auth/sessions/session-token-service";

async function main() {
  const database = createDatabase();

  await database.connect();

  try {
    const sessionRepository =
      new PostgresSessionRepository(database);

    const tokenService =
      new SessionTokenService();

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
        "No users found. Create a user first.",
      );
    }

    const userId = users[0].id;

    const token = tokenService.generateToken();
    const tokenHash = tokenService.hashToken(token);

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + 1000 * 60 * 60,
    );

    const session = {
      id: crypto.randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    };

    // CREATE

    const created =
      await sessionRepository.create(session);

    console.log("1. CREATED");
    console.log(created);

    // FIND

    const found =
      await sessionRepository.findByTokenHash(
        tokenHash,
      );

    console.log("2. FOUND");
    console.log(found);

    // WRONG TOKEN

    const wrongToken =
      tokenService.generateToken();

    const wrongTokenHash =
      tokenService.hashToken(wrongToken);

    const notFound =
      await sessionRepository.findByTokenHash(
        wrongTokenHash,
      );

    console.log("3. WRONG TOKEN");
    console.log(notFound);

    // DELETE

    await sessionRepository.delete(
      session.id,
    );

    const deleted =
      await sessionRepository.findByTokenHash(
        tokenHash,
      );

    console.log("4. DELETE VERIFIED");
    console.log(deleted);
  } finally {
    await database.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});