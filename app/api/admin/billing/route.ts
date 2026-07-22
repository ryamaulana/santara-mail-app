import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { applyMargin, getPricingSettings } from '@/lib/pricing';

function currentPeriod() {
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return { periodStart, periodEnd };
}

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/**
 * Bulan-bulan yang periodenya sudah lewat akan dibuatkan/disinkronkan jadi
 * BillingRecord final di sini secara otomatis — tidak ada tombol manual
 * untuk ini. Record yang BELUM lunas selalu dihitung ulang dari total
 * UsageLog bulan itu (jaga-jaga kalau ada sisa pemakaian yang masuk setelah
 * bulan itu "ditutup" pertama kali, atau record lama dari sebelum fitur ini
 * ada) — record yang SUDAH lunas tidak pernah disentuh lagi (bukti bayar
 * final, harus dikoreksi manual dulu kalau memang salah).
 *
 * Bulan yang sedang berjalan sengaja TIDAK disentuh sama sekali di sini
 * (loop berhenti sebelum mencapainya) — itu murni estimasi live yang
 * dihitung ulang tiap request, lihat pemanggil di bawah. Final baru muncul
 * begitu tanggalnya sudah lewat bulan tersebut.
 */
async function finalizePastMonths(userId: string, currentPeriodStart: Date) {
  const [firstLog, existing] = await Promise.all([
    prisma.usageLog.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.billingRecord.findMany({ where: { userId }, select: { periodStart: true, isPaid: true } }),
  ]);
  if (!firstLog) return;

  const existingByStart = new Map(existing.map((r) => [r.periodStart.getTime(), r]));

  let cursor = new Date(firstLog.createdAt);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  if (cursor.getTime() >= currentPeriodStart.getTime()) return;

  const pricing = await getPricingSettings();

  while (cursor.getTime() < currentPeriodStart.getTime()) {
    const existingRecord = existingByStart.get(cursor.getTime());
    if (!existingRecord?.isPaid) {
      const periodEnd = addMonths(cursor, 1);
      const { _sum } = await prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: cursor, lt: periodEnd } },
        _sum: { costUsd: true },
      });
      const costUsd = _sum.costUsd ?? 0;
      if (costUsd > 0) {
        const amountUsd = applyMargin(costUsd, pricing.marginPercent);
        try {
          await prisma.billingRecord.upsert({
            where: { userId_periodStart: { userId, periodStart: new Date(cursor) } },
            update: { costUsd, marginPercent: pricing.marginPercent, amountUsd },
            create: { userId, periodStart: new Date(cursor), periodEnd, costUsd, marginPercent: pricing.marginPercent, amountUsd },
          });
        } catch (e: any) {
          if (e.code !== 'P2002') throw e; // sudah dibuat/diubah request lain yang bersamaan — aman diabaikan
        }
      }
    }
    cursor = addMonths(cursor, 1);
  }
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const { periodStart, periodEnd } = currentPeriod();
    await finalizePastMonths(userId, periodStart);

    const pricing = await getPricingSettings();
    const [liveCost, history] = await Promise.all([
      prisma.usageLog.aggregate({ where: { userId, createdAt: { gte: periodStart } }, _sum: { costUsd: true } }),
      // Bulan berjalan (kalau ada sisa record lama dari sebelum fitur ini
      // ada) sengaja tidak ikut ditampilkan di sini — itu representasinya
      // cuma lewat currentEstimate di atas, supaya tidak dobel.
      prisma.billingRecord.findMany({ where: { userId, periodStart: { lt: periodStart } }, orderBy: { periodStart: 'desc' } }),
    ]);
    const liveCostUsd = liveCost._sum.costUsd ?? 0;
    return NextResponse.json({
      userId,
      marginPercent: pricing.marginPercent,
      // Bulan berjalan: selalu dihitung live, tidak pernah disimpan sebagai
      // BillingRecord — ini yang ditampilkan sebagai "Estimasi".
      currentEstimate: {
        periodStart,
        periodEnd,
        costUsd: liveCostUsd,
        marginPercent: pricing.marginPercent,
        amountUsd: applyMargin(liveCostUsd, pricing.marginPercent),
      },
      history,
    });
  }

  const { periodStart, periodEnd } = currentPeriod();

  const [users, grouped, records, pricing] = await Promise.all([
    prisma.user.findMany({ where: { role: 'USER' }, select: { id: true, username: true, name: true } }),
    prisma.usageLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: periodStart, lt: periodEnd } },
      _sum: { costUsd: true },
    }),
    prisma.billingRecord.findMany({ where: { periodStart } }),
    getPricingSettings(),
  ]);

  const costByUserId = new Map(grouped.map((g) => [g.userId, g._sum.costUsd ?? 0]));
  const recordByUserId = new Map(records.map((r) => [r.userId, r]));

  const result = users.map((u) => {
    const liveCostUsd = costByUserId.get(u.id) ?? 0;
    const record = recordByUserId.get(u.id) ?? null;
    return {
      userId: u.id,
      username: u.username,
      name: u.name,
      liveCostUsd,
      liveAmountUsd: applyMargin(liveCostUsd, pricing.marginPercent),
      record,
    };
  });

  return NextResponse.json({ periodStart, periodEnd, marginPercent: pricing.marginPercent, users: result });
}
