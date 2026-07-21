import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getFastApiBase, getFastApiHeaders } from '@/lib/aiProxy';

/**
 * Satu-satunya jalan untuk melihat/mengunduh dokumen surat. Dokumen fisik
 * disimpan di luar folder public (lihat DOCUMENTS_DIR di santara-mail-api),
 * jadi route inilah yang menegakkan otorisasi sebelum meneruskan permintaan
 * ke FastAPI. Kepemilikan dokumen sengaja dicek lewat kecocokan {userId} di
 * path (document key selalu "{ownerUserId}/{filename}") — tidak perlu query
 * DB tambahan karena key itu sendiri sudah membawa identitas pemiliknya.
 */
export async function GET(request: Request, props: { params: Promise<{ userId: string; filename: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, filename } = await props.params;
  if (userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const fastApiRes = await fetch(`${getFastApiBase()}/files/${userId}/${filename}`, {
    headers: getFastApiHeaders(),
  });

  if (!fastApiRes.ok || !fastApiRes.body) {
    return NextResponse.json({ error: 'Berkas tidak ditemukan.' }, { status: fastApiRes.status || 404 });
  }

  return new NextResponse(fastApiRes.body, {
    status: 200,
    headers: {
      'Content-Type': fastApiRes.headers.get('Content-Type') || 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  });
}
