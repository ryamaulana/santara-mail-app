import { useState, useEffect } from 'react';
import BulkValidationTable from './BulkValidationTable';
import { Database } from 'lucide-react';

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mailai_history');
    if (saved) {
      try {
        setHistoryData(JSON.parse(saved));
      } catch (e) {
        console.error('Gagal memuat riwayat', e);
      }
    }
  }, []);

  const handleClearHistory = () => {
    if (confirm('Anda yakin ingin menghapus semua riwayat?')) {
      localStorage.removeItem('mailai_history');
      setHistoryData([]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Riwayat Ekstraksi Surat</h2>
        </div>

        {historyData.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-danger hover:opacity-80 font-medium text-sm transition-colors"
          >
            Hapus Riwayat
          </button>
        )}
      </div>

      {historyData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center card rounded-3xl">
          <Database className="w-16 h-16 text-ink-soft/50 mb-4" />
          <p className="text-ink-soft font-medium text-lg">Belum ada riwayat surat yang disimpan.</p>
        </div>
      ) : (
        <BulkValidationTable initialData={historyData} />
      )}
    </div>
  );
}
