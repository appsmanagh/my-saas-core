// 15. ¿Por qué podemos usar SHA-256 aquí pero no para passwords?

// Esta distinción es muy importante.

// Para passwords:

// Password
//    ↓
// Argon2id

// porque las contraseñas suelen ser relativamente débiles y necesitamos un algoritmo deliberadamente costoso.

// Para un token generado aleatoriamente:

// randomBytes()
//       ↓
// token con mucha entropía
//       ↓
// SHA-256

// El token ya es impredecible.

// No necesitamos tratarlo como una contraseña humana.

import {
  createHash,
  randomBytes,
} from "node:crypto";

export class SessionTokenService {
  generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  hashToken(token: string): string {
    return createHash("sha256")
      .update(token)
      .digest("hex");
  }
}