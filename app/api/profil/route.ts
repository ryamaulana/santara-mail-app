import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profil = await prisma.profil.findUnique({ where: { id: 1 } });
  return NextResponse.json(profil);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = {
      nama_instansi: body.nama_instansi,
      nama_dinas: body.nama_dinas,
      alamat: body.alamat,
      telepon: body.telepon,
      email: body.email,
      kode_pos: body.kode_pos,
      website: body.website,
    };

    const profil = await prisma.profil.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json(profil);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
