import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/auditLog';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

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
    const existing = await prisma.billingRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }

    const ext = MIME_EXT[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Format file harus JPG/PNG/WEBP/PDF' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

    const record = await prisma.billingRecord.update({
      where: { id },
      data: {
        buktiBayar: `uploads/${filename}`,
        buktiBayarUploadedAt: new Date(),
        buktiBayarUploadedBy: currentUser.username,
      },
    });

    await logAdminAction({
      adminId: currentUser.id,
      action: 'billing.upload_proof',
      targetType: 'BillingRecord',
      targetId: id,
      details: { userId: record.userId, fileName: filename },
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
