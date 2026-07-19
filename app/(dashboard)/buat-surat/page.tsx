"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { AlertTriangle, Printer, Edit3, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Swal from "sweetalert2";
import SuratTemplate, { PAPER_SIZES, PaperSizeKey } from "@/app/components/SuratTemplate";
import { exportSuratToPdf } from "@/lib/exportPdf";

const EMPTY_PROFIL = {
  nama_instansi: '',
  nama_dinas: '',
  alamat: '',
  telepon: '',
  email: '',
  kode_pos: '',
  website: '',
};

export default function BuatSuratPage() {
  const { profil: fetchedProfil, addSuratKeluar } = useSipedigStore();
  const profil = fetchedProfil ?? EMPTY_PROFIL;
  const [isExporting, setIsExporting] = useState(false);

  const [form, setForm] = useState({
    jenisSurat: "Surat Tugas",
    ukuranKertas: "A4" as PaperSizeKey,
    nomorSurat: "094/   /DKIS/2026",
    tanggalSurat: "2026-05-20",
    lampiran: "-",
    hal: "Pelaksanaan Tugas Pendampingan Teknis",
    penerimaNama: "Rian Apriansyah, M.T",
    penerimaJabatan: "Analis Sistem Informasi",
    penerimaNip: "19890412 201503 1 002",
    isiSurat: "Untuk melaksanakan tugas pendampingan teknis implementasi Sistem Keamanan Informasi dan Audit Aplikasi di Lingkungan Walikota Jakarta Utara, yang akan dilaksanakan pada tanggal 26 - 28 Mei 2026 berlokasi di Kantor Walikota Jakarta Utara.",
    penutupSurat: "Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya setelah selesai melaksanakan tugas tersebut.",
    ttdNama: "Sriyono, M.Pd., M.Si., M.A",
    ttdJabatan: "Jakarta, .......................................",
    ttdNip: "197102012008011018",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpanDraf = () => {
    addSuratKeluar({
      no_surat: form.nomorSurat,
      tujuan: form.penerimaNama,
      perihal: `${form.jenisSurat}: ${form.hal}`,
      tanggal_surat: form.tanggalSurat,
      sifat: 'Biasa',
      status: 'Draf',
      pembuat: 'Generator Otomatis',
      isi_ringkas: form.isiSurat,
      file_surat: ''
    });
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Draf berhasil disimpan ke Log Surat Keluar!',
      timer: 2000,
      showConfirmButton: false,
      confirmButtonColor: '#0891b2'
    });
  };

  // Format tanggal untuk preview
  const formattedDate = form.tanggalSurat ? format(new Date(form.tanggalSurat), 'd MMMM yyyy', { locale: localeId }) : '';

  const suratData = {
    jenisSurat: form.jenisSurat,
    nomorSurat: form.nomorSurat,
    tanggalFormatted: formattedDate,
    lampiran: form.lampiran,
    hal: form.hal,
    penerimaNama: form.penerimaNama,
    penerimaJabatan: form.penerimaJabatan,
    penerimaNip: form.penerimaNip,
    isiSurat: form.isiSurat,
    penutupSurat: form.penutupSurat,
    ttdNama: form.ttdNama,
    ttdJabatan: form.ttdJabatan,
    ttdNip: form.ttdNip,
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportSuratToPdf(suratData, profil, form.ukuranKertas, `${form.jenisSurat}-${form.nomorSurat || 'draf'}.pdf`);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:m-0 print:p-0">
      {/* Tips Cetak - Enterprise Styling */}
      <div className="bg-panel border border-panel-border text-panel-ink p-4 rounded-2xl text-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-panel-accent/20 rounded-lg">
            <AlertTriangle className="text-panel-accent shrink-0 w-4 h-4" />
          </div>
          <span className="leading-relaxed"><strong>Info:</strong> Berkas PDF akan dibuat langsung sesuai ukuran <strong>{PAPER_SIZES[form.ukuranKertas].label}</strong> yang dipilih di form, tanpa perlu mengatur ulang dialog cetak browser.</span>
        </div>
        <button onClick={handleDownloadPdf} disabled={isExporting} className="w-full sm:w-auto bg-accent-600 hover:bg-accent-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-xs whitespace-nowrap">
          <Printer className="w-4 h-4" />
          <span>{isExporting ? 'Membuat PDF...' : 'Unduh PDF'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start print:grid-cols-1 print:gap-0 relative">

        {/* Form Kiri */}
        <div className="lg:col-span-5 bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-6 print:hidden z-10 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center space-x-3 border-b border-border pb-4">
            <div className="p-2 bg-accent-50 rounded-lg">
              <Edit3 className="text-accent-600 w-5 h-5" />
            </div>
            <h4 className="font-bold text-ink text-base">Konfigurator Lembar Surat</h4>
          </div>

          <div className="space-y-5 text-xs">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Jenis Naskah Dinas</label>
                  <select name="jenisSurat" value={form.jenisSurat} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium">
                    <option value="Surat Tugas">Surat Tugas</option>
                    <option value="Surat Undangan">Surat Undangan</option>
                    <option value="Surat Keterangan">Surat Keterangan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Ukuran Kertas</label>
                  <select name="ukuranKertas" value={form.ukuranKertas} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium">
                    {(Object.keys(PAPER_SIZES) as PaperSizeKey[]).map((key) => (
                      <option key={key} value={key}>{PAPER_SIZES[key].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Nomor Surat Resmi</label>
                  <input type="text" name="nomorSurat" value={form.nomorSurat} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Tanggal Surat</label>
                  <input type="date" name="tanggalSurat" value={form.tanggalSurat} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Lampiran</label>
                  <input type="text" name="lampiran" value={form.lampiran} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Hal / Perihal</label>
                  <input type="text" name="hal" value={form.hal} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h5 className="font-bold text-accent-700 text-sm flex items-center gap-2">
                <span className="w-1.5 h-4 bg-accent-500 rounded-full"></span>
                Penerima / Ditugaskan
              </h5>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Nama Lengkap & Gelar</label>
                  <input type="text" name="penerimaNama" value={form.penerimaNama} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Jabatan</label>
                    <input type="text" name="penerimaJabatan" value={form.penerimaJabatan} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                  </div>
                  <div>
                    <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">NIP (Opsional)</label>
                    <input type="text" name="penerimaNip" value={form.penerimaNip} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h5 className="font-bold text-accent-700 text-sm flex items-center gap-2">
                <span className="w-1.5 h-4 bg-accent-500 rounded-full"></span>
                Isi Lembar Utama
              </h5>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Deskripsi Surat / Konten Inti</label>
                  <textarea name="isiSurat" rows={5} value={form.isiSurat} onChange={handleChange} className="w-full p-3 bg-background border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium leading-relaxed"></textarea>
                </div>
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Teks Penutup</label>
                  <input type="text" name="penutupSurat" value={form.penutupSurat} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <h5 className="font-bold text-accent-700 text-sm flex items-center gap-2">
                <span className="w-1.5 h-4 bg-accent-500 rounded-full"></span>
                Penandatangan
              </h5>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Nama Pejabat TTD</label>
                  <input type="text" name="ttdNama" value={form.ttdNama} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Jabatan TTD</label>
                    <input type="text" name="ttdJabatan" value={form.ttdJabatan} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium" />
                  </div>
                  <div>
                    <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">NIP Pejabat</label>
                    <input type="text" name="ttdNip" value={form.ttdNip} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button onClick={handleSimpanDraf} className="w-full bg-accent-600 text-white hover:bg-accent-500 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg">
              <Download className="w-4 h-4" />
              <span>Simpan ke Log Surat Keluar</span>
            </button>
          </div>
        </div>

        {/* Lembar Surat Preview Kanan */}
        <div className="lg:col-span-7 w-full overflow-x-auto pb-10 print:overflow-visible flex justify-center bg-background rounded-3xl p-6 sm:p-10 border border-border print:bg-transparent print:border-none print:p-0">
          <SuratTemplate
            paperSize={form.ukuranKertas}
            profil={profil}
            data={suratData}
          />
        </div>

      </div>
    </div>
  );
}
