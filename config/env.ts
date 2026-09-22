

// 2. este es el file que implementa zod
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  DATABASE_PROVIDER: z
    .enum(["in-memory", "supabase", "postgres"])
    .default("in-memory"),

  DATABASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);