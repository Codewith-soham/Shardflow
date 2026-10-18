/**
 * Minimal in-memory fixed-window rate limiter for unauthenticated auth endpoints.
 * Per-process only; replace with a shared store if the control plane is scaled horizontally.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxHits: number,
    private readonly windowMs: number
  ) {}

  /** Records a hit and returns true if the key is still within its allowance. */
  consume(key: string, now: number = Date.now()): boolean {
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) {
        if (v.resetAt <= now) this.hits.delete(k);
      }
    }

    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count += 1;
    return entry.count <= this.maxHits;
  }
}
