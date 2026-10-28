//19. Su responsabilidad será exclusivamente:

//"Dame una HTTP request y dime qué session token contiene."

import type { Request } from "express";

export function extractSessionToken(
  request: Pick<Request, "headers">,
): string | null {
  const authorization = request.headers.authorization;

  // 1. Authorization: Bearer <token>
  if (authorization) {
    const [scheme, token] = authorization.split(" ");

    if (scheme?.toLowerCase() === "bearer" && token) {
      return token;
    }
  }

  // 2. Cookie: session_token=<token>
  const cookieHeader = request.headers.cookie;

  if (cookieHeader) {
    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim());

    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.split("=");

      if (name === "session_token") {
        const value = valueParts.join("=");

        if (value) {
          return decodeURIComponent(value);
        }
      }
    }
  }

  return null;
}
