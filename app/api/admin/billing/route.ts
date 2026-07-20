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
    const { periodStart } = currentPeriod();
    const pricing = await getPricingSettings();
    const [liveCost, currentPeriodRecord, history] = await Promise.all([
      prisma.usageLog.aggregate({ where: { userId, createdAt: { gte: periodStart } }, _sum: { costUsd: true } }),
      prisma.billingRecord.findUnique({ where: { userId_periodStart: { userId, periodStart } } }),
      prisma.billingRecord.findMany({ where: { userId }, orderBy: { periodStart: 'desc' } }),
    ]);
    const liveCostUsd = liveCost._sum.costUsd ?? 0;
    return NextResponse.json({
      userId,
      marginPercent: pricing.marginPercent,
      liveCostUsd,
      liveAmountUsd: applyMargin(liveCostUsd, pricing.marginPercent),
      currentPeriodRecord,
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

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = await request.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 });
    }

    const { periodStart, periodEnd } = currentPeriod();

    const existing = await prisma.billingRecord.findUnique({ where: { userId_periodStart: { userId, periodStart } } });
    if (existing?.isPaid) {
      return NextResponse.json({ error: 'Tagihan periode ini sudah ditandai lunas, tidak bisa dibuat ulang otomatis.' }, { status: 409 });
    }

    const [{ _sum }, pricing] = await Promise.all([
      prisma.usageLog.aggregate({
        where: { userId, createdAt: { gte: periodStart, lt: periodEnd } },
        _sum: { costUsd: true },
      }),
      getPricingSettings(),
    ]);

    const costUsd = _sum.costUsd ?? 0;
    const amountUsd = applyMargin(costUsd, pricing.marginPercent);

    const record = await prisma.billingRecord.upsert({
      where: { userId_periodStart: { userId, periodStart } },
      update: { costUsd, marginPercent: pricing.marginPercent, amountUsd },
      create: { userId, periodStart, periodEnd, costUsd, marginPercent: pricing.marginPercent, amountUsd },
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
