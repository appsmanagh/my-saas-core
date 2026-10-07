//8. esye file meneja los errors de postgress
import { AppError } from "./app-error";

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");

    this.name = "DatabaseError";
  }
}