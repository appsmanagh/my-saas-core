import {
  RateLimitError,
} from "../errors";

import type {
  RateLimiter,
} from "./rate-limiter";

interface LoginRateLimitInput {
  ip: string;
  email: string;
}

export class LoginRateLimit {

  constructor(
    private readonly ipLimiter: RateLimiter,
    private readonly emailLimiter: RateLimiter,
  ) {}

  async check(
    input: LoginRateLimitInput,
  ): Promise<void> {

    const ipResult =
      await this.ipLimiter.check(
        `login-ip:${input.ip}`,
      );

    if (!ipResult.allowed) {
      throw new RateLimitError(
        `Too many login attempts. Try again in ${ipResult.retryAfterSeconds} seconds.`,
      );
    }

    const emailResult =
      await this.emailLimiter.check(
        `login-email:${input.email}`,
      );

    if (!emailResult.allowed) {
      throw new RateLimitError(
        `Too many login attempts. Try again in ${emailResult.retryAfterSeconds} seconds.`,
      );
    }
  }

  async recordFailure(
    input: LoginRateLimitInput,
  ): Promise<void> {

    await this.ipLimiter.recordFailure(
      `login-ip:${input.ip}`,
    );

    await this.emailLimiter.recordFailure(
      `login-email:${input.email}`,
    );
  }

  async reset(
    input: LoginRateLimitInput,
  ): Promise<void> {

    await this.ipLimiter.reset(
      `login-ip:${input.ip}`,
    );

    await this.emailLimiter.reset(
      `login-email:${input.email}`,
    );
  }
}