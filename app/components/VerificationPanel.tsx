import { FileText, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useSipedigStore } from '@/store/useSipedigStore';
import { useRouter } from 'next/navigation';

interface VerificationPanelProps {
  data: any;
  onReset: () => void;
}

export default function VerificationPanel({ data, onReset }: VerificationPanelProps) {
  const router = useRouter();
  const { addSuratMasuk, addSuratKeluar, suratMasuk, suratKeluar } = useSipedigStore();

  // Use state to allow editing
  const [formData, setFormData] = useState({
    jenis_surat: 'masuk', // default
    nomor_surat: data?.nomor_surat || 'Tanpa Nomor',
    tanggal_surat: data?.tanggal_surat || 'Tanpa Tanggal',
    perihal: data?.perihal || '',
    pengirim: data?.pengirim || '',
    ditujukan_kepada: data?.ditujukan_kepada || '',
    ringkasan: data?.ringkasan || '',
    sifat_surat: data?.sifat_surat || 'Biasa',
    draf_balasan: data?.draf_balasan || '',
    fileName: data?.fileName || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isDuplicate = useMemo(() => {
    if (formData.nomor_surat === 'Tanpa Nomor' || !formData.nomor_surat.trim()) return false;

    if (formData.jenis_surat === 'masuk') {
      return suratMasuk.some(s => s.no_surat === formData.nomor_surat);
    } else {
      return suratKeluar.some(s => s.no_surat === formData.nomor_surat);
    }
  }, [formData.nomor_surat, formData.jenis_surat, suratMasuk, suratKeluar]);

  const handleSaveToAgenda = () => {
    if (formData.jenis_surat === 'masuk') {
      addSuratMasuk({
        no_surat: formData.nomor_surat,
        asal_surat: formData.pengirim,
        perihal: formData.perihal,
        tanggal_surat: formData.tanggal_surat,
        tanggal_diterima: new Date().toISOString().split('T')[0],
        sifat: formData.sifat_surat,
        status: 'Baru',
        disposisi: '',
        ringkasan: formData.ringkasan,
        file_surat: formData.fileName,
      });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Surat berhasil ditambahkan ke Agenda Surat Masuk!',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#0f6e56'
      });
      router.push('/surat-masuk');
    } else {
      addSuratKeluar({
        no_surat: formData.nomor_surat,
        tujuan: formData.ditujukan_kepada,
        perihal: formData.perihal,
        tanggal_surat: formData.tanggal_surat,
        sifat: formData.sifat_surat,
        status: 'Draf',
        pembuat: 'AI Reader',
        isi_ringkas: formData.ringkasan,
        file_surat: formData.fileName,
      });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Surat berhasil ditambahkan ke Registrasi Surat Keluar!',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#0f6e56'
      });
      router.push('/surat-keluar');
    }
  };

  return (
    <div className="card rounded-3xl p-8 flex-1 relative overflow-hidden group">
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 border border-primary-100">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink">Verifikasi Data Surat</h2>
          <p className="text-sm text-ink-soft">Pastikan data di bawah ini sudah sesuai dengan dokumen asli</p>
        </div>
      </div>

      {isDuplicate && (
        <div className="mb-6 p-4 bg-warning-bg text-warning rounded-xl border border-warning/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Peringatan: Duplikasi Nomor Surat</h4>
            <p className="text-xs mt-1">Surat dengan nomor <strong>{formData.nomor_surat}</strong> sudah ada di dalam database {formData.jenis_surat === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}. Apakah Anda yakin ingin menyimpan data yang sama?</p>
          </div>
        </div>
      )}

      <div className="mb-6 bg-primary-50/50 p-5 rounded-2xl border border-primary-100 relative">
        <label className="block text-xs font-bold text-primary-700 mb-2 uppercase tracking-wider">Pilih Tujuan Simpan</label>
        <div className="relative">
          <select
            name="jenis_surat"
            value={formData.jenis_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-10 bg-surface border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-primary-700 font-bold appearance-none cursor-pointer shadow-sm hover:border-primary-300"
          >
            <option value="masuk">Surat Masuk (Agenda Baru)</option>
            <option value="keluar">Surat Keluar (Registrasi Baru)</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 relative z-10">
        <div>
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Nomor Surat</label>
          <input
            type="text"
            name="nomor_surat"
            value={formData.nomor_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium hover:bg-surface"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Tanggal Surat</label>
          <input
            type="text"
            name="tanggal_surat"
            value={formData.tanggal_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium hover:bg-surface"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Perihal / Subjek</label>
          <input
            type="text"
            name="perihal"
            value={formData.perihal}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium hover:bg-surface"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Pengirim</label>
          <input
            type="text"
            name="pengirim"
            value={formData.pengirim}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium hover:bg-surface"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Ditujukan Kepada</label>
          <input
            type="text"
            name="ditujukan_kepada"
            value={formData.ditujukan_kepada}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium hover:bg-surface"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Sifat Surat</label>
          <div className="relative">
            <select
              name="sifat_surat"
              value={formData.sifat_surat}
              onChange={handleChange}
              className="w-full px-4 py-3 pr-10 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink font-medium appearance-none cursor-pointer hover:bg-surface"
            >
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
              <option value="Rahasia">Rahasia</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft pointer-events-none" />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-bold text-ink-soft mb-2 uppercase tracking-wider">Ringkasan Isi</label>
          <textarea
            name="ringkasan"
            value={formData.ringkasan}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-ink resize-none font-medium leading-relaxed hover:bg-surface"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border relative z-10">
        <button
          onClick={onReset}
          className="px-6 py-2.5 text-ink-soft font-bold hover:bg-background hover:text-ink rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSaveToAgenda}
          className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Simpan ke Agenda
        </button>
      </div>
    </div>
  );
}
