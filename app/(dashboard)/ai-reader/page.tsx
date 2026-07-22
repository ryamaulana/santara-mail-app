'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import UploadForm from '@/app/components/UploadForm';
import VerificationPanel from '@/app/components/VerificationPanel';
import SuggestionPanel from '@/app/components/SuggestionPanel';
import BulkValidationTable from '@/app/components/BulkValidationTable';
import HistoryPage from '@/app/components/HistoryPage';
import { ArrowLeft, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';

type FailedItem = { label: string; message: string };

const BATCH_STORAGE_KEY = 'sipedig_batch_progress';

type StoredBatch = { batchId: string; total: number };
type ResumePrompt = { batchId: string; total: number; completed: number };

export default function AIReaderPage() {
  const [appState, setAppState] = useState<'upload' | 'loading' | 'success' | 'history'>('upload');
  const [extractedDataList, setExtractedDataList] = useState<any[]>([]);
  const [failedItems, setFailedItems] = useState<FailedItem[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Progress states
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [liveSuccessCount, setLiveSuccessCount] = useState(0);
  const [liveFailCount, setLiveFailCount] = useState(0);

  // Resume-batch state: batch yang masih tercatat di localStorage saat halaman dibuka lagi
  const [resumePrompt, setResumePrompt] = useState<ResumePrompt | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return;

    let stored: StoredBatch;
    try {
      stored = JSON.parse(raw);
    } catch {
      localStorage.removeItem(BATCH_STORAGE_KEY);
      return;
    }

    fetch(`/api/ai/batch-status/${stored.batchId}`)
      .then(async (res) => {
        if (!res.ok) {
          // Batch sudah tidak dikenal server (mis. server sempat restart) — tidak ada yang bisa dilanjutkan.
          localStorage.removeItem(BATCH_STORAGE_KEY);
          return;
        }
        const data = await res.json();
        setResumePrompt({ batchId: stored.batchId, total: data.total, completed: data.completed });
      })
      .catch(() => {
        // Server sedang tidak terjangkau — biarkan catatan batch, coba lagi lain kali.
      });
  }, []);

  const processFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/extract-surat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Terjadi kesalahan saat memproses gambar.');
      }
      return {
        ...(data.parsed_data || {}),
        fileName: data.file_url || file.name
      };
    }
  });

  const splitResults = (results: any[]) => {
    const successes = results
      .filter((r) => r.status === 'success' && r.parsed_data)
      .map((r) => ({
        ...(r.parsed_data || {}),
        // Untuk PDF, simpan referensi ke berkas PDF aslinya (bukan halaman
        // pertama saja) supaya nanti bisa diunduh utuh dari Surat Masuk.
        fileName: r.original_file_url || r.file_url || r.file,
        pageUrls: r.page_urls && r.page_urls.length > 0 ? r.page_urls : (r.file_url ? [r.file_url] : []),
      }));

    const attention = results
      .filter((r) => r.status === 'error' || (r.status === 'success' && !r.parsed_data))
      .map((r, i) => ({
        label: `Berkas ke-${i + 1}`,
        message: r.message || 'Tidak ada teks yang terdeteksi pada berkas ini.',
      }));

    return { successes, attention };
  };

  const pollBatchStatus = async (batchId: string): Promise<any> => {
    while (true) {
      const res = await fetch(`/api/ai/batch-status/${batchId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Gagal mengambil status pemrosesan batch.');
      }

      setTotalFiles(data.total);
      setProcessedCount(data.completed);

      const { successes, attention } = splitResults(data.results || []);
      setLiveSuccessCount(successes.length);
      setLiveFailCount(attention.length);

      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  };

  const runBatchPolling = async (batchId: string) => {
    try {
      const finalStatus = await pollBatchStatus(batchId);
      // Sampai di status akhir (completed/failed) — catatan resume tidak diperlukan lagi.
      localStorage.removeItem(BATCH_STORAGE_KEY);

      if (finalStatus.status === 'failed') {
        throw new Error(finalStatus.error || 'Pemrosesan batch gagal di server.');
      }

      const { successes, attention } = splitResults(finalStatus.results || []);
      setExtractedDataList(successes);
      setFailedItems(attention);
      // Untuk hasil tunggal (termasuk PDF multi-halaman), tampilkan semua
      // halaman yang disimpan server (bukan cuma halaman pertama).
      setImagePreviewUrls(
        successes.length === 1 ? (successes[0].pageUrls || []).map((key: string) => `/api/documents/${key}`) : []
      );

      if (successes.length === 0) {
        setErrorMsg(`Semua ${finalStatus.total} berkas gagal diproses. Periksa berkas Anda dan coba lagi.`);
        setAppState('upload');
        return;
      }

      setAppState('success');
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat memproses batch.');
      setAppState('upload');
    }
  };

  const handleBulkUpload = async (files: File[]) => {
    setAppState('loading');
    setErrorMsg(null);
    setExtractedDataList([]);
    setFailedItems([]);
    setTotalFiles(files.length);
    setProcessedCount(0);
    setLiveSuccessCount(0);
    setLiveFailCount(0);

    const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Single file keeps the direct, simple path — no batch machinery needed.
    // PDF selalu lewat jalur batch karena /extract-surat hanya menerima gambar
    // (PDF perlu dipecah per halaman dulu, itu terjadi di endpoint batch).
    if (files.length === 1 && !isPdf(files[0])) {
      setImagePreviewUrls([URL.createObjectURL(files[0])]);
      try {
        const result = await processFileMutation.mutateAsync(files[0]);
        setExtractedDataList([result]);
        setProcessedCount(1);
        setAppState('success');
      } catch (error: any) {
        setErrorMsg(`Gagal memproses file ${files[0].name}: ${error.message}`);
        setAppState('upload');
      }
      return;
    }

    setImagePreviewUrls([]);

    let batchId: string;
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const uploadRes = await fetch('/api/ai/batch-extract', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || uploadData.detail || 'Gagal mengunggah berkas untuk diproses.');
      }
      batchId = uploadData.batch_id;
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat mengunggah batch.');
      setAppState('upload');
      return;
    }

    localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify({ batchId, total: files.length }));
    await runBatchPolling(batchId);
  };

  const handleResumeAccept = async () => {
    if (!resumePrompt) return;
    const { batchId, total } = resumePrompt;
    setResumePrompt(null);
    setAppState('loading');
    setErrorMsg(null);
    setExtractedDataList([]);
    setFailedItems([]);
    setImagePreviewUrls([]);
    setTotalFiles(total);
    setProcessedCount(0);
    setLiveSuccessCount(0);
    setLiveFailCount(0);
    await runBatchPolling(batchId);
  };

  const handleResumeDiscard = () => {
    localStorage.removeItem(BATCH_STORAGE_KEY);
    setResumePrompt(null);
  };

  const resetToUpload = () => {
    setAppState('upload');
    setExtractedDataList([]);
    setFailedItems([]);
    setImagePreviewUrls([]);
    setErrorMsg(null);
    setTotalFiles(0);
    setProcessedCount(0);
    setLiveSuccessCount(0);
    setLiveFailCount(0);
  };

  return (
    <div className="relative animate-in fade-in duration-500">
      {errorMsg && (
        <div className="mb-6 p-4 bg-danger-bg text-danger rounded-xl border border-danger/20 flex items-center justify-between shrink-0">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-danger/70 hover:text-danger">×</button>
        </div>
      )}

      {appState === 'history' && <HistoryPage />}

      {appState === 'upload' && resumePrompt && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink">Ada proses pembacaan surat yang terputus</p>
              <p className="text-sm text-ink-soft">
                {resumePrompt.completed} dari {resumePrompt.total} surat sudah selesai dibaca. Lanjutkan sisanya?
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleResumeDiscard}
              className="px-4 py-2 rounded-lg border border-border text-ink-soft hover:bg-border/30 font-medium text-sm transition-colors"
            >
              Buang
            </button>
            <button
              onClick={handleResumeAccept}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {appState === 'upload' && (
        <UploadForm
          onFilesSelected={handleBulkUpload}
        />
      )}

      {appState === 'loading' && (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] max-w-2xl mx-auto w-full">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-ink mb-2">Memproses Dokumen...</h2>

          {totalFiles > 1 ? (
            <div className="w-full max-w-md mt-4">
              <div className="flex justify-between text-sm mb-2 text-ink-soft font-medium">
                <span>Memproses {processedCount} dari {totalFiles}</span>
                <span>{Math.round((processedCount / totalFiles) * 100)}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(processedCount / totalFiles) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs font-semibold">
                <span className="text-success">{liveSuccessCount} berhasil</span>
                {liveFailCount > 0 && <span className="text-warning">{liveFailCount} perlu perhatian</span>}
              </div>
            </div>
          ) : (
            <p className="text-ink-soft">AI sedang mengekstrak teks dan merangkum isi surat.</p>
          )}
        </div>
      )}

      {appState === 'success' && extractedDataList.length > 0 && (
        <div className="w-full flex flex-col">
          {/* Back Button and Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <button
              onClick={resetToUpload}
              className="flex items-center gap-2 text-ink-soft hover:text-primary-600 font-medium transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Ulangi Analisis
            </button>

            <div className="flex items-center gap-2 bg-success-bg text-success px-4 py-2 rounded-full font-bold text-xs tracking-wider border border-success/20 w-fit">
              <CheckCircle2 className="w-4 h-4" />
              BERHASIL DIEKSTRAK ({extractedDataList.length} DOKUMEN)
            </div>
          </div>

          {failedItems.length > 0 && (
            <div className="mb-6 p-4 bg-warning-bg border border-warning/20 rounded-xl">
              <div className="flex items-center gap-2 text-warning font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                {failedItems.length} berkas tidak berhasil diproses
              </div>
              <ul className="space-y-1 text-xs text-warning/90 max-h-40 overflow-y-auto">
                {failedItems.map((f, i) => (
                  <li key={i}>{f.label}: {f.message}</li>
                ))}
              </ul>
              <p className="text-xs text-ink-soft mt-2">
                {extractedDataList.length} berkas yang berhasil tetap bisa Anda simpan di bawah ini. Untuk berkas yang gagal, silakan pilih dan unggah ulang berkas tersebut secara terpisah.
              </p>
            </div>
          )}

          {/* Main Panels */}
          {extractedDataList.length === 1 ? (
            <div className="flex flex-col xl:flex-row gap-6 items-start">
              <VerificationPanel data={extractedDataList[0]} onReset={resetToUpload} />
              <SuggestionPanel data={extractedDataList[0]} imagePreviewUrls={imagePreviewUrls} />
            </div>
          ) : (
            <BulkValidationTable initialData={extractedDataList} />
          )}
        </div>
      )}
    </div>
  );
}
