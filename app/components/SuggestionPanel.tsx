import { MessageSquare, Send, Copy } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface SuggestionPanelProps {
  data: any;
  imagePreviewUrl: string | null;
}

export default function SuggestionPanel({ data, imagePreviewUrl }: SuggestionPanelProps) {
  const handleCopy = () => {
    if (data?.draf_balasan) {
      navigator.clipboard.writeText(data.draf_balasan);
      Swal.fire({
        icon: 'success',
        title: 'Tersalin!',
        text: 'Draf balasan disalin ke clipboard!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  return (
    <div className="w-96 shrink-0 flex flex-col gap-6">
      {/* Saran Balasan Card */}
      <div className="bg-[#2D3192] rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-indigo-300" />
          <h3 className="font-bold text-lg">Saran Balasan</h3>
        </div>
        
        <div className="bg-white/10 rounded-2xl p-5 mb-5 border border-white/20">
          <p className="text-indigo-50 leading-relaxed italic text-sm">
            "{data?.draf_balasan || 'Tidak ada saran balasan tersedia untuk surat ini.'}"
          </p>
        </div>

        <button 
          onClick={handleCopy}
          className="w-full py-3 bg-white text-[#2D3192] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Send className="w-4 h-4" />
          Salin Draf Balasan
        </button>
      </div>

      {/* Referensi Dokumen Asli */}
      <div className="card rounded-3xl p-6 flex-1">
        <h3 className="text-xs font-bold text-ink-soft mb-4 uppercase tracking-wider text-center">Referensi Dokumen Asli</h3>
        <div className="w-full bg-background rounded-2xl border border-border overflow-hidden flex items-center justify-center min-h-[200px]">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Pratinjau Surat"
              className="w-full h-auto object-contain max-h-64"
            />
          ) : (
            <span className="text-ink-soft text-sm">Tidak ada gambar</span>
          )}
        </div>
      </div>
    </div>
  );
}
