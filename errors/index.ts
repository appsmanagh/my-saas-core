//6. este file es el que exporta los demas modues de errors

export { AppError } from "./app-error";
export { ValidationError } from "./validation-error";
export { NotFoundError } from "./not-found-error";
export { ConflictError } from "./conflict-error";

//8. aqui se debe incluir el nuevo modulo de postgress errors
export { DatabaseError } from "./database-error";

//17. aqui se incluye el module de error de login

export * from "./unauthorized-error";

export { RateLimitError } from "./rateLimitError";

//41. se importa el type de error ForbiddenError
export { ForbiddenError } from "./forbidden-error";