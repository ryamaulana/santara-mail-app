import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.suratKeluar.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Format dates to string
    const formattedData = data.map(d => ({
      ...d,
      tanggal_surat: d.tanggal_surat ? d.tanggal_surat.toISOString().split('T')[0] : '',
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await prisma.suratKeluar.create({
      data: {
        id: body.id,
        no_surat: body.no_surat || '',
        tujuan: body.tujuan || '',
        perihal: body.perihal || '',
        tanggal_surat: body.tanggal_surat ? new Date(body.tanggal_surat) : null,
        sifat: body.sifat || 'Biasa',
        status: body.status || 'Draf',
        pembuat: body.pembuat || '',
        isi_ringkas: body.isi_ringkas || '',
        file_surat: body.file_surat || '',
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
