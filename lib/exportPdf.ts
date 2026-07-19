import { PaperSizeKey, SuratTemplateData } from '@/app/components/SuratTemplate';
import { Profil } from '@/types';

type ProfilLike = Profil | { nama_instansi: string; nama_dinas: string; alamat: string; telepon: string; email: string; kode_pos: string; website: string };

/**
 * Build a PDF with real (selectable/searchable) text, sized exactly to the
 * chosen paper size. We build it with @react-pdf/renderer instead of
 * rasterizing the on-screen DOM (html2canvas) — that approach produced an
 * image, not text, and broke on CSS it couldn't parse.
 */
export async function generateSuratPdfBlob(
  data: SuratTemplateData,
  profil: ProfilLike,
  paperSize: PaperSizeKey
): Promise<Blob> {
  const [{ pdf }, { default: SuratPdfDocument }, { createElement }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/lib/pdf/SuratPdfDocument'),
    import('react'),
  ]);

  // pdf() is typed to accept a <Document> element specifically; SuratPdfDocument
  // wraps one but TS can't see through the indirection.
  const element = createElement(SuratPdfDocument, { data, profil, paperSize }) as Parameters<typeof pdf>[0];
  return pdf(element).toBlob();
}

/**
 * Strip characters that are unsafe in a filename — notably "/", which letter
 * numbers like "B/103/SM.02.00/2019" often contain. Left unsanitized, a "/"
 * in a ZIP entry name is read as a directory separator, silently turning the
 * PDF into an empty nested folder instead of a file.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'surat';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportSuratToPdf(
  data: SuratTemplateData,
  profil: ProfilLike,
  paperSize: PaperSizeKey,
  filename: string
) {
  const blob = await generateSuratPdfBlob(data, profil, paperSize);
  downloadBlob(blob, sanitizeFilename(filename));
}

export interface BulkSuratPdfItem {
  data: SuratTemplateData;
  paperSize: PaperSizeKey;
  filename: string;
}

/** Generate one PDF per item and bundle them into a single ZIP download. */
export async function exportSuratListToZip(
  items: BulkSuratPdfItem[],
  profil: ProfilLike,
  zipFilename: string
) {
  const [{ default: JSZip }, blobs] = await Promise.all([
    import('jszip'),
    Promise.all(items.map((item) => generateSuratPdfBlob(item.data, profil, item.paperSize))),
  ]);

  const zip = new JSZip();
  const usedNames = new Set<string>();

  blobs.forEach((blob, index) => {
    let name = sanitizeFilename(items[index].filename);
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.');
      const base = dot === -1 ? name : name.slice(0, dot);
      const ext = dot === -1 ? '' : name.slice(dot);
      name = `${base}-${index + 1}${ext}`;
    }
    usedNames.add(name);
    zip.file(name, blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename);
}
