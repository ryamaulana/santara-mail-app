import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateTempPassword } from '@/lib/generatePassword';
import { logAdminAction } from '@/lib/auditLog';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
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
    const { username, name, role } = await request.json();

    if (!username || !name) {
      return NextResponse.json(
        { error: 'Username dan nama wajib diisi' },
        { status: 400 }
      );
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER',
        mustChangePassword: true,
      },
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
    });

    await logAdminAction({
      adminId: currentUser.id,
      action: 'user.create',
      targetType: 'User',
      targetId: user.id,
      details: { username: user.username, role: user.role },
    });

    return NextResponse.json({ ...user, tempPassword }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
