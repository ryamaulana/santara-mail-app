"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { Lock, Save } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";

export default function PengaturanPage() {
  const { profil, setProfil } = useSipedigStore();
  const isAdmin = true; // Hardcoded mock admin

  const [form, setForm] = useState(profil);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfil(form);
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Konfigurasi Kop Surat berhasil disimpan!',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="max-w-2xl bg-white p-5 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-800 text-lg">Konfigurasi Kop Surat Dinas</h3>
        <p className="text-slate-400 text-xs">Atur data instansi pemerintah pusat/daerah untuk penyesuaian kop cetak otomatis.</p>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>Mode Terbatas:</strong> Anda masuk sebagai Viewer (Lihat Saja). Form pengaturan ini dalam keadaan terkunci.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Nama Instansi Tingkat Atas</label>
          <input 
            type="text" 
            name="nama_instansi"
            disabled={!isAdmin}
            value={form.nama_instansi}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Nama Dinas / Sektor Kerja</label>
          <input 
            type="text" 
            name="nama_dinas"
            disabled={!isAdmin}
            value={form.nama_dinas}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-600 mb-1">Alamat Kantor Lengkap</label>
          <input 
            type="text" 
            name="alamat"
            disabled={!isAdmin}
            value={form.alamat}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Nomor Telepon Sekolah</label>
          <input 
            type="text" 
            name="telepon"
            disabled={!isAdmin}
            value={form.telepon}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Email Resmi</label>
          <input 
            type="email" 
            name="email"
            disabled={!isAdmin}
            value={form.email}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Kode Pos</label>
          <input 
            type="text" 
            name="kode_pos"
            disabled={!isAdmin}
            value={form.kode_pos}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-600 mb-1">Website URL</label>
          <input 
            type="text" 
            name="website"
            disabled={!isAdmin}
            value={form.website}
            onChange={handleChange}
            className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
          />
        </div>

        <div className="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-end">
          {isAdmin ? (
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-md shadow-indigo-600/20">
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          ) : (
            <button type="button" disabled className="bg-slate-100 text-slate-400 text-sm font-semibold px-6 py-2.5 rounded-lg flex items-center space-x-2 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              <span>Simpan (Viewer)</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
