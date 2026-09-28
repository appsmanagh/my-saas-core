//13. este test prueba el has y el verify del auth (password-service.ts)

import { PasswordService } from "../../auth/password-service";

async function main() {
  const passwordService = new PasswordService();

  const password = "MySuperSecretPassword123!";

  // HASH
  const hash = await passwordService.hashPassword(password);

  console.log("Password hash:");
  console.log(hash);

  // VERIFY CORRECT PASSWORD
  const valid = await passwordService.verifyPassword(
    password,
    hash,
  );

  console.log("Correct password:");
  console.log(valid);

  // VERIFY WRONG PASSWORD
  const invalid = await passwordService.verifyPassword(
    "WrongPassword123!",
    hash,
  );

  console.log("Wrong password:");
  console.log(invalid);

  // VERIFY SAME PASSWORD AGAIN
  const validAgain = await passwordService.verifyPassword(
    password,
    hash,
  );

  console.log("Correct password again:");
  console.log(validAgain);

  const hash2 = await passwordService.hashPassword(password);

    console.log("Second hash:");
    console.log(hash2);

    console.log("Hashes are equal:");
    console.log(hash === hash2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});