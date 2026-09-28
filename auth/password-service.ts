import argon2 from "argon2";

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    if (!password) {
      throw new Error("Password is required");
    }

    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  async verifyPassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    if (!password || !passwordHash) {
      return false;
    }

    return argon2.verify(passwordHash, password);
  }
}