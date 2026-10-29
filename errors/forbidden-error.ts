
//41. Paso 6. Definir ForbiddenError
// Hay una diferencia importante entre estos dos casos:
// Estado HTTP	Significado
// 401 Unauthorized	El usuario no está autenticado o su sesión no es válida.
// 403 Forbidden	El usuario está autenticado, pero no tiene permiso para realizar la acción.
//41. end ---

import { AppError } from "./app-error";

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}
