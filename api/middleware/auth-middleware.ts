
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import type { AuthService } from "../../auth/auth-service";
import { UnauthorizedError } from "../../errors";
import { extractSessionToken } from "../session-token";

export function createAuthMiddleware(
  authService: AuthService,
) {
  return async function requireAuth(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractSessionToken(request);

    if (!token) {
      next(
        new UnauthorizedError("Authentication required"),
      );
      return;
    }

    try {
      const user = await authService.getUserBySessionToken(token);

      request.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}
