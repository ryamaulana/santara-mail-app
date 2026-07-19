import { useState, useEffect, useMemo } from 'react';
import { Download, Table as TableIcon, Save, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, FileText, LayoutList, MessageSquare, FileDown, Archive } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useSipedigStore } from '@/store/useSipedigStore';
import { useRouter } from 'next/navigation';
import SuratTemplate, { PAPER_SIZES, PaperSizeKey, SuratTemplateData } from '@/app/components/SuratTemplate';
import { exportSuratToPdf, exportSuratListToZip } from '@/lib/exportPdf';

const EMPTY_PROFIL = {
  nama_instansi: '',
  nama_dinas: '',
  alamat: '',
  telepon: '',
  email: '',
  kode_pos: '',
  website: '',
};

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
  // Konfigurasi draf surat balasan (editable per item)
  balasanNomor?: string;
  balasanPaperSize?: PaperSizeKey;
  balasanTtdNama?: string;
  balasanTtdJabatan?: string;
  balasanTtdNip?: string;
}

interface BulkValidationTableProps {
  initialData: ExtractedItem[];
}

export default function BulkValidationTable({ initialData }: BulkValidationTableProps) {
  const router = useRouter();
  const { addSuratMasuk, addSuratKeluar, suratMasuk, suratKeluar, profil: fetchedProfil } = useSipedigStore();
  const profil = fetchedProfil ?? EMPTY_PROFIL;

  const [data, setData] = useState<ExtractedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [balasanExpanded, setBalasanExpanded] = useState(false);

  useEffect(() => {
    setData(initialData.map(item => ({
      ...item,
      jenis_surat: 'masuk',
      balasanNomor: '-',
      balasanPaperSize: 'A4',
      balasanTtdNama: '',
      balasanTtdJabatan: '',
      balasanTtdNip: '',
    })));
  }, [initialData]);

  const buildBalasanData = (item: ExtractedItem): SuratTemplateData => ({
    jenisSurat: 'Surat Balasan',
    nomorSurat: item.balasanNomor || '-',
    tanggalFormatted: format(new Date(), 'd MMMM yyyy', { locale: localeId }),
    lampiran: '-',
    hal: `Balasan: ${item.perihal || 'Surat Diterima'}`,
    penerimaNama: item.pengirim || '-',
    penerimaJabatan: '',
    isiSurat: item.draf_balasan || 'Tidak ada saran balasan tersedia untuk surat ini.',
    penutupSurat: '',
    ttdNama: item.balasanTtdNama || '',
    ttdJabatan: item.balasanTtdJabatan || '',
    ttdNip: item.balasanTtdNip || '',
  });

  const handleDownloadItemPdf = async (index: number) => {
    if (exportingIndex !== null) return;
    setExportingIndex(index);
    try {
      const item = data[index];
      await exportSuratToPdf(
        buildBalasanData(item),
        profil,
        item.balasanPaperSize || 'A4',
        `Balasan-${item.nomor_surat || index + 1}.pdf`
      );
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal membuat PDF', text: 'Terjadi kesalahan saat membuat berkas PDF. Silakan coba lagi.' });
    } finally {
      setExportingIndex(null);
    }
  };

  const handleDownloadAllPdf = async () => {
    if (isBulkExporting || data.length === 0) return;
    setIsBulkExporting(true);
    try {
      const items = data.map((item, index) => ({
        data: buildBalasanData(item),
        paperSize: item.balasanPaperSize || 'A4',
        filename: `Balasan-${item.nomor_surat || index + 1}.pdf`,
      }));
      await exportSuratListToZip(items, profil, 'Draf-Balasan-Semua-Surat.zip');
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal membuat ZIP', text: 'Terjadi kesalahan saat membuat berkas ZIP. Silakan coba lagi.' });
    } finally {
      setIsBulkExporting(false);
    }
  };

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
        addSuratMasuk({
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
        addSuratKeluar({
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
    <div className="card rounded-3xl flex-1 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
            <LayoutList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Verifikasi Massal ({data.length} Surat)</h2>
            <p className="text-sm text-ink-soft">Pilih surat di daftar sebelah kiri untuk memverifikasi dan mengedit data.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToAgenda}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            Simpan Semua ke Agenda
          </button>
          <button
            onClick={exportToExcel}
            className="px-5 py-2.5 bg-success hover:opacity-90 text-white font-medium rounded-xl transition-colors shadow-md flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Ekspor ke Excel (XLSX)
          </button>
          <button
            onClick={handleDownloadAllPdf}
            disabled={isBulkExporting}
            className="px-5 py-2.5 bg-[#2D3192] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            {isBulkExporting ? 'Membuat ZIP...' : 'Unduh Semua Balasan (ZIP)'}
          </button>
        </div>
      </div>

      {hasDuplicates && (
        <div className="p-3 mx-6 mt-4 bg-warning-bg text-warning rounded-xl border border-warning/20 flex items-center gap-3 shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm font-medium">Beberapa surat memiliki nomor yang sudah ada di database. Harap periksa tanda peringatan pada daftar.</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Master List */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-border bg-background/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-surface shrink-0">
            <h3 className="font-semibold text-ink text-sm flex items-center justify-between">
              Daftar Surat
              <span className="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">{data.length} Item</span>
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
                      ? 'bg-primary-50 border-primary-200 shadow-sm ring-1 ring-primary-500'
                      : 'bg-surface border-border hover:border-primary-200 hover:bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      item.jenis_surat === 'keluar' ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'
                    }`}>
                      {item.jenis_surat === 'keluar' ? 'Surat Keluar' : 'Surat Masuk'}
                    </span>
                    {hasWarning && (
                      <span title="Nomor surat duplikat">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      </span>
                    )}
                  </div>

                  <h4 className={`font-semibold text-sm truncate mb-1 ${isSelected ? 'text-primary-700' : 'text-ink'}`}>
                    {item.nomor_surat || 'Tanpa Nomor'}
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs text-ink-soft truncate mb-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.fileName || 'Data Manual'}</span>
                  </div>

                  <div className="text-xs text-ink-soft truncate">
                    <span className="font-medium">{item.jenis_surat === 'keluar' ? 'Tujuan: ' : 'Asal: '}</span>
                    {item.jenis_surat === 'keluar' ? (item.ditujukan_kepada || '-') : (item.pengirim || '-')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Detail Editor */}
        <div className="flex-1 bg-surface overflow-y-auto">
          {selectedItem ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <h3 className="text-2xl font-bold text-ink flex items-center gap-3">
                  Detail Ekstraksi
                  <span className="text-sm font-medium bg-background text-ink-soft px-3 py-1 rounded-full">
                    {selectedIndex + 1} dari {data.length}
                  </span>
                </h3>
                {isDuplicate(selectedItem) && (
                  <div className="flex items-center gap-2 text-warning bg-warning-bg px-3 py-1.5 rounded-lg border border-warning/20">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Nomor Surat Duplikat</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink">Jenis Surat</label>
                  <div className="relative">
                    <select
                      value={selectedItem.jenis_surat || 'masuk'}
                      onChange={(e) => handleCellChange(selectedIndex, 'jenis_surat', e.target.value)}
                      className="w-full p-3 pr-10 text-sm font-medium bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="masuk">Surat Masuk</option>
                      <option value="keluar">Surat Keluar</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink">Sifat Surat</label>
                  <div className="relative">
                    <select
                      value={selectedItem.sifat_surat || 'Biasa'}
                      onChange={(e) => handleCellChange(selectedIndex, 'sifat_surat', e.target.value)}
                      className="w-full p-3 pr-10 text-sm font-medium bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Biasa">Biasa</option>
                      <option value="Penting">Penting</option>
                      <option value="Rahasia">Rahasia</option>
                      <option value="Segera">Segera</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink flex items-center justify-between">
                    Nomor Surat
                    {isDuplicate(selectedItem) && <span className="text-xs text-warning font-medium">Sudah ada di DB</span>}
                  </label>
                  <input
                    type="text"
                    value={selectedItem.nomor_surat || ''}
                    onChange={(e) => handleCellChange(selectedIndex, 'nomor_surat', e.target.value)}
                    placeholder="Masukkan nomor surat"
                    className={`w-full p-3 text-sm text-ink bg-background border focus:bg-surface focus:ring-2 outline-none transition-all rounded-xl ${
                      isDuplicate(selectedItem)
                        ? 'border-warning/40 focus:ring-warning focus:border-transparent'
                        : 'border-border focus:ring-primary-500 focus:border-transparent'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-ink">Tanggal Surat</label>
                  <input
                    type="text"
                    value={selectedItem.tanggal_surat || ''}
                    onChange={(e) => handleCellChange(selectedIndex, 'tanggal_surat', e.target.value)}
                    placeholder="Contoh: 17 Juni 2019"
                    className="w-full p-3 text-sm text-ink bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="text-sm font-semibold text-ink">Perihal</label>
                <textarea
                  value={selectedItem.perihal || ''}
                  onChange={(e) => handleCellChange(selectedIndex, 'perihal', e.target.value)}
                  rows={2}
                  placeholder="Perihal surat..."
                  className="w-full p-3 text-sm text-ink bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="text-sm font-semibold text-ink">
                  {selectedItem.jenis_surat === 'keluar' ? 'Ditujukan Kepada' : 'Asal Surat (Pengirim)'}
                </label>
                <textarea
                  value={selectedItem.jenis_surat === 'keluar' ? (selectedItem.ditujukan_kepada || '') : (selectedItem.pengirim || '')}
                  onChange={(e) => handleCellChange(selectedIndex, selectedItem.jenis_surat === 'keluar' ? 'ditujukan_kepada' : 'pengirim', e.target.value)}
                  rows={2}
                  placeholder={selectedItem.jenis_surat === 'keluar' ? "Instansi tujuan..." : "Instansi asal..."}
                  className="w-full p-3 text-sm text-ink bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              <div className="space-y-1.5 mb-8">
                <label className="text-sm font-semibold text-ink">Ringkasan</label>
                <textarea
                  value={selectedItem.ringkasan || ''}
                  onChange={(e) => handleCellChange(selectedIndex, 'ringkasan', e.target.value)}
                  rows={4}
                  placeholder="Ringkasan isi surat..."
                  className="w-full p-3 text-sm text-ink bg-background border border-border focus:bg-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent rounded-xl outline-none resize-y transition-all"
                />
              </div>

              {/* Draf Surat Balasan */}
              <div className="mb-8 border border-border rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBalasanExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-primary-50/50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    Draf Surat Balasan
                  </span>
                  <ChevronDown className={`w-4 h-4 text-ink-soft transition-transform ${balasanExpanded ? 'rotate-180' : ''}`} />
                </button>

                {balasanExpanded && (
                  <div className="p-4 border-t border-border space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink-soft mb-1">Nomor Balasan</label>
                        <input
                          type="text"
                          value={selectedItem.balasanNomor || ''}
                          onChange={(e) => handleCellChange(selectedIndex, 'balasanNomor', e.target.value)}
                          className="w-full p-2.5 text-sm text-ink bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-soft mb-1">Ukuran Kertas</label>
                        <select
                          value={selectedItem.balasanPaperSize || 'A4'}
                          onChange={(e) => handleCellChange(selectedIndex, 'balasanPaperSize', e.target.value)}
                          className="w-full p-2.5 text-sm text-ink bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        >
                          {(Object.keys(PAPER_SIZES) as PaperSizeKey[]).map((key) => (
                            <option key={key} value={key}>{PAPER_SIZES[key].label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink-soft mb-1">Nama Penandatangan</label>
                        <input
                          type="text"
                          placeholder="Nama pejabat TTD"
                          value={selectedItem.balasanTtdNama || ''}
                          onChange={(e) => handleCellChange(selectedIndex, 'balasanTtdNama', e.target.value)}
                          className="w-full p-2.5 text-sm text-ink bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-soft mb-1">Jabatan TTD</label>
                        <input
                          type="text"
                          placeholder="Jabatan pejabat TTD"
                          value={selectedItem.balasanTtdJabatan || ''}
                          onChange={(e) => handleCellChange(selectedIndex, 'balasanTtdJabatan', e.target.value)}
                          className="w-full p-2.5 text-sm text-ink bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-ink-soft mb-1">NIP Penandatangan</label>
                        <input
                          type="text"
                          placeholder="NIP (opsional)"
                          value={selectedItem.balasanTtdNip || ''}
                          onChange={(e) => handleCellChange(selectedIndex, 'balasanTtdNip', e.target.value)}
                          className="w-full p-2.5 text-sm text-ink bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadItemPdf(selectedIndex)}
                      disabled={exportingIndex !== null}
                      className="w-full py-2.5 bg-[#2D3192] hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      <FileDown className="w-4 h-4" />
                      {exportingIndex === selectedIndex ? 'Membuat PDF...' : 'Unduh PDF Balasan'}
                    </button>

                    <div className="w-full overflow-x-auto bg-background rounded-2xl border border-border p-4 flex justify-center">
                      <SuratTemplate
                        paperSize={selectedItem.balasanPaperSize || 'A4'}
                        profil={profil}
                        data={buildBalasanData(selectedItem)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="px-5 py-2.5 text-sm font-medium text-ink bg-surface border border-border rounded-xl hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selesai & Sebelumnya
                </button>
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Perubahan tersimpan di sesi ini — klik &quot;Simpan Semua ke Agenda&quot; untuk menyimpan permanen
                </div>
                <button
                  onClick={() => setSelectedIndex(Math.min(data.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === data.length - 1}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Selesai & Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ink-soft">
              <LayoutList className="w-16 h-16 mb-4 text-ink-soft/50" />
              <p>Pilih surat dari daftar untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
