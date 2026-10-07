//24. este es el file para validation inputs

import { z } from "zod";

import { ValidationError } from "../../errors";

const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  name: z
    .string()
    .trim()
    .min(1, "Name is required"),

  password: z
    .string()
    .min(1, "Password is required"),
});

export function validateLoginInput(input: unknown): {
  email: string;
  password: string;
} {
  const result = loginSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues[0].message,
    );
  }

  return result.data;
}

export function validateRegisterInput(input: unknown): {
  email: string;
  name: string;
  password: string;
} {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues[0].message,
    );
  }

  return result.data;
}