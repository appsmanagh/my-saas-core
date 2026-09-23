//6. este file es para errors de tipo este item ya existe

import { AppError } from "./app-error";

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);

    this.name = "ConflictError";
  }
}