// 6. Representa:

//"Los datos que me proporcionaste no son válidos."

import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);

    this.name = "ValidationError";
  }
}