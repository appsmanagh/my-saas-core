import type { AuthService } from "../../auth/auth-service";
import { UnauthorizedError } from "../../errors";
import { extractSessionToken } from "../session-token";

export interface AuthenticatedRequest {
  user: Awaited<
    ReturnType<AuthService["getUserBySessionToken"]>
  >;
}

export function createAuthMiddleware(
  authService: AuthService,
) {
  return async function requireAuth(
    request: any,
    response: any,
    next: any,
  ) {
    const token =
      extractSessionToken(request);

    if (!token) {
      next(
        new UnauthorizedError(
          "Authentication required",
        ),
      );

      return;
    }

    try {
      const user =
        await authService.getUserBySessionToken(
          token,
        );

      request.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
}