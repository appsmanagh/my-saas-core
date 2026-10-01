//19. Su responsabilidad será exclusivamente:

//"Dame una HTTP request y dime qué session token contiene."


export interface SessionRequest {
  headers: {
    authorization?: string;
    cookie?: string;
  };
}

export function extractSessionToken(
  request: SessionRequest,
): string | null {
  // 1. Authorization: Bearer <token>

  const authorization =
    request.headers.authorization;

  if (authorization) {
    const [scheme, token] =
      authorization.split(" ");

    if (
      scheme?.toLowerCase() === "bearer" &&
      token
    ) {
      return token;
    }
  }

  // 2. Cookie: session_token=<token>

  const cookieHeader =
    request.headers.cookie;

  if (cookieHeader) {
    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim());

    for (const cookie of cookies) {
      const [name, ...valueParts] =
        cookie.split("=");

      if (name === "session_token") {
        const value =
          valueParts.join("=");

        if (value) {
          return decodeURIComponent(value);
        }
      }
    }
  }

  return null;
}