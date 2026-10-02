//21. este es el module de validate password

import { ValidationError } from "../errors";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialCharacter: boolean;
}

export const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialCharacter: true,
};

export function validatePassword(
  password: string,
  policy: PasswordPolicy = defaultPasswordPolicy,
): void {

  if (password.length < policy.minLength) {
    throw new ValidationError(
      `Password must be at least ${policy.minLength} characters long`,
    );
  }

  if (
    policy.requireUppercase &&
    !/[A-Z]/.test(password)
  ) {
    throw new ValidationError(
      "Password must contain an uppercase letter",
    );
  }

  if (
    policy.requireLowercase &&
    !/[a-z]/.test(password)
  ) {
    throw new ValidationError(
      "Password must contain a lowercase letter",
    );
  }

  if (
    policy.requireNumber &&
    !/[0-9]/.test(password)
  ) {
    throw new ValidationError(
      "Password must contain a number",
    );
  }

  if (
    policy.requireSpecialCharacter &&
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new ValidationError(
      "Password must contain a special character",
    );
  }
}