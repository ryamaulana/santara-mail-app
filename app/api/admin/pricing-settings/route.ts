import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getPricingSettings } from '@/lib/pricing';
import { logAdminAction } from '@/lib/auditLog';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getPricingSettings();
  return NextResponse.json(settings);
}

function parseNullableNonNegative(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value === 'number' && value >= 0) return { ok: true, value };
  return { ok: false };
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { groqInputPerMillion, groqOutputPerMillion, marginPercent } = body;

    if (
      typeof groqInputPerMillion !== 'number' || groqInputPerMillion < 0 ||
      typeof groqOutputPerMillion !== 'number' || groqOutputPerMillion < 0 ||
      typeof marginPercent !== 'number' || marginPercent < 0
    ) {
      return NextResponse.json({ error: 'groqInputPerMillion, groqOutputPerMillion, dan marginPercent harus angka >= 0' }, { status: 400 });
    }

    const dailySpendAlertUsd = parseNullableNonNegative(body.dailySpendAlertUsd);
    const monthlySpendAlertUsd = parseNullableNonNegative(body.monthlySpendAlertUsd);
    if (!dailySpendAlertUsd.ok || !monthlySpendAlertUsd.ok) {
      return NextResponse.json({ error: 'dailySpendAlertUsd dan monthlySpendAlertUsd harus angka >= 0, atau null untuk menonaktifkan alert' }, { status: 400 });
    }

    const before = await getPricingSettings();

    const data = {
      groqInputPerMillion,
      groqOutputPerMillion,
      marginPercent,
      dailySpendAlertUsd: dailySpendAlertUsd.value,
      monthlySpendAlertUsd: monthlySpendAlertUsd.value,
      updatedBy: currentUser.username,
    };

    const settings = await prisma.pricingSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    await logAdminAction({
      adminId: currentUser.id,
      action: 'pricing.update',
      targetType: 'PricingSettings',
      targetId: '1',
      details: {
        before: {
          groqInputPerMillion: before.groqInputPerMillion,
          groqOutputPerMillion: before.groqOutputPerMillion,
          marginPercent: before.marginPercent,
          dailySpendAlertUsd: before.dailySpendAlertUsd,
          monthlySpendAlertUsd: before.monthlySpendAlertUsd,
        },
        after: {
          groqInputPerMillion: settings.groqInputPerMillion,
          groqOutputPerMillion: settings.groqOutputPerMillion,
          marginPercent: settings.marginPercent,
          dailySpendAlertUsd: settings.dailySpendAlertUsd,
          monthlySpendAlertUsd: settings.monthlySpendAlertUsd,
        },
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
