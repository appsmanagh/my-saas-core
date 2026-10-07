// 6. este file es para errors de no fue encontrado. 
// Por ejemplo:

// User not found
// Organization not found
// Subscription not found

import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");

    this.name = "NotFoundError";
  }
}