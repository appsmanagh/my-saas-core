//8. para Traducir errores de PostgreSQL

import { ConflictError } from "../../../errors";
import { DatabaseError } from "../../../errors";

export function translatePostgresError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = (error as { code?: string }).code;

    if (code === "23505") {
      throw new ConflictError(
        "A record with the same unique value already exists",
      );
    }
  }

  throw new DatabaseError();
}