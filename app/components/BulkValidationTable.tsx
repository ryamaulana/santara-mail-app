import { useState, useEffect, useMemo } from 'react';
import { Download, Table as TableIcon, Save, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, FileText, LayoutList } from 'lucide-react';
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
  
  const [data, setData] = useState<ExtractedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
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

  // Check if a specific item has a duplicate number
  const isDuplicate = (item: ExtractedItem) => {
    if (!item.nomor_surat || item.nomor_surat === 'Tanpa Nomor') return false;
    if (item.jenis_surat === 'masuk') {
      return suratMasuk.some(s => s.no_surat === item.nomor_surat);
    } else {
      return suratKeluar.some(s => s.no_surat === item.nomor_surat);
    }
  };

  const hasDuplicates = useMemo(() => {
    return data.some(item => isDuplicate(item));
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

  const selectedItem = data[selectedIndex];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <LayoutList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Verifikasi Massal ({data.length} Surat)</h2>
            <p className="text-sm text-gray-500">Pilih surat di daftar sebelah kiri untuk memverifikasi dan mengedit data.</p>
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
        <div className="p-3 mx-6 mt-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 flex items-center gap-3 shrink-0">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm font-medium">Beberapa surat memiliki nomor yang sudah ada di database. Harap periksa tanda peringatan pada daftar.</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Master List */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-gray-100 bg-gray-50/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white shrink-0">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center justify-between">
              Daftar Surat
              <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs">{data.length} Item</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {data.map((item, index) => {
              const isSelected = selectedIndex === index;
              const hasWarning = isDuplicate(item);
              
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500' 
                      : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      item.jenis_surat === 'keluar' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.jenis_surat === 'keluar' ? 'Surat Keluar' : 'Surat Masuk'}
                    </span>
                    {hasWarning && (
                      <span title="Nomor surat duplikat">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      </span>
                    )}
                  </div>
                  
                  <h4 className={`font-semibold text-sm truncate mb-1 ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                    {item.nomor_surat || 'Tanpa Nomor'}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate mb-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.fileName || 'Data Manual'}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate">
                    <span className="font-medium">{item.jenis_surat === 'keluar' ? 'Tujuan: ' : 'Asal: '}</span>
                    {item.jenis_surat === 'keluar' ? (item.ditujukan_kepada || '-') : (item.pengirim || '-')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Detail Editor */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedItem ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  Detail Ekstraksi
                  <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {selectedIndex + 1} dari {data.length}
                  </span>
                </h3>
                {isDuplicate(selectedItem) && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Nomor Surat Duplikat</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Jenis Surat</label>
                  <div className="relative">
                    <select 
                      value={selectedItem.jenis_surat || 'masuk'} 
                      onChange={(e) => handleCellChange(selectedIndex, 'jenis_surat', e.target.value)}
                      className="w-full p-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="masuk">Surat Masuk</option>
                      <option value="keluar">Surat Keluar</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Sifat Surat</label>
                  <div className="relative">
                    <select 
                      value={selectedItem.sifat_surat || 'Biasa'} 
                      onChange={(e) => handleCellChange(selectedIndex, 'sifat_surat', e.target.value)}
                      className="w-full p-3 pr-10 text-sm font-medium bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Biasa">Biasa</option>
                      <option value="Penting">Penting</option>
                      <option value="Rahasia">Rahasia</option>
                      <option value="Segera">Segera</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    Nomor Surat
                    {isDuplicate(selectedItem) && <span className="text-xs text-orange-600 font-medium">Sudah ada di DB</span>}
                  </label>
                  <input 
                    type="text" 
                    value={selectedItem.nomor_surat || ''} 
                    onChange={(e) => handleCellChange(selectedIndex, 'nomor_surat', e.target.value)}
                    placeholder="Masukkan nomor surat"
                    className={`w-full p-3 text-sm text-gray-800 bg-gray-50 border focus:bg-white focus:ring-2 outline-none transition-all rounded-xl ${
                      isDuplicate(selectedItem) 
                        ? 'border-orange-300 focus:ring-orange-500 focus:border-transparent' 
                        : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tanggal Surat</label>
                  <input 
                    type="text" 
                    value={selectedItem.tanggal_surat || ''} 
                    onChange={(e) => handleCellChange(selectedIndex, 'tanggal_surat', e.target.value)}
                    placeholder="Contoh: 17 Juni 2019"
                    className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="text-sm font-semibold text-gray-700">Perihal</label>
                <textarea 
                  value={selectedItem.perihal || ''} 
                  onChange={(e) => handleCellChange(selectedIndex, 'perihal', e.target.value)}
                  rows={2}
                  placeholder="Perihal surat..."
                  className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="text-sm font-semibold text-gray-700">
                  {selectedItem.jenis_surat === 'keluar' ? 'Ditujukan Kepada' : 'Asal Surat (Pengirim)'}
                </label>
                <textarea 
                  value={selectedItem.jenis_surat === 'keluar' ? (selectedItem.ditujukan_kepada || '') : (selectedItem.pengirim || '')} 
                  onChange={(e) => handleCellChange(selectedIndex, selectedItem.jenis_surat === 'keluar' ? 'ditujukan_kepada' : 'pengirim', e.target.value)}
                  rows={2}
                  placeholder={selectedItem.jenis_surat === 'keluar' ? "Instansi tujuan..." : "Instansi asal..."}
                  className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              <div className="space-y-1.5 mb-8">
                <label className="text-sm font-semibold text-gray-700">Ringkasan</label>
                <textarea 
                  value={selectedItem.ringkasan || ''} 
                  onChange={(e) => handleCellChange(selectedIndex, 'ringkasan', e.target.value)}
                  rows={4}
                  placeholder="Ringkasan isi surat..."
                  className="w-full p-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selesai & Sebelumnya
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Tersimpan otomatis
                </div>
                <button
                  onClick={() => setSelectedIndex(Math.min(data.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === data.length - 1}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Selesai & Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <LayoutList className="w-16 h-16 mb-4 text-gray-200" />
              <p>Pilih surat dari daftar untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
