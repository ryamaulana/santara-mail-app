import { useState, useEffect, useMemo } from 'react';
import { Download, Table as TableIcon, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useSipedigStore } from '@/store/useSipedigStore';
import { useRouter } from 'next/navigation';

interface ExtractedItem {
  jenis_surat?: string; // masuk | keluar
  nomor_surat: string;
  tanggal_surat: string;
  perihal: string;
  pengirim: string;
  ditujukan_kepada: string;
  sifat_surat: string;
  ringkasan: string;
  draf_balasan: string;
  fileName?: string;
  timestamp?: string;
}

interface BulkValidationTableProps {
  initialData: ExtractedItem[];
}

export default function BulkValidationTable({ initialData }: BulkValidationTableProps) {
  const router = useRouter();
  const { addSuratMasuk, addSuratKeluar, suratMasuk, suratKeluar } = useSipedigStore();
  
  // Set default jenis_surat = 'masuk'
  const [data, setData] = useState<ExtractedItem[]>([]);
  
  useEffect(() => {
    setData(initialData.map(item => ({ ...item, jenis_surat: 'masuk' })));
  }, [initialData]);

  const handleCellChange = (index: number, field: keyof ExtractedItem, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const handleSaveToAgenda = () => {
    let smCount = 0;
    let skCount = 0;

    data.forEach((item, index) => {
      if (item.jenis_surat === 'masuk') {
        const nextId = suratMasuk.length > 0 ? `SM-${String(suratMasuk.length + 1 + smCount).padStart(3, '0')}` : `SM-${String(smCount + 1).padStart(3, '0')}`;
        addSuratMasuk({
          id: nextId,
          no_surat: item.nomor_surat,
          asal_surat: item.pengirim,
          perihal: item.perihal,
          tanggal_surat: item.tanggal_surat,
          tanggal_diterima: new Date().toISOString().split('T')[0],
          sifat: item.sifat_surat || 'Biasa',
          status: 'Baru',
          disposisi: '',
          ringkasan: item.ringkasan,
          file_surat: item.fileName || '',
        });
        smCount++;
      } else {
        const nextId = suratKeluar.length > 0 ? `SK-${String(suratKeluar.length + 1 + skCount).padStart(3, '0')}` : `SK-${String(skCount + 1).padStart(3, '0')}`;
        addSuratKeluar({
          id: nextId,
          no_surat: item.nomor_surat,
          tujuan: item.ditujukan_kepada,
          perihal: item.perihal,
          tanggal_surat: item.tanggal_surat,
          sifat: item.sifat_surat || 'Biasa',
          status: 'Draf',
          pembuat: 'AI Reader',
          isi_ringkas: item.ringkasan,
          file_surat: item.fileName || '',
        });
        skCount++;
      }
    });
    
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: `Berhasil menyimpan: ${smCount} Surat Masuk & ${skCount} Surat Keluar!`,
      timer: 2500,
      showConfirmButton: false
    });
    router.push('/'); // kembali ke dashboard
  };

  const hasDuplicates = useMemo(() => {
    return data.some(item => {
      if (!item.nomor_surat || item.nomor_surat === 'Tanpa Nomor') return false;
      if (item.jenis_surat === 'masuk') {
        return suratMasuk.some(s => s.no_surat === item.nomor_surat);
      } else {
        return suratKeluar.some(s => s.no_surat === item.nomor_surat);
      }
    });
  }, [data, suratMasuk, suratKeluar]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
      'Nama File': item.fileName || '-',
      'Nomor Surat': item.nomor_surat,
      'Tanggal Surat': item.tanggal_surat,
      'Perihal': item.perihal,
      'Pengirim': item.pengirim,
      'Ditujukan Kepada': item.ditujukan_kepada,
      'Ringkasan': item.ringkasan,
      'Draf Balasan': item.draf_balasan
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Surat");
    XLSX.writeFile(wb, "Rekap_Surat_Masuk.xlsx");
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col h-[calc(100vh-200px)] overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TableIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Verifikasi Massal ({data.length} Surat)</h2>
            <p className="text-sm text-gray-500">Edit langsung pada tabel di bawah ini jika terdapat kesalahan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveToAgenda}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Save className="w-4 h-4" />
            Simpan Semua ke Agenda
          </button>
          <button 
            onClick={exportToExcel}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-green-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Ekspor ke Excel (XLSX)
          </button>
        </div>
      </div>

      {hasDuplicates && (
        <div className="p-4 mx-6 mt-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-800 text-sm">Peringatan: Duplikasi Nomor Surat Ditemukan</h4>
            <p className="text-xs mt-1">Beberapa surat dalam tabel ini memiliki nomor surat yang sudah ada di database. Harap periksa kembali sebelum menyimpan.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">Jenis Surat</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">Nomor Surat</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">Tanggal</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">Perihal</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">Asal / Tujuan</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">Sifat Surat</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 min-w-[300px]">Ringkasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-indigo-50/30 transition-colors">
                <td className="p-2">
                  <div className="relative inline-block w-full">
                    <select 
                      value={row.jenis_surat || 'masuk'} 
                      onChange={(e) => handleCellChange(index, 'jenis_surat', e.target.value)}
                      className="w-full p-2 pr-6 text-xs font-bold bg-indigo-50 text-indigo-700 border border-transparent focus:border-indigo-500 rounded-lg outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="masuk">Masuk</option>
                      <option value="keluar">Keluar</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" title={row.fileName}>{row.fileName || '-'}</div>
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={row.nomor_surat || ''} 
                    onChange={(e) => handleCellChange(index, 'nomor_surat', e.target.value)}
                    className="w-full p-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={row.tanggal_surat || ''} 
                    onChange={(e) => handleCellChange(index, 'tanggal_surat', e.target.value)}
                    className="w-full p-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={row.perihal || ''} 
                    onChange={(e) => handleCellChange(index, 'perihal', e.target.value)}
                    className="w-full p-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all"
                  />
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={row.jenis_surat === 'keluar' ? (row.ditujukan_kepada || '') : (row.pengirim || '')} 
                    onChange={(e) => handleCellChange(index, row.jenis_surat === 'keluar' ? 'ditujukan_kepada' : 'pengirim', e.target.value)}
                    placeholder={row.jenis_surat === 'keluar' ? "Tujuan" : "Asal Surat"}
                    className="w-full p-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded outline-none transition-all"
                  />
                </td>
                <td className="p-2">
                  <div className="relative inline-block w-full">
                    <select 
                      value={row.sifat_surat || 'Biasa'} 
                      onChange={(e) => handleCellChange(index, 'sifat_surat', e.target.value)}
                      className="w-full p-2 pr-6 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Biasa">Biasa</option>
                      <option value="Penting">Penting</option>
                      <option value="Rahasia">Rahasia</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </td>
                <td className="p-2">
                  <textarea 
                    value={row.ringkasan || ''} 
                    onChange={(e) => handleCellChange(index, 'ringkasan', e.target.value)}
                    rows={2}
                    className="w-full p-2 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:bg-white rounded outline-none resize-none transition-all"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
