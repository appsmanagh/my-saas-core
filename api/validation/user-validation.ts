//25. este es el file para user validaitions inputs


import { z } from "zod";
import { ValidationError } from "../../errors";

const updateUserProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required"),
  })
  .strict();
//25. con ese .strict() in dica que solo los fields dentro del object son admitidos

export function validateUpdateUserProfileInput(
  input: unknown,
): {
  name: string;
} {
  const result =
    updateUserProfileSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues[0].message,
    );
  }

  return result.data;
}