import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateTempPassword } from '@/lib/generatePassword';
import { logAdminAction } from '@/lib/auditLog';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
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

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    await logAdminAction({
      adminId: currentUser.id,
      action: 'user.reset_password',
      targetType: 'User',
      targetId: id,
      details: { targetUsername: target.username },
    });

    return NextResponse.json({ tempPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
