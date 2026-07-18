import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await prisma.suratMasuk.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Format dates to string to match existing frontend expectations if necessary
    const formattedData = data.map(d => ({
      ...d,
      tanggal_surat: d.tanggal_surat ? d.tanggal_surat.toISOString().split('T')[0] : '',
      tanggal_diterima: d.tanggal_diterima ? d.tanggal_diterima.toISOString().split('T')[0] : ''
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = await prisma.suratMasuk.create({
      data: {
        userId: user.id,
        no_surat: body.no_surat,
        asal_surat: body.asal_surat,
        perihal: body.perihal,
        tanggal_surat: body.tanggal_surat ? new Date(body.tanggal_surat) : null,
        tanggal_diterima: body.tanggal_diterima ? new Date(body.tanggal_diterima) : null,
        sifat: body.sifat,
        status: body.status || 'Baru',
        disposisi: body.disposisi || '',
        ringkasan: body.ringkasan || '',
        file_surat: body.file_surat || '',
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
