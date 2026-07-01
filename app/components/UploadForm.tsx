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
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Unggah Surat Baru</h2>
        <p className="text-gray-500">Unggah satu atau banyak surat sekaligus untuk diekstrak secara massal oleh AI.</p>
      </div>

      <div 
        className={`w-full p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Klik untuk mengunggah atau drag & drop</h3>
        <p className="text-gray-500 text-sm mb-6">Mendukung format JPEG, PNG, WEBP (Bisa lebih dari 1 file sekaligus)</p>
        
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
          Pilih File Dokumen
        </button>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="image/jpeg, image/png, image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
