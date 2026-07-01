'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import UploadForm from '@/app/components/UploadForm';
import VerificationPanel from '@/app/components/VerificationPanel';
import SuggestionPanel from '@/app/components/SuggestionPanel';
import BulkValidationTable from '@/app/components/BulkValidationTable';
import HistoryPage from '@/app/components/HistoryPage';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AIReaderPage() {
  const [appState, setAppState] = useState<'upload' | 'loading' | 'success' | 'history'>('upload');
  const [extractedDataList, setExtractedDataList] = useState<any[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Progress states
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  const processFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const fetchUrl = baseUrl.endsWith('/api') 
        ? `${baseUrl}/extract-surat` 
        : `${baseUrl}/api/extract-surat`;
        
      const response = await fetch(fetchUrl, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Terjadi kesalahan saat memproses gambar.');
      }
      return { 
        ...(data.parsed_data || {}), 
        fileName: data.file_url || file.name 
      };
    }
  });

  const handleBulkUpload = async (files: File[]) => {
    setAppState('loading');
    setErrorMsg(null);
    setTotalFiles(files.length);
    setProcessedCount(0);
    setExtractedDataList([]);

    // For single file preview
    if (files.length === 1) {
      setImagePreviewUrl(URL.createObjectURL(files[0]));
    } else {
      setImagePreviewUrl(null);
    }

    const results = [];
    
    for (const file of files) {
      try {
        const result = await processFileMutation.mutateAsync(file);
        results.push(result);
        setProcessedCount(prev => prev + 1);
      } catch (error: any) {
        setErrorMsg(`Gagal memproses file ${file.name}: ${error.message}`);
        setAppState('upload');
        return;
      }
    }

    setExtractedDataList(results);
    setAppState('success');
  };

  const resetToUpload = () => {
    setAppState('upload');
    setExtractedDataList([]);
    setImagePreviewUrl(null);
    setErrorMsg(null);
    setTotalFiles(0);
    setProcessedCount(0);
  };

  return (
    <div className="relative animate-in fade-in duration-500">
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-between shrink-0">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {appState === 'history' && <HistoryPage />}

      {appState === 'upload' && (
        <UploadForm 
          onFilesSelected={handleBulkUpload}
        />
      )}

      {appState === 'loading' && (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] max-w-2xl mx-auto w-full">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Memproses Dokumen...</h2>
          
          {totalFiles > 1 ? (
            <div className="w-full max-w-md mt-4">
              <div className="flex justify-between text-sm mb-2 text-slate-600 font-medium">
                <span>Memproses Surat ke-{processedCount + 1 > totalFiles ? totalFiles : processedCount + 1} dari {totalFiles}</span>
                <span>{Math.round((processedCount / totalFiles) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${(processedCount / totalFiles) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">AI sedang mengekstrak teks dan merangkum isi surat.</p>
          )}
        </div>
      )}

      {appState === 'success' && extractedDataList.length > 0 && (
        <div className="w-full flex flex-col">
          {/* Back Button and Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <button 
              onClick={resetToUpload}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Ulangi Analisis
            </button>

            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold text-xs tracking-wider border border-emerald-100 w-fit">
              <CheckCircle2 className="w-4 h-4" />
              BERHASIL DIEKSTRAK ({extractedDataList.length} DOKUMEN)
            </div>
          </div>

          {/* Main Panels */}
          {extractedDataList.length === 1 ? (
            <div className="flex flex-col xl:flex-row gap-6 items-start">
              <VerificationPanel data={extractedDataList[0]} onReset={resetToUpload} />
              <SuggestionPanel data={extractedDataList[0]} imagePreviewUrl={imagePreviewUrl} />
            </div>
          ) : (
            <BulkValidationTable initialData={extractedDataList} />
          )}
        </div>
      )}
    </div>
  );
}
