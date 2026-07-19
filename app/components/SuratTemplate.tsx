import { Profil } from '@/types';

export type PaperSizeKey = 'A4' | 'Letter' | 'F4';

export const PAPER_SIZES: Record<PaperSizeKey, { width: string; height: string; label: string }> = {
  A4: { width: '210mm', height: '297mm', label: 'A4 (210 × 297 mm)' },
  Letter: { width: '216mm', height: '279mm', label: 'Letter (216 × 279 mm)' },
  F4: { width: '215mm', height: '330mm', label: 'F4 / Folio (215 × 330 mm)' },
};

export interface SuratTemplateData {
  jenisSurat: string;
  nomorSurat: string;
  tanggalFormatted: string;
  lampiran: string;
  hal: string;
  penerimaNama: string;
  penerimaJabatan: string;
  penerimaNip?: string;
  isiSurat: string;
  penutupSurat: string;
  ttdNama: string;
  ttdJabatan: string;
  ttdNip: string;
}

interface SuratTemplateProps {
  data: SuratTemplateData;
  profil: Profil | { nama_instansi: string; nama_dinas: string; alamat: string; telepon: string; email: string; kode_pos: string; website: string };
  paperSize: PaperSizeKey;
}

export default function SuratTemplate({ data, profil, paperSize }: SuratTemplateProps) {
  const dim = PAPER_SIZES[paperSize];

  return (
    <div
      style={{ maxWidth: dim.width, minHeight: dim.height }}
      className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 p-8 sm:p-12 mx-auto w-full min-w-[650px] lg:min-w-0 flex flex-col justify-between text-black font-serif print:shadow-none print:ring-0 print:p-0 print:my-0 transition-transform duration-500 hover:scale-[1.01] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)]"
    >
      {/* Ukuran kertas cetak mengikuti pilihan pengguna, override default @page di globals.css */}
      <style>{`@page { size: ${dim.width} ${dim.height}; margin: 0; }`}</style>

      <div>
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-5 gap-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 border-[3px] border-black rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] sm:text-xs font-sans font-black text-center">LOGO<br/>DAERAH</span>
          </div>
          <div className="text-center flex-1">
            <h2 className="text-sm sm:text-lg font-bold font-sans tracking-widest leading-tight uppercase text-gray-800">{profil.nama_instansi}</h2>
            <h1 className="text-base sm:text-2xl font-black font-sans tracking-tight leading-tight uppercase text-black mt-1">{profil.nama_dinas}</h1>
            <p className="text-[10px] sm:text-xs font-sans mt-2 leading-relaxed text-gray-700">
              {profil.alamat} <br />
              Telp: {profil.telepon} | Email: {profil.email} | Kode Pos: {profil.kode_pos}
            </p>
            <p className="text-[10px] sm:text-xs font-sans text-cyan-800 font-bold mt-1 tracking-wide">{profil.website}</p>
          </div>
        </div>

        {/* Naskah */}
        <div className="mt-8 sm:mt-10 space-y-8">
          <div className="text-center">
            <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest underline underline-offset-4">{data.jenisSurat}</h3>
            <p className="text-xs sm:text-sm font-sans mt-2">Nomor: <span className="font-medium">{data.nomorSurat}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm font-sans">
            <div className="space-y-1.5">
              <p><strong className="inline-block w-20">Lampiran</strong>: <span className="font-medium">{data.lampiran}</span></p>
              <p><strong className="inline-block w-20">Perihal</strong>: <span className="font-medium">{data.hal}</span></p>
            </div>
            <div className="text-right">
              <p>Jakarta, <span className="font-medium">{data.tanggalFormatted}</span></p>
            </div>
          </div>

          <div className="text-xs sm:text-sm font-sans space-y-1.5 pt-4">
            <p className="font-medium">Kepada Yth.</p>
            <p className="font-bold text-base">{data.penerimaNama}</p>
            <p className="italic text-gray-800">{data.penerimaJabatan}</p>
            {data.penerimaNip && (
              <p className="text-xs text-gray-700 font-mono mt-1">NIP. <span>{data.penerimaNip}</span></p>
            )}
            <p className="text-xs mt-2 font-medium">di Tempat</p>
          </div>

          <div className="text-sm sm:text-[15px] leading-loose text-justify indent-10 space-y-5">
            <p>{data.isiSurat}</p>
            {data.penutupSurat && <p className="indent-0">{data.penutupSurat}</p>}
          </div>
        </div>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-12 sm:mt-20 flex justify-end">
        <div className="w-64 sm:w-80 text-xs sm:text-sm text-center font-sans space-y-16 sm:space-y-24">
          <div>
            <p className="font-bold">{data.ttdJabatan}</p>
            <p className="text-[10px] sm:text-xs uppercase mt-1 text-gray-800 font-medium">{profil.nama_dinas}</p>
          </div>
          <div>
            <p className="font-black underline underline-offset-4 text-base">{data.ttdNama}</p>
            <p className="text-[10px] sm:text-xs text-gray-800 font-mono mt-1">NIP. <span>{data.ttdNip}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
