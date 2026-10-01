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

import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  AppError,
} from "../../errors";


export function errorMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
) {

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
}