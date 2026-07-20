"use client";

import ImageCropperModal from "@/components/ui/ImageCropperModal";
import { useSipedigStore } from "@/store/useSipedigStore";
import { Profil } from "@/types";
import { Save, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  logo_url: null,
};

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function PengaturanPage() {
  const { profil, updateProfil, setProfil } = useSipedigStore();

  const [form, setForm] = useState<Profil>(profil ?? EMPTY_PROFIL);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profil) setForm(profil);
  }, [profil]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      Swal.fire({ icon: 'error', title: 'Format tidak didukung', text: 'Gunakan file JPG, PNG, atau WEBP.' });
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      Swal.fire({ icon: 'error', title: 'File terlalu besar', text: 'Ukuran logo maksimal 5MB.' });
      return;
    }
    setPendingLogoFile(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setPendingLogoFile(null);
    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append('file', blob, 'logo.png');
      const res = await fetch('/api/profil/logo', { method: 'POST', body });
      if (!res.ok) throw new Error('Upload gagal');
      const updated = await res.json();
      setProfil(updated);
      Swal.fire({ icon: 'success', title: 'Logo diperbarui', timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Logo sekolah gagal diunggah. Coba lagi.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus logo?',
      text: 'Logo sekolah akan dihapus dari kop surat.',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    setUploadingLogo(true);
    try {
      const res = await fetch('/api/profil/logo', { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus logo');
      const updated = await res.json();
      setProfil(updated);
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Logo sekolah gagal dihapus. Coba lagi.' });
    } finally {
      setUploadingLogo(false);
    }
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

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border-2 border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
          {form.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/${form.logo_url}`} alt="Logo sekolah" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] font-sans font-black text-center text-ink-soft leading-tight">LOGO<br />SEKOLAH</span>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink-soft">Logo Sekolah</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingLogo ? 'Mengunggah...' : form.logo_url ? 'Ganti Logo' : 'Unggah Logo'}
            </button>
            {form.logo_url && (
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={handleRemoveLogo}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-soft">JPG, PNG, atau WEBP. Maks 5MB. Bisa dipangkas setelah dipilih.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoPick}
            className="hidden"
          />
        </div>
      </div>

      {pendingLogoFile && (
        <ImageCropperModal
          file={pendingLogoFile}
          onCancel={() => setPendingLogoFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}

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
