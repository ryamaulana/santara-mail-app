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
      const nextId = suratMasuk.length > 0 ? `SM-${String(suratMasuk.length + 1).padStart(3, '0')}` : 'SM-001';
      addSuratMasuk({
        id: nextId,
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
        showConfirmButton: false
      });
      router.push('/surat-masuk');
    } else {
      const nextId = suratKeluar.length > 0 ? `SK-${String(suratKeluar.length + 1).padStart(3, '0')}` : 'SK-001';
      addSuratKeluar({
        id: nextId,
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
        showConfirmButton: false
      });
      router.push('/surat-keluar');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex-1">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Verifikasi Data Surat</h2>
          <p className="text-sm text-gray-500">Pastikan data di bawah ini sudah sesuai dengan isi surat asli</p>
        </div>
      </div>

      {isDuplicate && (
        <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-800 text-sm">Peringatan: Duplikasi Nomor Surat</h4>
            <p className="text-xs mt-1">Surat dengan nomor <strong>{formData.nomor_surat}</strong> sudah ada di dalam database {formData.jenis_surat === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}. Apakah Anda yakin ingin menyimpan data yang sama?</p>
          </div>
        </div>
      )}

      <div className="mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 relative">
        <label className="block text-xs font-semibold text-indigo-900 mb-2 uppercase tracking-wide">PILIH JENIS SURAT UNTUK DISIMPAN</label>
        <div className="relative">
          <select 
            name="jenis_surat"
            value={formData.jenis_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-10 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-indigo-900 font-bold appearance-none cursor-pointer shadow-sm"
          >
            <option value="masuk">📥 Surat Masuk (Agenda Baru)</option>
            <option value="keluar">📤 Surat Keluar (Registrasi Baru)</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide"># NOMOR SURAT</label>
          <input 
            type="text" 
            name="nomor_surat"
            value={formData.nomor_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">TANGGAL SURAT</label>
          <input 
            type="text" 
            name="tanggal_surat"
            value={formData.tanggal_surat}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium" 
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">PERIHAL / SUBJEK</label>
          <input 
            type="text" 
            name="perihal"
            value={formData.perihal}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">PENGIRIM</label>
          <input 
            type="text" 
            name="pengirim"
            value={formData.pengirim}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">DITUJUKAN KEPADA</label>
          <input 
            type="text" 
            name="ditujukan_kepada"
            value={formData.ditujukan_kepada}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium" 
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">SIFAT SURAT</label>
          <div className="relative">
            <select 
              name="sifat_surat"
              value={formData.sifat_surat}
              onChange={handleChange}
              className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium appearance-none cursor-pointer" 
            >
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
              <option value="Rahasia">Rahasia</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">RINGKASAN ISI</label>
          <textarea 
            name="ringkasan"
            value={formData.ringkasan}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 resize-none font-medium leading-relaxed" 
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
        <button 
          onClick={onReset}
          className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button 
          onClick={handleSaveToAgenda}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Simpan ke Agenda
        </button>
      </div>
    </div>
  );
}
