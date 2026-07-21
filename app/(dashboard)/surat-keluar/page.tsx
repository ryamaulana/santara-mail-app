"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Plus, FileText, Trash2, Paperclip, Edit3, Save, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { resolveDocumentSrc } from "@/lib/documentUrl";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function SuratKeluarPage() {
  const { suratKeluar, fetchSuratKeluar, addSuratKeluar, deleteSuratKeluar, updateStatusKeluar } = useSipedigStore();

  useEffect(() => {
    fetchSuratKeluar();
  }, [fetchSuratKeluar]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSifat, setFilterSifat] = useState("Semua");
  const router = useRouter();

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // New form state
  const [newForm, setNewForm] = useState({
    no_surat: "",
    tujuan: "",
    perihal: "",
    tanggal_surat: format(new Date(), "yyyy-MM-dd"),
    sifat: "Biasa",
    pembuat: "Staff",
    isi_ringkas: "",
  });

  // Detail/Update form state
  const [detailForm, setDetailForm] = useState({
    status: "Draf",
  });

  const filteredSurat = suratKeluar.filter(s => {
    const matchesSearch = s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.no_surat.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.tujuan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSifat = filterSifat === "Semua" || s.sifat === filterSifat;
    return matchesSearch && matchesSifat;
  });

  const getSifatColor = (sifat: string) => {
    if (sifat === 'Penting') return 'warning';
    return 'default';
  };

  const getStatusKeluarColor = (status: string) => {
    if (status === 'Dikirim') return 'success';
    if (status === 'Persetujuan') return 'warning';
    return 'default';
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Anda tidak dapat mengembalikan surat keluar ini!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d85a30',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteSuratKeluar(id);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Surat keluar telah dihapus.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const openNewModal = () => setIsNewModalOpen(true);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    addSuratKeluar({
      status: 'Draf',
      file_surat: '',
      ...newForm,
    });
    setIsNewModalOpen(false);
    setNewForm({
      no_surat: "", tujuan: "", perihal: "", tanggal_surat: format(new Date(), "yyyy-MM-dd"),
      sifat: "Biasa", pembuat: "Staff", isi_ringkas: ""
    });
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Registrasi surat keluar berhasil ditambahkan!',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const openDetailModal = (id: string) => {
    const s = suratKeluar.find((x) => x.id === id);
    if (s) {
      setSelectedSuratId(id);
      setDetailForm({ status: s.status });
      setIsDetailModalOpen(true);
    }
  };

  const handleUpdateDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuratId) {
      updateStatusKeluar(selectedSuratId, detailForm.status);
      setIsDetailModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Status alur kerja berhasil diperbarui!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const selectedSuratData = suratKeluar.find((x) => x.id === selectedSuratId);
  const selectedFileSrc = selectedSuratData?.file_surat ? resolveDocumentSrc(selectedSuratData.file_surat) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-ink-soft w-[18px] h-[18px]" />
            <input
              type="text"
              placeholder="Cari nomor, tujuan, atau hal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="flex items-center space-x-2 bg-background border border-border px-3 py-2 rounded-lg">
            <Filter className="text-ink-soft w-4 h-4" />
            <select
              value={filterSifat}
              onChange={(e) => setFilterSifat(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-ink-soft w-full"
            >
              <option value="Semua">Semua Sifat</option>
              <option value="Biasa">Biasa</option>
              <option value="Penting">Penting</option>
            </select>
          </div>
        </div>

        <button onClick={openNewModal} className="bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition">
          <Plus className="w-4 h-4" />
          <span>Registrasi Surat</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 bg-background border-b border-border flex justify-between items-center text-xs text-ink-soft font-medium">
          <span>Menampilkan {filteredSurat.length} surat (Total Terregistrasi: {suratKeluar.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">No. Registrasi</th>
                <th className="px-6 py-4">Sifat & Tanggal</th>
                <th className="px-6 py-4">Tujuan / Penerima</th>
                <th className="px-6 py-4">Perihal / No. Resmi</th>
                <th className="px-6 py-4">Status Alur Kerja</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredSurat.length === 0 ? (
                <tr key="empty-state">
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-soft">Tidak ada data surat keluar ditemukan.</td>
                </tr>
              ) : (
                filteredSurat.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="hover:bg-accent-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-ink">{row.id}</td>
                    <td className="px-6 py-4 space-y-1">
                      <Badge variant={getSifatColor(row.sifat) as any}>{row.sifat}</Badge>
                      <p className="text-xs text-ink-soft mt-1">{row.tanggal_surat}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink line-clamp-1">{row.tujuan}</p>
                      <p className="text-xs text-ink-soft">Pengonsep: {row.pembuat}</p>
                    </td>
                    <td className="px-6 py-4 flex items-center h-full">
                      <div className="truncate">
                        <p className="font-semibold text-ink line-clamp-1">{row.perihal}</p>
                        <p className="text-xs text-accent-700 font-mono">{row.no_surat || 'Belum Diberikan'}</p>
                      </div>
                      {row.file_surat && (
                        <span className="inline-flex items-center shrink-0 text-accent-700 bg-accent-50 px-1.5 py-0.5 rounded text-[9px] font-bold ml-2 border border-accent-100">
                          <Paperclip className="w-2.5 h-2.5 mr-0.5" /> Berkas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusKeluarColor(row.status) as any}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block opacity-75"></span>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {!row.file_surat && (row.status === 'Draf' || row.status === 'Persetujuan') && (
                          <button onClick={() => router.push('/buat-surat')} className="p-1.5 text-ink-soft hover:text-accent-700 hover:bg-accent-50 rounded" title="Edit di Generator">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openDetailModal(row.id)} className="p-1.5 text-ink-soft hover:text-accent-700 hover:bg-accent-50 rounded" title="Detail / Tindak Lanjut">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-ink-soft hover:text-danger hover:bg-danger-bg rounded" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTRASI SURAT BARU */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Registrasi Surat Keluar">
        <form onSubmit={handleSaveNew} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Nomor Surat Resmi</label>
              <input type="text" value={newForm.no_surat} onChange={e => setNewForm({...newForm, no_surat: e.target.value})} placeholder="Kosongi jika draf" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Sifat Surat</label>
              <select value={newForm.sifat} onChange={e => setNewForm({...newForm, sifat: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500">
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Tujuan / Nama Penerima</label>
            <input required type="text" value={newForm.tujuan} onChange={e => setNewForm({...newForm, tujuan: e.target.value})} placeholder="Nama Kantor atau Pejabat" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Perihal Surat</label>
            <input required type="text" value={newForm.perihal} onChange={e => setNewForm({...newForm, perihal: e.target.value})} placeholder="Subjek pokok surat" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Tanggal Surat Terbit</label>
              <input required type="date" value={newForm.tanggal_surat} onChange={e => setNewForm({...newForm, tanggal_surat: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Pembuat / Konseptor</label>
              <input required type="text" value={newForm.pembuat} onChange={e => setNewForm({...newForm, pembuat: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Status Alur Kerja Surat Keluar</label>
            <select value={detailForm.status} onChange={e => setDetailForm({...detailForm, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-accent-500">
              <option value="Draf">Draf Konseptor</option>
              <option value="Persetujuan">Sedang Direview Atasan</option>
              <option value="Dikirim">Sudah Dikirim (Resmi)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Ringkasan Isi Surat</label>
            <textarea rows={3} value={newForm.isi_ringkas} onChange={e => setNewForm({...newForm, isi_ringkas: e.target.value})} placeholder="Intisari isi surat dinas..." className="w-full p-2 bg-background border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-accent-500"></textarea>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Upload Berkas / Fisik Surat (PDF, JPG, PNG - Maks 5MB)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              className="w-full p-2 bg-background border border-border rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-3">
            <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 bg-background text-ink hover:opacity-80 rounded-lg font-semibold text-xs">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-semibold text-xs transition">
              Simpan Agenda
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DETAIL & ALUR KERJA */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Informasi & Tindak Lanjut" maxWidth="max-w-lg" icon={<FileText className="text-accent-600 w-5 h-5" />}>
        {selectedSuratData && (
          <div className="grid grid-cols-1 gap-6 p-6">
            {/* SISI KIRI: METADATA SURAT & FORM EDIT STATUS/DISPOSISI */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border">
                <div>
                  <p className="text-[10px] text-ink-soft font-semibold uppercase">ID REGISTRASI</p>
                  <p className="font-extrabold text-sm text-accent-600 font-mono">{selectedSuratData.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-soft font-semibold uppercase">SIFAT SURAT</p>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                    selectedSuratData.sifat === 'Penting' ? 'bg-warning-bg text-warning' : 'bg-background text-ink-soft'
                  }`}>
                    {selectedSuratData.sifat}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-border">
                <div>
                  <p className="text-[10px] text-ink-soft font-semibold uppercase">NOMOR SURAT RESMI</p>
                  <p className="font-bold text-ink text-sm font-mono mt-0.5">{selectedSuratData.no_surat || 'Belum diberikan'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-ink-soft font-semibold uppercase">TUJUAN / PENERIMA</p>
                  <p className="font-bold text-ink mt-0.5">{selectedSuratData.tujuan}</p>
                </div>

                <div>
                  <p className="text-[10px] text-ink-soft font-semibold uppercase">PERIHAL JELAS</p>
                  <p className="font-bold text-ink mt-0.5 leading-snug">{selectedSuratData.perihal}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-ink-soft font-semibold uppercase">TANGGAL SURAT</p>
                    <p className="font-semibold text-ink mt-0.5">{selectedSuratData.tanggal_surat}</p>
                  </div>
                </div>

                <div className="p-3 bg-background rounded-xl border border-border">
                  <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Isi Ringkas / Summary:</p>
                  <p className="text-ink mt-1 font-sans">{selectedSuratData.isi_ringkas || '-'}</p>
                </div>
              </div>

              {/* FORM UPDATE TINDAK LANJUT STATUS & DISPOSISI */}
              <div className="bg-accent-50/40 p-4 rounded-xl border border-accent-100">
                <p className="text-[10px] text-accent-700 font-bold uppercase tracking-wider mb-3 flex items-center">
                  <span className="mr-1 inline-flex p-0.5 bg-accent-200 text-accent-700 rounded-full w-4 h-4 items-center justify-center">✓</span> Pembaruan Tindak Lanjut:
                </p>

                <form onSubmit={handleUpdateDetail} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block font-semibold text-ink-soft mb-1">Status Alur Kerja Saat Ini</label>
                      <select value={detailForm.status} onChange={e => setDetailForm({...detailForm, status: e.target.value})} className="w-full p-2 bg-surface border border-border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-accent-500">
                        <option value="Draf">Draf (Konsep Baru)</option>
                        <option value="Persetujuan">Menunggu Persetujuan (Review)</option>
                        <option value="Dikirim">Sudah Dikirim / Selesai</option>
                        <option value="Dibatalkan">Dibatalkan</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-accent-600 hover:bg-accent-500 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm flex items-center justify-center space-x-1">
                    <Save className="w-3.5 h-3.5 mr-1" />
                    <span>Simpan Status</span>
                  </button>
                </form>
              </div>

              {/* SECTION UNGGAH / PREVIEW BERKAS DIGITAL */}
              <div className="mt-2 border-t border-border pt-4">
                <div className="p-5 rounded-xl border-2 border-dashed border-accent-200 bg-accent-50/30 flex flex-col items-center text-center">
                  {selectedSuratData.file_surat ? (
                    <div className="w-full">
                      <p className="text-sm font-bold text-ink mb-2">Pratinjau Berkas Fisik Digital</p>
                      {selectedSuratData.file_surat.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <img
                          src={selectedFileSrc!}
                          alt="Preview"
                          onClick={() => setLightboxSrc(selectedFileSrc)}
                          className="w-full h-auto rounded border border-border cursor-zoom-in hover:opacity-90 transition"
                        />
                      ) : (
                        <div className="p-4 bg-surface border border-border rounded flex flex-col items-center">
                          <FileText className="w-8 h-8 text-accent-600 mb-2" />
                          <p className="text-xs text-ink-soft font-semibold truncate max-w-full">{selectedSuratData.file_surat}</p>
                          <a href={selectedFileSrc!} target="_blank" rel="noopener noreferrer" className="mt-2 px-4 py-1.5 bg-accent-50 text-accent-700 hover:bg-accent-100 rounded-md font-semibold text-xs border border-accent-100">Buka / Unduh Berkas</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-accent-100 rounded-full mb-3 text-accent-700">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-ink">Unggah Berkas Fisik Digital</p>
                      <p className="text-[10px] text-accent-700/80 font-medium mt-1 mb-4">Surat ini belum memiliki lampiran berkas fisik (PDF / Gambar).</p>

                      <div className="w-full flex flex-col space-y-3">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full p-2 bg-surface border border-border rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
                        />
                        <button type="button" className="w-full py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-semibold text-xs transition shadow-sm">
                          Mulai Unggah Berkas
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  router.push('/buat-surat');
                }}
                className="text-accent-700 hover:text-accent-600 text-xs font-semibold flex items-center space-x-1 px-4 py-2 bg-accent-50 hover:bg-accent-100 rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Generator A4</span>
              </button>
              <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-5 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-semibold text-xs transition">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
