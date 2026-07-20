import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLog';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await props.params;

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'Tidak bisa melakukan aksi ini pada akun sendiri' }, { status: 403 });
    }

    const body = await request.json();

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const willDisable = body.isActive === false;

    if (target.role === 'SUPER_ADMIN' && target.isActive && willDisable) {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', isActive: true, id: { not: id } },
      });
      if (otherActiveAdmins === 0) {
        return NextResponse.json(
          { error: 'Tidak bisa menonaktifkan super admin terakhir' },
          { status: 400 }
        );
      }
    }

    const data: {
      isActive?: boolean;
      name?: string;
      passwordHash?: string;
      monthlyQuota?: number | null;
      aiEnabled?: boolean;
    } = {};
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (body.name) data.name = body.name;
    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 });
      }
      data.passwordHash = await hashPassword(body.password);
    }
    if (typeof body.aiEnabled === 'boolean') data.aiEnabled = body.aiEnabled;
    if ('monthlyQuota' in body) {
      if (body.monthlyQuota === null) {
        data.monthlyQuota = null;
      } else if (Number.isInteger(body.monthlyQuota) && body.monthlyQuota >= 0) {
        data.monthlyQuota = body.monthlyQuota;
      } else {
        return NextResponse.json({ error: 'monthlyQuota harus berupa bilangan bulat >= 0, atau null untuk tanpa batas' }, { status: 400 });
      }
    }

    const changes: Record<string, { before: unknown; after: unknown }> = {};
    if (data.isActive !== undefined && data.isActive !== target.isActive) changes.isActive = { before: target.isActive, after: data.isActive };
    if (data.name !== undefined && data.name !== target.name) changes.name = { before: target.name, after: data.name };
    if (data.passwordHash !== undefined) changes.password = { before: '(hidden)', after: '(changed)' };
    if (data.monthlyQuota !== undefined && data.monthlyQuota !== target.monthlyQuota) changes.monthlyQuota = { before: target.monthlyQuota, after: data.monthlyQuota };
    if (data.aiEnabled !== undefined && data.aiEnabled !== target.aiEnabled) changes.aiEnabled = { before: target.aiEnabled, after: data.aiEnabled };

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, isActive: true, monthlyQuota: true, aiEnabled: true, createdAt: true },
    });

    if (Object.keys(changes).length > 0) {
      await logAdminAction({
        adminId: currentUser.id,
        action: 'user.update',
        targetType: 'User',
        targetId: id,
        details: { targetUsername: target.username, changes },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
