//8. esye file meneja los errors de postgress
import { AppError } from "./app-error";

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, "DATABASE_ERROR", 500);

    this.name = "DatabaseError";
  }
}