// 19. La razón es que actualmente nuestros servicios hablan en términos de errores de aplicación:

// ValidationError
// ConflictError
// UnauthorizedError
// NotFoundError

// Pero HTTP necesita:

// 400
// 401
// 404
// 409
// 500

// Entonces necesitamos un traductor:


import type { ErrorRequestHandler } from "express";
import { AppError } from "../../errors";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400 &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: {
        message: "Invalid JSON",
        code: "INVALID_JSON",
      },
    });

    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });

    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    },
  });
};
