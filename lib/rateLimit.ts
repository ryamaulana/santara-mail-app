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
  // X-Real-IP diutamakan: Nginx nyetelnya langsung dari $remote_addr (koneksi
  // TCP asli), jadi klien TIDAK BISA memalsukannya sama sekali.
  //
  // X-Forwarded-For sengaja TIDAK dipakai lagi meski ada — nilainya dari
  // `$proxy_add_x_forwarded_for`, yang cuma MENAMBAHKAN IP asli ke belakang
  // header X-Forwarded-For yang mungkin sudah dikirim klien sendiri (bukan
  // menggantinya). Kalau kode ini ambil entri PERTAMA (dulu begitu), klien
  // bisa kirim `X-Forwarded-For: 1.2.3.4` sendiri dan rate limit ini akan
  // percaya "1.2.3.4" itu — melewati limit-nya sepenuhnya.
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
