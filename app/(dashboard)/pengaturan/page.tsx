"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { Profil } from "@/types";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const EMPTY_PROFIL: Profil = {
  id: 1,
  nama_instansi: '',
  nama_dinas: '',
  alamat: '',
  telepon: '',
  email: '',
  kode_pos: '',
  website: '',
};

export default function PengaturanPage() {
  const { profil, updateProfil } = useSipedigStore();

  const [form, setForm] = useState<Profil>(profil ?? EMPTY_PROFIL);

  useEffect(() => {
    if (profil) setForm(profil);
  }, [profil]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfil(form);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Konfigurasi Kop Surat berhasil disimpan!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Konfigurasi Kop Surat gagal disimpan. Coba lagi.',
      });
    }
  };

  return (
    <div className="max-w-2xl bg-surface p-5 sm:p-8 rounded-xl border border-border shadow-sm space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-border pb-4">
        <h3 className="font-bold text-ink text-lg">Konfigurasi Kop Surat Dinas</h3>
        <p className="text-ink-soft text-xs">Atur data instansi pemerintah pusat/daerah untuk penyesuaian kop cetak otomatis.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Nama Instansi Tingkat Atas</label>
          <input
            type="text"
            name="nama_instansi"
            value={form.nama_instansi}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Nama Dinas / Sektor Kerja</label>
          <input
            type="text"
            name="nama_dinas"
            value={form.nama_dinas}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-ink-soft mb-1">Alamat Kantor Lengkap</label>
          <input
            type="text"
            name="alamat"
            value={form.alamat}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Nomor Telepon Sekolah</label>
          <input
            type="text"
            name="telepon"
            value={form.telepon}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Email Resmi</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Kode Pos</label>
          <input
            type="text"
            name="kode_pos"
            value={form.kode_pos}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold text-ink-soft mb-1">Website URL</label>
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full p-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        <div className="sm:col-span-2 pt-4 border-t border-border flex justify-end">
          <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg flex items-center space-x-2 transition shadow-md">
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
