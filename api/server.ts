// 19. Este archivo será el punto donde conectamos Express con nuestro Core.

import express from "express";

import { createDatabase } from "../database/database-provider";

import { UserService } from "../users/user-service";
import { PostgresUserRepository } from "../users/repositories/postgres-user-repository";

import { PasswordService } from "../auth/password-service";
import { PostgresAuthRepository } from "../auth/repositories/postgres-auth-repository";

import { PostgresSessionRepository } from "../auth/sessions/postgres-session-repository";

import { AuthService } from "../auth/auth-service";

import { createAuthRoutes } from "./routes/auth-routes";
import { createAuthMiddleware } from "./middleware/auth-middleware";

//19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
import cookieParser from "cookie-parser";


//19. aqui se importa el middleware para traducir los errores de cada aplication de la api
import { errorMiddleware } 
from "./middleware/error-middleware";


//20. asi se importa una nueva ruta de endpoints 
import { createUserRoutes } 
from "./routes/user-routes";

//22. composition root - LoginRateLimit
import {
  InMemoryRateLimiter,
} from "../security/adapters/in-memory-rate-limiter";

//22. composition root - LoginRateLimit
import {
  LoginRateLimit,
} from "../security/login-rate-limit";

const app = express();

app.use(express.json());

// 19. Express necesita un pequeño middleware adicional para manejar cookies correctamente.
app.use(cookieParser());

async function bootstrap() {
  const database = createDatabase();

  await database.connect();

  const userRepository =
    new PostgresUserRepository(database);

  const userService =
    new UserService(userRepository);

  const passwordService =
    new PasswordService();

  const authRepository =
    new PostgresAuthRepository(database);

  const sessionRepository =
    new PostgresSessionRepository(database);

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Rate limiter por IP
  const ipRateLimiter =
    new InMemoryRateLimiter(
      10,
      60,
    );

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Rate limiter por email
  const emailRateLimiter =
    new InMemoryRateLimiter(
      5,
      60,
    );

//22. composition root - LoginRateLimit
  //22 aqui es donde se hace el cambi a redis
  // Política de rate limiting para login
  const loginRateLimit =
    new LoginRateLimit(
      ipRateLimiter,
      emailRateLimiter,
    );

//22 se agrega loginRateLimit a AuthService
  const authService =
    new AuthService(
      userService,
      passwordService,
      authRepository,
      sessionRepository,
      loginRateLimit,
    );

  const requireAuth =
    createAuthMiddleware(authService);

  app.use(
    "/api/auth",
    createAuthRoutes(
      authService,
      requireAuth,
    ),
  );

//20. asi se importa una nueva ruta de endpoints 
  app.use(
    "/api/users",
    createUserRoutes(
      userService,
      requireAuth,
    ),
  );

  app.use(
    errorMiddleware,
    );

  const port =
    Number(process.env.PORT) || 3001;

  app.listen(port, () => {
    console.log(
      `API running on http://localhost:${port}`,
    );
  });
}

bootstrap().catch((error) => {
  console.error(
    "Failed to start API",
    error,
  );

  process.exit(1);
});