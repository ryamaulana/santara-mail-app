import { NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function removeOldLogo(logoUrl: string | null | undefined) {
  if (!logoUrl || !logoUrl.startsWith('uploads/')) return;
  try {
    await unlink(path.join(process.cwd(), 'public', logoUrl));
  } catch {
    // best-effort cleanup; ignore if already gone
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
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }

    const ext = MIME_EXT[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Format file harus JPG/PNG/WEBP' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    const existing = await prisma.profil.findUnique({ where: { id: 1 } });

    const filename = `logo-${crypto.randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));

    const logo_url = `uploads/${filename}`;
    const profil = await prisma.profil.upsert({
      where: { id: 1 },
      update: { logo_url },
      create: { id: 1, logo_url },
    });

    await removeOldLogo(existing?.logo_url);

    return NextResponse.json(profil);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existing = await prisma.profil.findUnique({ where: { id: 1 } });
    const profil = await prisma.profil.upsert({
      where: { id: 1 },
      update: { logo_url: null },
      create: { id: 1, logo_url: null },
    });

    await removeOldLogo(existing?.logo_url);

    return NextResponse.json(profil);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
