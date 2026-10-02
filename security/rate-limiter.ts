// 21. Esto es nuestra frontera.

// El resto del sistema solamente sabe:

// rateLimiter.check(...)

// No sabe qué hay detrás.

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
  recordFailure(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}

// 21. ¿Qué significa key?

// Esta parte es importante.

// No necesariamente queremos limitar solamente por IP.

// Podríamos tener:

// IP
// email
// userId
// API key
// endpoint

// Por ejemplo:

// await rateLimiter.check(
//   `login:${email}`,
// );

// Podríamos tener:

// login:user@example.com

// Y también:

// await rateLimiter.check(
//   `login-ip:${ip}`,
// );

// Eso nos permite posteriormente hacer diferentes políticas.

// Por ahora no compliquemos demasiado.