import type {
  RateLimiter,
  RateLimitResult,
} from "../rate-limiter";

interface RateLimitEntry {
  failures: number;
  resetAt: number;
}

export class InMemoryRateLimiter
  implements RateLimiter
{
  private readonly entries =
    new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxAttempts: number = 5,
    private readonly windowSeconds: number = 60,
  ) {}

  async check(
    key: string,
  ): Promise<RateLimitResult> {

    const now = Date.now();

    const entry = this.entries.get(key);

    if (!entry || now >= entry.resetAt) {
      return {
        allowed: true,
        remaining: this.maxAttempts,
        retryAfterSeconds: 0,
      };
    }

    if (entry.failures >= this.maxAttempts) {
      const retryAfterSeconds =
        Math.ceil(
          (entry.resetAt - now) / 1000,
        );

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      remaining:
        this.maxAttempts - entry.failures,
      retryAfterSeconds: 0,
    };
  }

  async recordFailure(
    key: string,
  ): Promise<void> {

    const now = Date.now();

    const existing = this.entries.get(key);

    if (
      !existing ||
      now >= existing.resetAt
    ) {
      this.entries.set(key, {
        failures: 1,
        resetAt:
          now +
          this.windowSeconds * 1000,
      });

      return;
    }

    existing.failures += 1;
  }

  async reset(
    key: string,
  ): Promise<void> {
    this.entries.delete(key);
  }
}