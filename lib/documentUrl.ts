/**
 * `file_surat` menyimpan dua kemungkinan format tergantung kapan surat itu
 * diunggah:
 * - Lama: path statis publik "/uploads/xxx.jpg" (sebelum dokumen dipindah
 *   keluar dari folder public Next.js) — tetap dilayani apa adanya.
 * - Baru: document key "{userId}/{filename}" tanpa slash di depan — harus
 *   lewat /api/documents/{key}, yang memverifikasi kepemilikan sebelum
 *   meneruskan ke FastAPI.
 */
export function resolveDocumentSrc(fileSurat: string): string {
  if (fileSurat.startsWith('http') || fileSurat.startsWith('/')) {
    return fileSurat;
  }
  return `/api/documents/${fileSurat}`;
}
