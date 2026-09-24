//9. este es el script que se encraga de actaulizar las migrations 
// crear tables, apdate columns etc

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabase } from "./database-provider";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const database = createDatabase();

  await database.connect();

  try {
    await database.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDirectory = path.join(
      __dirname,
      "migrations",
    );

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const version = file.replace(".sql", "");

      const applied = await database.query<{ version: string }>(
        `
          SELECT version
          FROM schema_migrations
          WHERE version = $1
        `,
        [version],
      );

      if (applied.length > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = await fs.readFile(
        path.join(migrationsDirectory, file),
        "utf8",
      );

      console.log(`Applying ${file}`);

      await database.query(sql);

      await database.query(
        `
          INSERT INTO schema_migrations (version)
          VALUES ($1)
        `,
        [version],
      );

      console.log(`Applied ${file}`);
    }
  } finally {
    await database.disconnect();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});