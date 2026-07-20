import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { applyMargin, getPricingSettings } from '@/lib/pricing';

type TimeseriesRow = {
  bucket: Date;
  tokens_in: bigint | null;
  tokens_out: bigint | null;
  cost_usd: number | null;
  request_count: bigint;
};

type Granularity = 'day' | 'week' | 'month' | 'all';

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfDay();
  const dayIndex = (d.getDay() + 6) % 7; // Senin = 0 ... Minggu = 6
  d.setDate(d.getDate() - dayIndex);
  return d;
}

function startOfMonth() {
  const d = startOfDay();
  d.setDate(1);
  return d;
}

async function aggregateSince(userId: string, since: Date | null) {
  const where = since ? { userId, createdAt: { gte: since } } : { userId };
  const agg = await prisma.usageLog.aggregate({
    where,
    _count: { _all: true },
    _sum: { tokensIn: true, tokensOut: true, costUsd: true },
  });
  return {
    requestCount: agg._count._all,
    tokensIn: agg._sum.tokensIn ?? 0,
    tokensOut: agg._sum.tokensOut ?? 0,
    costUsd: agg._sum.costUsd ?? 0,
  };
}

export async function GET(request: Request, props: { params: Promise<{ userId: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await props.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, monthlyQuota: true, aiEnabled: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const granularityParam = searchParams.get('granularity');
  const granularity: Granularity =
    granularityParam === 'week' || granularityParam === 'month' || granularityParam === 'all'
      ? granularityParam
      : 'day';

  const [today, week, month, allTime, pricing] = await Promise.all([
    aggregateSince(userId, startOfDay()),
    aggregateSince(userId, startOfWeek()),
    aggregateSince(userId, startOfMonth()),
    aggregateSince(userId, null),
    getPricingSettings(),
  ]);

  // Rentang & bucket raw SQL per granularitas — date_trunc('week', ...) di
  // Postgres pakai standar ISO (Senin), konsisten dengan startOfWeek() di atas.
  let timeseriesRaw: TimeseriesRow[];
  if (granularity === 'day') {
    timeseriesRaw = await prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('day', "createdAt") as bucket,
             SUM("tokensIn")::bigint as tokens_in,
             SUM("tokensOut")::bigint as tokens_out,
             SUM("costUsd") as cost_usd,
             COUNT(*)::bigint as request_count
      FROM "UsageLog"
      WHERE "userId" = ${userId} AND "createdAt" >= ${startOfMonth()}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  } else if (granularity === 'week') {
    const since = new Date();
    since.setDate(since.getDate() - 84); // ~12 minggu terakhir
    timeseriesRaw = await prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('week', "createdAt") as bucket,
             SUM("tokensIn")::bigint as tokens_in,
             SUM("tokensOut")::bigint as tokens_out,
             SUM("costUsd") as cost_usd,
             COUNT(*)::bigint as request_count
      FROM "UsageLog"
      WHERE "userId" = ${userId} AND "createdAt" >= ${since}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  } else if (granularity === 'month') {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    timeseriesRaw = await prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('month', "createdAt") as bucket,
             SUM("tokensIn")::bigint as tokens_in,
             SUM("tokensOut")::bigint as tokens_out,
             SUM("costUsd") as cost_usd,
             COUNT(*)::bigint as request_count
      FROM "UsageLog"
      WHERE "userId" = ${userId} AND "createdAt" >= ${since}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  } else {
    timeseriesRaw = await prisma.$queryRaw<TimeseriesRow[]>`
      SELECT date_trunc('month', "createdAt") as bucket,
             SUM("tokensIn")::bigint as tokens_in,
             SUM("tokensOut")::bigint as tokens_out,
             SUM("costUsd") as cost_usd,
             COUNT(*)::bigint as request_count
      FROM "UsageLog"
      WHERE "userId" = ${userId}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  }

  const withAmount = <T extends { costUsd: number }>(stat: T) => ({
    ...stat,
    amountUsd: applyMargin(stat.costUsd, pricing.marginPercent),
  });

  // bigint isn't JSON-serializable — convert to number (safe: token/request
  // counts per bucket never approach Number.MAX_SAFE_INTEGER in practice).
  const timeseries = timeseriesRaw.map((row) => ({
    bucket: row.bucket.toISOString(),
    tokensIn: Number(row.tokens_in ?? 0),
    tokensOut: Number(row.tokens_out ?? 0),
    costUsd: row.cost_usd ?? 0,
    amountUsd: applyMargin(row.cost_usd ?? 0, pricing.marginPercent),
    requestCount: Number(row.request_count),
  }));

  return NextResponse.json({
    user,
    marginPercent: pricing.marginPercent,
    stats: {
      today: withAmount(today),
      week: withAmount(week),
      month: withAmount(month),
      allTime: withAmount(allTime),
    },
    granularity,
    timeseries,
  });
}
