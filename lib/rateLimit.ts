import 'server-only';

type Bucket = { count: number; resetAt: number };

// Single-process, in-memory sliding-window limiter. Good enough for this
// app's single-container deployment (see docker-compose.yml) — would need a
// shared store (e.g. Redis) if the app is ever scaled to multiple replicas.
const buckets = new Map<string, Bucket>();

/** Returns true if the request under `key` is allowed, false if rate-limited. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
