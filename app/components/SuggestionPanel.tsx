'use client';

import { MessageSquare, Send, Copy, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useSipedigStore } from '@/store/useSipedigStore';
import SuratTemplate, { PAPER_SIZES, PaperSizeKey } from '@/app/components/SuratTemplate';
import { exportSuratToPdf } from '@/lib/exportPdf';

const EMPTY_PROFIL = {
  nama_instansi: '',
  nama_dinas: '',
  alamat: '',
  telepon: '',
  email: '',
  kode_pos: '',
  website: '',
};

interface SuggestionPanelProps {
  data: any;
  imagePreviewUrls: string[];
}

export default function SuggestionPanel({ data, imagePreviewUrls }: SuggestionPanelProps) {
  const { profil: fetchedProfil, addSuratKeluar } = useSipedigStore();
  const profil = fetchedProfil ?? EMPTY_PROFIL;

  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => setPageIndex(0), [imagePreviewUrls]);
  const currentPageUrl = imagePreviewUrls[Math.min(pageIndex, imagePreviewUrls.length - 1)] ?? null;

  const [nomorBalasan, setNomorBalasan] = useState('-');
  const [paperSize, setPaperSize] = useState<PaperSizeKey>('A4');
  const [ttdNama, setTtdNama] = useState('');
  const [ttdJabatan, setTtdJabatan] = useState('');
  const [ttdNip, setTtdNip] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date();
  const formattedDate = format(today, 'd MMMM yyyy', { locale: localeId });
  const hal = `Balasan: ${data?.perihal || 'Surat Diterima'}`;

  const suratData = {
    jenisSurat: 'Surat Balasan',
    nomorSurat: nomorBalasan,
    tanggalFormatted: formattedDate,
    lampiran: '-',
    hal,
    penerimaNama: data?.pengirim || '-',
    penerimaJabatan: '',
    isiSurat: data?.draf_balasan || 'Tidak ada saran balasan tersedia untuk surat ini.',
    penutupSurat: '',
    ttdNama,
    ttdJabatan,
    ttdNip,
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportSuratToPdf(suratData, profil, paperSize, `Surat-Balasan-${nomorBalasan || 'draf'}.pdf`);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal membuat PDF',
        text: 'Terjadi kesalahan saat membuat berkas PDF. Silakan coba lagi.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    if (data?.draf_balasan) {
      navigator.clipboard.writeText(data.draf_balasan);
      Swal.fire({
        icon: 'success',
        title: 'Tersalin!',
        text: 'Draf balasan disalin ke clipboard!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleSaveDraft = () => {
    addSuratKeluar({
      no_surat: nomorBalasan,
      tujuan: data?.pengirim || '-',
      perihal: hal,
      tanggal_surat: today.toISOString().split('T')[0],
      sifat: data?.sifat_surat || 'Biasa',
      status: 'Draf',
      pembuat: 'AI Reader',
      isi_ringkas: data?.draf_balasan || '',
      file_surat: '',
    });
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Draf balasan berhasil disimpan ke Log Surat Keluar!',
      timer: 2000,
      showConfirmButton: false,
      confirmButtonColor: '#0891b2'
    });
  };

  return (
    <div className="w-full xl:w-[520px] shrink-0 flex flex-col gap-6">
      {/* Konfigurator Balasan */}
      <div className="bg-[#2D3192] rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 print:hidden">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-indigo-300" />
          <h3 className="font-bold text-lg">Draf Surat Balasan</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-1">Nomor Balasan</label>
            <input
              type="text"
              value={nomorBalasan}
              onChange={(e) => setNomorBalasan(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-1">Ukuran Kertas</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSizeKey)}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {(Object.keys(PAPER_SIZES) as PaperSizeKey[]).map((key) => (
                <option key={key} value={key} className="text-ink">{PAPER_SIZES[key].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-1">Nama Penandatangan</label>
            <input
              type="text"
              placeholder="Nama pejabat TTD"
              value={ttdNama}
              onChange={(e) => setTtdNama(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-1">Jabatan TTD</label>
            <input
              type="text"
              placeholder="Jabatan pejabat TTD"
              value={ttdJabatan}
              onChange={(e) => setTtdJabatan(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wide text-indigo-200 mb-1">NIP Penandatangan</label>
            <input
              type="text"
              placeholder="NIP (opsional)"
              value={ttdNip}
              onChange={(e) => setTtdNip(e.target.value)}
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-sm font-mono placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="py-2.5 bg-white text-[#2D3192] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-xs"
          >
            <Send className="w-4 h-4" />
            {isExporting ? 'Membuat...' : 'Unduh PDF'}
          </button>
          <button
            onClick={handleCopy}
            className="py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors text-xs"
          >
            <Copy className="w-4 h-4" />
            Salin Draf
          </button>
          <button
            onClick={handleSaveDraft}
            className="py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors text-xs"
          >
            <Save className="w-4 h-4" />
            Simpan Draf
          </button>
        </div>
      </div>

      {/* Preview Surat Balasan */}
      <div className="w-full overflow-x-auto pb-4 print:overflow-visible flex justify-center bg-background rounded-3xl p-4 sm:p-6 border border-border print:bg-transparent print:border-none print:p-0">
        <SuratTemplate paperSize={paperSize} profil={profil} data={suratData} />
      </div>

      {/* Referensi Dokumen Asli */}
      <div className="card rounded-3xl p-6 print:hidden">
        <h3 className="text-xs font-bold text-ink-soft mb-4 uppercase tracking-wider text-center">Referensi Dokumen Asli</h3>
        <div className="w-full bg-background rounded-2xl border border-border overflow-hidden flex items-center justify-center min-h-[200px]">
          {currentPageUrl ? (
            <img
              src={currentPageUrl}
              alt={`Pratinjau Surat${imagePreviewUrls.length > 1 ? ` - Halaman ${pageIndex + 1}` : ''}`}
              className="w-full h-auto object-contain max-h-64"
            />
          ) : (
            <span className="text-ink-soft text-sm">Tidak ada gambar</span>
          )}
        </div>
        {imagePreviewUrls.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-lg border border-border text-ink-soft hover:bg-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-ink-soft">
              Halaman {pageIndex + 1} dari {imagePreviewUrls.length}
            </span>
            <button
              type="button"
              onClick={() => setPageIndex((i) => Math.min(imagePreviewUrls.length - 1, i + 1))}
              disabled={pageIndex === imagePreviewUrls.length - 1}
              className="p-1.5 rounded-lg border border-border text-ink-soft hover:bg-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
