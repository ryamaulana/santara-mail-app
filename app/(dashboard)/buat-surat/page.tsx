"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { AlertTriangle, Printer, Edit3, Info, Download, Lock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Swal from "sweetalert2";

export default function BuatSuratPage() {
  const { profil, addSuratKeluar, suratKeluar } = useSipedigStore();
  const isAdmin = true;

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
    const nextId = suratKeluar.length > 0 ? `SK-${String(suratKeluar.length + 1).padStart(3, '0')}` : 'SK-001';
    addSuratKeluar({
      id: nextId,
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
      showConfirmButton: false
    });
  };

  // Format tanggal untuk preview
  const formattedDate = form.tanggalSurat ? format(new Date(form.tanggalSurat), 'd MMMM yyyy', { locale: localeId }) : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:m-0 print:p-0">
      {/* Tips Cetak */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-amber-600 shrink-0 w-4 h-4" />
          <span><strong>Tips Cetak:</strong> Atur ukuran kertas ke <strong>A4</strong> dan matikan "Header dan Footer" di dialog cetak browser untuk lembar surat yang rapi.</span>
        </div>
        <button onClick={() => window.print()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition text-xs">
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak / PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start print:grid-cols-1 print:gap-0">
        
        {/* Form Kiri */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 space-y-4 print:hidden">
          <h4 className="font-bold text-slate-800 border-b pb-3 text-sm flex items-center space-x-2">
            <Edit3 className="text-indigo-600 w-4 h-4" />
            <span>Konfigurator Lembar Surat</span>
          </h4>

          {!isAdmin && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start space-x-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>Anda dalam mode <strong>Lihat Saja (Viewer)</strong>. Anda dapat menguji konfigurator dan mencetak langsung, namun tidak dapat menyimpan draf ke database log.</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Jenis Naskah Dinas</label>
              <select name="jenisSurat" value={form.jenisSurat} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="Surat Tugas">Surat Tugas</option>
                <option value="Surat Undangan">Surat Undangan</option>
                <option value="Surat Keterangan">Surat Keterangan</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nomor Surat Resmi</label>
                <input type="text" name="nomorSurat" value={form.nomorSurat} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tanggal Surat</label>
                <input type="date" name="tanggalSurat" value={form.tanggalSurat} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Lampiran</label>
                <input type="text" name="lampiran" value={form.lampiran} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Hal / Perihal</label>
                <input type="text" name="hal" value={form.hal} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h5 className="font-bold text-indigo-600 mb-2">Penerima / Ditugaskan</h5>
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                  <input type="text" name="penerimaNama" value={form.penerimaNama} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Jabatan</label>
                    <input type="text" name="penerimaJabatan" value={form.penerimaJabatan} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">NIP (Opsional)</label>
                    <input type="text" name="penerimaNip" value={form.penerimaNip} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h5 className="font-bold text-indigo-600 mb-2">Isi Lembar Utama</h5>
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Deskripsi Surat / Konten Inti</label>
                  <textarea name="isiSurat" rows={4} value={form.isiSurat} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg resize-y"></textarea>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Teks Penutup</label>
                  <input type="text" name="penutupSurat" value={form.penutupSurat} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h5 className="font-bold text-indigo-600 mb-2">Penandatangan</h5>
              <div className="space-y-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nama Pejabat TTD</label>
                  <input type="text" name="ttdNama" value={form.ttdNama} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Jabatan TTD</label>
                    <input type="text" name="ttdJabatan" value={form.ttdJabatan} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">NIP Pejabat</label>
                    <input type="text" name="ttdNip" value={form.ttdNip} onChange={handleChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <button onClick={handleSimpanDraf} className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition mt-4">
              <Download className="w-3.5 h-3.5" />
              <span>Simpan ke Log Surat Keluar</span>
            </button>
          ) : (
            <button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 cursor-not-allowed mt-4">
              <Lock className="w-3.5 h-3.5" />
              <span>Simpan Dinonaktifkan (Viewer)</span>
            </button>
          )}
        </div>

        {/* Lembar A4 Preview Kanan */}
        <div className="lg:col-span-7 w-full overflow-x-auto pb-6 print:overflow-visible">
          <div className="bg-white shadow-2xl border border-slate-200 rounded-2xl p-6 sm:p-10 mx-auto w-full min-w-[650px] lg:min-w-0 max-w-[210mm] min-h-[297mm] flex flex-col justify-between text-black font-serif print:shadow-none print:border-none print:p-0 print:my-0">
            
            <div>
              {/* Kop Surat */}
              <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold text-center">LOGO DAERAH</span>
                </div>
                <div className="text-center flex-1">
                  <h2 className="text-sm sm:text-lg font-bold font-sans tracking-wide leading-tight uppercase">{profil.nama_instansi}</h2>
                  <h1 className="text-base sm:text-xl font-extrabold font-sans tracking-tight leading-tight uppercase">{profil.nama_dinas}</h1>
                  <p className="text-[10px] sm:text-xs font-sans mt-1 leading-normal">
                    {profil.alamat} <br />
                    Telp: {profil.telepon} | Email: {profil.email} | Kode Pos: {profil.kode_pos}
                  </p>
                  <p className="text-[10px] sm:text-xs font-sans text-indigo-700 underline">{profil.website}</p>
                </div>
              </div>

              {/* Naskah */}
              <div className="mt-6 sm:mt-8 space-y-6">
                <div className="text-center">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider underline">{form.jenisSurat}</h3>
                  <p className="text-xs sm:text-sm font-sans">Nomor: <span>{form.nomorSurat}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <p><strong>Lampiran :</strong> <span>{form.lampiran}</span></p>
                    <p><strong>Perihal &nbsp;&nbsp;&nbsp;:</strong> <span>{form.hal}</span></p>
                  </div>
                  <div className="text-right">
                    <p>Jakarta, <span>{formattedDate}</span></p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-sans space-y-1">
                  <p className="font-semibold">Kepada Yth.</p>
                  <p className="font-bold">{form.penerimaNama}</p>
                  <p className="italic">{form.penerimaJabatan}</p>
                  {form.penerimaNip && (
                    <p className="text-xs text-slate-600 font-mono">NIP. <span>{form.penerimaNip}</span></p>
                  )}
                  <p className="text-xs">di Tempat</p>
                </div>

                <div className="text-xs sm:text-sm leading-relaxed text-justify indent-8 space-y-4">
                  <p>{form.isiSurat}</p>
                  <p className="indent-0">{form.penutupSurat}</p>
                </div>
              </div>
            </div>

            {/* Tanda Tangan */}
            <div className="mt-8 sm:mt-12 flex justify-end">
              <div className="w-64 sm:w-72 text-xs sm:text-sm text-center font-sans space-y-12 sm:space-y-16">
                <div>
                  <p className="font-semibold">{form.ttdJabatan}</p>
                  <p className="text-[10px] sm:text-xs uppercase">{profil.nama_dinas}</p>
                </div>
                <div>
                  <p className="font-bold underline">{form.ttdNama}</p>
                  <p className="text-[10px] sm:text-xs text-slate-600">NIP. <span>{form.ttdNip}</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
