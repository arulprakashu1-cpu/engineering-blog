// Simple in-memory IP rate limiter for the comment form. This deters casual
// spam and is sufficient for a single-instance deployment. For multi-instance
// / serverless scale-out, swap this for a shared store (e.g. Upstash Redis).
//
// Note: on Vercel's serverless runtime each instance has its own memory, so
// this is best-effort. It is intentionally dependency-free.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= opts.limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: opts.limit - bucket.count, retryAfterMs: 0 };
}

// Opportunistic cleanup so the map does not grow unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [k, v] of Array.from(buckets.entries())) {
        if (now > v.resetAt) buckets.delete(k);
      }
    },
    10 * 60 * 1000,
  ).unref?.();
}
