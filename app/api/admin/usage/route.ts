import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type TimeseriesRow = {
  bucket: Date;
  tokens_in: bigint | null;
  tokens_out: bigint | null;
  cost_usd: number | null;
  request_count: bigint;
};

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') === 'all' ? 'all' : 'month';

  const startOfMonth = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const startOfDay = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const where = scope === 'month' ? { createdAt: { gte: startOfMonth } } : {};

  const [users, grouped, timeseriesRaw, todaySpend, monthSpend] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, username: true, name: true, monthlyQuota: true, aiEnabled: true },
      orderBy: { name: 'asc' },
    }),
    prisma.usageLog.groupBy({
      by: ['userId'],
      where,
      _count: { _all: true },
      _sum: { tokensIn: true, tokensOut: true, costUsd: true },
    }),
    // Grouped by day within the current month (scope=month) or by month
    // across all history (scope=all) — Prisma's groupBy can't truncate a
    // DateTime column, so this needs a raw query.
    scope === 'month'
      ? prisma.$queryRaw<TimeseriesRow[]>`
          SELECT date_trunc('day', "createdAt") as bucket,
                 SUM("tokensIn")::bigint as tokens_in,
                 SUM("tokensOut")::bigint as tokens_out,
                 SUM("costUsd") as cost_usd,
                 COUNT(*)::bigint as request_count
          FROM "UsageLog"
          WHERE "createdAt" >= ${startOfMonth}
          GROUP BY bucket
          ORDER BY bucket ASC
        `
      : prisma.$queryRaw<TimeseriesRow[]>`
          SELECT date_trunc('month', "createdAt") as bucket,
                 SUM("tokensIn")::bigint as tokens_in,
                 SUM("tokensOut")::bigint as tokens_out,
                 SUM("costUsd") as cost_usd,
                 COUNT(*)::bigint as request_count
          FROM "UsageLog"
          GROUP BY bucket
          ORDER BY bucket ASC
        `,
    // Dihitung independen dari `scope` yang dipilih user, supaya banner
    // alert biaya tetap akurat walau tab "Semua Waktu" yang lagi aktif.
    prisma.usageLog.aggregate({ where: { createdAt: { gte: startOfDay } }, _sum: { costUsd: true } }),
    prisma.usageLog.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { costUsd: true } }),
  ]);

  const usageByUserId = new Map(grouped.map((g) => [g.userId, g]));

  const result = users.map((u) => {
    const usage = usageByUserId.get(u.id);
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      monthlyQuota: u.monthlyQuota,
      aiEnabled: u.aiEnabled,
      requestCount: usage?._count._all ?? 0,
      tokensIn: usage?._sum.tokensIn ?? 0,
      tokensOut: usage?._sum.tokensOut ?? 0,
      costUsd: usage?._sum.costUsd ?? 0,
    };
  });

  // bigint isn't JSON-serializable — convert to number (safe: token/request
  // counts per bucket never approach Number.MAX_SAFE_INTEGER in practice).
  const timeseries = timeseriesRaw.map((row) => ({
    bucket: row.bucket.toISOString(),
    tokensIn: Number(row.tokens_in ?? 0),
    tokensOut: Number(row.tokens_out ?? 0),
    costUsd: row.cost_usd ?? 0,
    requestCount: Number(row.request_count),
  }));

  return NextResponse.json({
    scope,
    users: result,
    timeseries,
    todaySpendUsd: todaySpend._sum.costUsd ?? 0,
    thisMonthSpendUsd: monthSpend._sum.costUsd ?? 0,
  });
}
