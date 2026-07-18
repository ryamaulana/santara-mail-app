"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { AlertTriangle, Printer, Edit3, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Swal from "sweetalert2";

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

  const [form, setForm] = useState({
    jenisSurat: "Surat Tugas",
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:m-0 print:p-0">
      {/* Tips Cetak - Enterprise Styling */}
      <div className="bg-panel border border-panel-border text-panel-ink p-4 rounded-2xl text-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-panel-accent/20 rounded-lg">
            <AlertTriangle className="text-panel-accent shrink-0 w-4 h-4" />
          </div>
          <span className="leading-relaxed"><strong>Tips Cetak:</strong> Atur ukuran kertas ke <strong>A4</strong> dan matikan "Header dan Footer" di dialog cetak browser untuk lembar surat yang rapi.</span>
        </div>
        <button onClick={() => window.print()} className="w-full sm:w-auto bg-accent-600 hover:bg-accent-500 text-white font-bold px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-xs whitespace-nowrap">
          <Printer className="w-4 h-4" />
          <span>Cetak PDF</span>
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
              <div>
                <label className="block font-bold text-ink-soft mb-1.5 uppercase tracking-wide text-[10px]">Jenis Naskah Dinas</label>
                <select name="jenisSurat" value={form.jenisSurat} onChange={handleChange} className="w-full p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-colors font-medium">
                  <option value="Surat Tugas">Surat Tugas</option>
                  <option value="Surat Undangan">Surat Undangan</option>
                  <option value="Surat Keterangan">Surat Keterangan</option>
                </select>
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

        {/* Lembar A4 Preview Kanan */}
        <div className="lg:col-span-7 w-full overflow-x-auto pb-10 print:overflow-visible flex justify-center bg-background rounded-3xl p-6 sm:p-10 border border-border print:bg-transparent print:border-none print:p-0">
          <div className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/5 p-8 sm:p-12 mx-auto w-full min-w-[650px] lg:min-w-0 max-w-[210mm] min-h-[297mm] flex flex-col justify-between text-black font-serif print:shadow-none print:ring-0 print:p-0 print:my-0 transition-transform duration-500 hover:scale-[1.01] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)]">
            
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
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest underline underline-offset-4">{form.jenisSurat}</h3>
                  <p className="text-xs sm:text-sm font-sans mt-2">Nomor: <span className="font-medium">{form.nomorSurat}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm font-sans">
                  <div className="space-y-1.5">
                    <p><strong className="inline-block w-20">Lampiran</strong>: <span className="font-medium">{form.lampiran}</span></p>
                    <p><strong className="inline-block w-20">Perihal</strong>: <span className="font-medium">{form.hal}</span></p>
                  </div>
                  <div className="text-right">
                    <p>Jakarta, <span className="font-medium">{formattedDate}</span></p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-sans space-y-1.5 pt-4">
                  <p className="font-medium">Kepada Yth.</p>
                  <p className="font-bold text-base">{form.penerimaNama}</p>
                  <p className="italic text-gray-800">{form.penerimaJabatan}</p>
                  {form.penerimaNip && (
                    <p className="text-xs text-gray-700 font-mono mt-1">NIP. <span>{form.penerimaNip}</span></p>
                  )}
                  <p className="text-xs mt-2 font-medium">di Tempat</p>
                </div>

                <div className="text-sm sm:text-[15px] leading-loose text-justify indent-10 space-y-5">
                  <p>{form.isiSurat}</p>
                  <p className="indent-0">{form.penutupSurat}</p>
                </div>
              </div>
            </div>

            {/* Tanda Tangan */}
            <div className="mt-12 sm:mt-20 flex justify-end">
              <div className="w-64 sm:w-80 text-xs sm:text-sm text-center font-sans space-y-16 sm:space-y-24">
                <div>
                  <p className="font-bold">{form.ttdJabatan}</p>
                  <p className="text-[10px] sm:text-xs uppercase mt-1 text-gray-800 font-medium">{profil.nama_dinas}</p>
                </div>
                <div>
                  <p className="font-black underline underline-offset-4 text-base">{form.ttdNama}</p>
                  <p className="text-[10px] sm:text-xs text-gray-800 font-mono mt-1">NIP. <span>{form.ttdNip}</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
