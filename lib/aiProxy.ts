import 'server-only';
import prisma from '@/lib/prisma';

export function getFastApiBase() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

/** Shared secret sent to the FastAPI backend so it can reject calls that
 * didn't come from this app (see santara-mail-api/app/api/deps.py). */
export function getFastApiHeaders(): HeadersInit {
  const key = process.env.INTERNAL_API_KEY;
  return key ? { 'X-Internal-Api-Key': key } : {};
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  quota: number | null;
}

/** Gate on/off terpisah dari monthlyQuota — quota membatasi PEMAKAIAN setelah
 * diaktifkan, aiEnabled menentukan boleh pakai fitur AI Reader sama sekali atau tidak. */
export async function checkAiAccess(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { aiEnabled: true } });
  if (!user?.aiEnabled) {
    return { allowed: false, reason: 'Fitur AI Reader belum diaktifkan untuk akun Anda. Hubungi admin.' };
  }
  return { allowed: true };
}

/** Quota (kalau di-set admin) dihitung per bulan kalender berjalan, berdasarkan jumlah request AI Reader. */
export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyQuota: true } });
  const quota = user?.monthlyQuota ?? null;
  if (quota === null) {
    return { allowed: true, used: 0, quota: null };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const used = await prisma.usageLog.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  });

  return { allowed: used < quota, used, quota };
}

export function quotaExceededMessage(status: QuotaStatus) {
  return `Kuota AI Reader bulan ini sudah habis (${status.used}/${status.quota} request). Hubungi admin untuk menambah kuota.`;
}
