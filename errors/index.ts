//6. este file es el que exporta los demas modues de errors

export { AppError } from "./app-error";
export { ValidationError } from "./validation-error";
export { NotFoundError } from "./not-found-error";
export { ConflictError } from "./conflict-error";

//8. aqui se debe incluir el nuevo modulo de postgress errors
export { DatabaseError } from "./database-error";