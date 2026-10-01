//19. Extendemos Express.Request
    // e hace esto con otros mondules ??

import type { User } from "../users/user";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};