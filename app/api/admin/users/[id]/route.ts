import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';

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
    const body = await request.json();

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const willDisable = body.isActive === false;
    const willDemote = body.role === 'USER' && target.role === 'SUPER_ADMIN';

    if (target.role === 'SUPER_ADMIN' && target.isActive && (willDisable || willDemote)) {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', isActive: true, id: { not: id } },
      });
      if (otherActiveAdmins === 0) {
        return NextResponse.json(
          { error: 'Tidak bisa menonaktifkan atau menurunkan role super admin terakhir' },
          { status: 400 }
        );
      }
    }

    const data: {
      isActive?: boolean;
      role?: 'USER' | 'SUPER_ADMIN';
      name?: string;
      passwordHash?: string;
    } = {};
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (body.role === 'USER' || body.role === 'SUPER_ADMIN') data.role = body.role;
    if (body.name) data.name = body.name;
    if (body.password) data.passwordHash = await hashPassword(body.password);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
