import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 jam — kurs tidak perlu detik-per-detik utk tampilan admin

// In-memory, per proses server — cukup utk single-instance deployment ini,
// tidak perlu Redis/DB utk sekadar cache kurs.
let cache: { usdToIdr: number; fetchedAt: number } | null = null;

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isFresh = cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (!isFresh) {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      const rate = data?.rates?.IDR;
      if (typeof rate === 'number' && rate > 0) {
        cache = { usdToIdr: rate, fetchedAt: Date.now() };
      }
    } catch (error) {
      // Fetch gagal (mis. offline) — kalau ada cache lama, tetap dipakai
      // (stale-serve) daripada halaman admin gagal total.
      console.error('Gagal mengambil kurs USD/IDR:', error);
    }
  }

  if (!cache) {
    return NextResponse.json({ error: 'Kurs USD/IDR tidak tersedia' }, { status: 502 });
  }

  return NextResponse.json({ usdToIdr: cache.usdToIdr, fetchedAt: new Date(cache.fetchedAt).toISOString() });
}
