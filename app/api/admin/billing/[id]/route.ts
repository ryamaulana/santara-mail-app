import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLog';
import { applyMargin } from '@/lib/pricing';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json();

    if (typeof body.isPaid === 'boolean') {
      const record = await prisma.billingRecord.update({
        where: { id },
        data: body.isPaid
          ? { isPaid: true, paidAt: new Date(), markedBy: currentUser.username }
          : { isPaid: false, paidAt: null, markedBy: currentUser.username },
      });

      await logAdminAction({
        adminId: currentUser.id,
        action: body.isPaid ? 'billing.mark_paid' : 'billing.mark_unpaid',
        targetType: 'BillingRecord',
        targetId: id,
        details: { userId: record.userId, amountUsd: record.amountUsd },
      });

      return NextResponse.json(record);
    }

    if (typeof body.costUsd === 'number' && typeof body.marginPercent === 'number') {
      if (body.costUsd < 0 || body.marginPercent < 0) {
        return NextResponse.json({ error: 'Biaya dan margin harus angka >= 0' }, { status: 400 });
      }

      const existing = await prisma.billingRecord.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
      }
      // Tagihan yang sudah lunas adalah bukti transaksi final — tandai belum
      // lunas dulu kalau memang perlu dikoreksi.
      if (existing.isPaid) {
        return NextResponse.json(
          { error: 'Tagihan yang sudah lunas tidak bisa dikoreksi. Tandai belum lunas dulu, baru koreksi.' },
          { status: 409 }
        );
      }

      const amountUsd = applyMargin(body.costUsd, body.marginPercent);
      const record = await prisma.billingRecord.update({
        where: { id },
        data: { costUsd: body.costUsd, marginPercent: body.marginPercent, amountUsd },
      });

      await logAdminAction({
        adminId: currentUser.id,
        action: 'billing.correct',
        targetType: 'BillingRecord',
        targetId: id,
        details: {
          userId: record.userId,
          before: { costUsd: existing.costUsd, marginPercent: existing.marginPercent, amountUsd: existing.amountUsd },
          after: { costUsd: record.costUsd, marginPercent: record.marginPercent, amountUsd: record.amountUsd },
        },
      });

      return NextResponse.json(record);
    }

    return NextResponse.json({ error: 'Body harus berisi isPaid, atau costUsd dan marginPercent' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
