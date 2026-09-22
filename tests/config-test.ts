
// 2. este file es de pruebas asi se llaman a las environments
import { env } from "../config/env";

console.log("Environment:", env.NODE_ENV);
console.log("Port:", env.PORT);
console.log("Database:", env.DATABASE_URL);