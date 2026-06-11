import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const data = await prisma.suratMasuk.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(data);
}
