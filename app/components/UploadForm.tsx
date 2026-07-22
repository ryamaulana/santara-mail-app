import { UploadCloud } from 'lucide-react';
import { useState, useRef } from 'react';

interface UploadFormProps {
  onFilesSelected: (files: File[]) => void;
}

export default function UploadForm({ onFilesSelected }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    onFilesSelected(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto w-full mt-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-ink mb-3">Unggah Surat Baru</h2>
        <p className="text-ink-soft">Unggah satu atau banyak surat sekaligus untuk diekstrak secara massal oleh AI.</p>
      </div>

      <div
        className={`w-full p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-border bg-surface hover:border-primary-300 hover:bg-background'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-primary-700" />
        </div>
        <h3 className="text-xl font-semibold text-ink mb-2">Klik untuk mengunggah atau drag & drop</h3>
        <p className="text-ink-soft text-sm mb-6">Mendukung format JPEG, PNG, WEBP, PDF (Bisa lebih dari 1 file sekaligus)</p>

        <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-500 transition-colors shadow-md">
          Pilih File Dokumen
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          accept="image/jpeg, image/png, image/webp, application/pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
