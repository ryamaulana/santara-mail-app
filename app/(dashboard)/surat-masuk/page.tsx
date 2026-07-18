"use client";

import { useSipedigStore } from "@/store/useSipedigStore";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, Plus, FileText, Trash2, Paperclip, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { format } from "date-fns";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";

export default function SuratMasukPage() {
  const { suratMasuk, fetchSuratMasuk, addSuratMasuk, deleteSuratMasuk, updateStatusMasuk } = useSipedigStore();

  useEffect(() => {
    fetchSuratMasuk();
  }, [fetchSuratMasuk]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSifat, setFilterSifat] = useState("Semua");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);

  // New form state
  const [newForm, setNewForm] = useState({
    no_surat: "",
    asal_surat: "",
    perihal: "",
    tanggal_surat: "",
    tanggal_diterima: format(new Date(), "yyyy-MM-dd"),
    sifat: "Biasa",
    ringkasan: "",
  });

  // Detail/Update form state
  const [detailForm, setDetailForm] = useState({
    status: "Baru",
    disposisi: "",
  });

  const filteredSurat = suratMasuk.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (s.perihal || "").toLowerCase().includes(searchLower) ||
                          (s.no_surat || "").toLowerCase().includes(searchLower) ||
                          (s.asal_surat || "").toLowerCase().includes(searchLower);
    const matchesSifat = filterSifat === "Semua" || s.sifat === filterSifat;
    return matchesSearch && matchesSifat;
  });

  const getSifatColor = (sifat: string) => {
    if (sifat === 'Penting') return 'warning';
    if (sifat === 'Rahasia') return 'danger';
    return 'default';
  };

  const getStatusMasukColor = (status: string) => {
    if (status === 'Selesai') return 'success';
    if (status === 'Diproses') return 'warning';
    return 'info';
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Anda tidak dapat mengembalikan agenda surat ini!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f6e56',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteSuratMasuk(id);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Agenda surat telah dihapus.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const openNewModal = () => setIsNewModalOpen(true);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    addSuratMasuk({
      status: 'Baru',
      disposisi: '',
      file_surat: '',
      ...newForm,
    });
    setIsNewModalOpen(false);
    setNewForm({
      no_surat: "", asal_surat: "", perihal: "", tanggal_surat: "",
      tanggal_diterima: format(new Date(), "yyyy-MM-dd"), sifat: "Biasa", ringkasan: ""
    });
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Agenda surat masuk berhasil ditambahkan!',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const openDetailModal = (id: string) => {
    const s = suratMasuk.find((x) => x.id === id);
    if (s) {
      setSelectedSuratId(id);
      setDetailForm({ status: s.status, disposisi: s.disposisi });
      setIsDetailModalOpen(true);
    }
  };

  const handleUpdateDetail = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuratId) {
      updateStatusMasuk(selectedSuratId, detailForm.status, detailForm.disposisi);
      setIsDetailModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Status/Disposisi berhasil diperbarui!',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  const selectedSuratData = suratMasuk.find((x) => x.id === selectedSuratId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-ink-soft w-[18px] h-[18px]" />
            <input
              type="text"
              placeholder="Cari nomor, pengirim, atau hal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <option value="Rahasia">Rahasia</option>
            </select>
          </div>
        </div>

        <button onClick={openNewModal} className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition">
          <Plus className="w-4 h-4" />
          <span>Agenda Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 bg-background border-b border-border flex justify-between items-center text-xs text-ink-soft font-medium">
          <span>Menampilkan {filteredSurat.length} surat (Total Terarsip: {suratMasuk.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">No. Agenda</th>
                <th className="px-6 py-4">Sifat & Tanggal</th>
                <th className="px-6 py-4">Pengirim / No. Surat</th>
                <th className="px-6 py-4">Perihal</th>
                <th className="px-6 py-4">Status & Disposisi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredSurat.length === 0 ? (
                <tr key="empty-state">
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-soft">Tidak ada data surat masuk ditemukan.</td>
                </tr>
              ) : (
                filteredSurat.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-ink">{row.id}</td>
                    <td className="px-6 py-4 space-y-1">
                      <Badge variant={getSifatColor(row.sifat) as any}>{row.sifat}</Badge>
                      <p className="text-xs text-ink-soft mt-1">Terima: {row.tanggal_diterima}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink">{row.asal_surat}</p>
                      <p className="text-xs text-ink-soft">{row.no_surat}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center">
                        <span className="font-semibold text-ink line-clamp-2">{row.perihal}</span>
                        {row.file_surat && (
                          <span className="inline-flex items-center shrink-0 text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded text-[9px] font-bold ml-2 border border-primary-100">
                            <Paperclip className="w-2.5 h-2.5 mr-0.5" /> Berkas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1.5">
                      <Badge variant={getStatusMasukColor(row.status) as any}>{row.status}</Badge>
                      {row.disposisi && (
                        <p className="text-xs text-ink-soft italic line-clamp-1">Disp: "{row.disposisi}"</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => openDetailModal(row.id)} className="p-1.5 text-ink-soft hover:text-primary-600 hover:bg-primary-50 rounded" title="Detail / Tindak Lanjut">
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

      {/* MODAL: AGENDA BARU */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Registrasi Surat Masuk">
        <form onSubmit={handleSaveNew} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Nomor Surat Resmi</label>
              <input required type="text" value={newForm.no_surat} onChange={e => setNewForm({...newForm, no_surat: e.target.value})} placeholder="Contoh: 045.2/100/KPG" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Sifat Surat</label>
              <select value={newForm.sifat} onChange={e => setNewForm({...newForm, sifat: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Rahasia">Rahasia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Asal / Pengirim Surat</label>
            <input required type="text" value={newForm.asal_surat} onChange={e => setNewForm({...newForm, asal_surat: e.target.value})} placeholder="Instansi / Pengirim" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Perihal Surat</label>
            <input required type="text" value={newForm.perihal} onChange={e => setNewForm({...newForm, perihal: e.target.value})} placeholder="Subjek pokok surat" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Tanggal Surat Terbit</label>
              <input required type="date" value={newForm.tanggal_surat} onChange={e => setNewForm({...newForm, tanggal_surat: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Tanggal Surat Diterima</label>
              <input required type="date" value={newForm.tanggal_diterima} onChange={e => setNewForm({...newForm, tanggal_diterima: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Catatan Disposisi (Opsional)</label>
              <input type="text" value={detailForm.disposisi} onChange={e => setDetailForm({...detailForm, disposisi: e.target.value})} placeholder="Catatan Pimpinan" className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block font-semibold text-ink-soft mb-1">Status Disposisi</label>
              <select value={detailForm.status} onChange={e => setDetailForm({...detailForm, status: e.target.value})} className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="Baru">Baru / Belum Diproses</option>
                <option value="Diproses">Sedang Diproses (Disposisi Aktif)</option>
                <option value="Selesai">Arsip / Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Ringkasan Isi Surat</label>
            <textarea rows={3} value={newForm.ringkasan} onChange={e => setNewForm({...newForm, ringkasan: e.target.value})} placeholder="Intisari isi surat dinas..." className="w-full p-2 bg-background border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500"></textarea>
          </div>

          <div>
            <label className="block font-semibold text-ink-soft mb-1">Upload Berkas / Fisik Surat (PDF, JPG, PNG - Maks 5MB)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              className="w-full p-2 bg-background border border-border rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-3">
            <button type="button" onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 bg-background text-ink hover:opacity-80 rounded-lg font-semibold text-xs">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-xs transition">
              Simpan Agenda
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DETAIL & TINDAK LANJUT */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Detail Informasi & Tindak Lanjut" maxWidth="max-w-4xl" icon={<FileText className="text-primary-600 w-5 h-5" />}>
        {selectedSuratData && (
          <div className="flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* SISI KIRI: METADATA SURAT & FORM EDIT STATUS/DISPOSISI */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border">
                  <div>
                    <p className="text-[10px] text-ink-soft font-semibold uppercase">ID REGISTRASI</p>
                    <p className="font-extrabold text-sm text-primary-600 font-mono">{selectedSuratData.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-soft font-semibold uppercase">SIFAT SURAT</p>
                    <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                      selectedSuratData.sifat === 'Penting' ? 'bg-warning-bg text-warning' : (selectedSuratData.sifat === 'Rahasia' ? 'bg-danger-bg text-danger' : 'bg-background text-ink-soft')
                    }`}>
                      {selectedSuratData.sifat}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pb-4 border-b border-border">
                  <div>
                    <p className="text-[10px] text-ink-soft font-semibold uppercase">NOMOR SURAT RESMI</p>
                    <p className="font-bold text-ink text-sm font-mono mt-0.5">{selectedSuratData.no_surat}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-ink-soft font-semibold uppercase">PENGIRIM / INSTANSI ASAL</p>
                    <p className="font-bold text-ink mt-0.5">{selectedSuratData.asal_surat}</p>
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
                    <div>
                      <p className="text-[10px] text-ink-soft font-semibold uppercase">DITERIMA TANGGAL</p>
                      <p className="font-semibold text-ink mt-0.5">{selectedSuratData.tanggal_diterima}</p>
                    </div>
                  </div>

                  {selectedSuratData.disposisi && (
                    <div className="p-3 bg-warning-bg rounded-xl border border-warning/30">
                      <p className="text-[10px] text-warning font-bold uppercase tracking-wider">Disposisi Saat Ini:</p>
                      <p className="text-warning mt-1 italic font-medium">{selectedSuratData.disposisi}</p>
                    </div>
                  )}

                  <div className="p-3 bg-background rounded-xl border border-border">
                    <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Isi Ringkas / Summary:</p>
                    <p className="text-ink mt-1 font-sans">{selectedSuratData.ringkasan || '-'}</p>
                  </div>
                </div>

                {/* FORM UPDATE TINDAK LANJUT STATUS & DISPOSISI */}
                <div className="bg-primary-50/40 p-4 rounded-xl border border-primary-100">
                  <p className="text-[10px] text-primary-700 font-bold uppercase tracking-wider mb-3 flex items-center">
                    <span className="mr-1 inline-flex p-0.5 bg-primary-200 text-primary-700 rounded-full w-4 h-4 items-center justify-center">✓</span> Pembaruan Tindak Lanjut:
                  </p>

                  <form onSubmit={handleUpdateDetail} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block font-semibold text-ink-soft mb-1">Status Alur Surat</label>
                        <select value={detailForm.status} onChange={e => setDetailForm({...detailForm, status: e.target.value})} className="w-full p-2 bg-surface border border-border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-primary-500">
                          <option value="Baru">Baru / Belum Diproses</option>
                          <option value="Diproses">Sedang Diproses (Diproses)</option>
                          <option value="Selesai">Arsip / Selesai</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-ink-soft mb-1">Catatan Disposisi / Instruksi Atasan</label>
                        <textarea rows={3} value={detailForm.disposisi} onChange={e => setDetailForm({...detailForm, disposisi: e.target.value})} placeholder="Contoh: Diteruskan ke sekretaris untuk diproses lanjut..." className="w-full p-2 bg-surface border border-border rounded-lg text-xs resize-none"></textarea>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs py-2 rounded-lg transition shadow-sm flex items-center justify-center space-x-1">
                      <Save className="w-3.5 h-3.5 mr-1" />
                      <span>Simpan Status & Disposisi</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* SISI KANAN: SECTION UNGGAH / PREVIEW BERKAS DIGITAL */}
              <div className="flex flex-col h-full border-l-0 md:border-l border-border pl-0 md:pl-6 pt-6 md:pt-0">
                <div className="flex-1 p-5 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/30 flex flex-col justify-center items-center text-center overflow-hidden min-h-[300px]">
                  {selectedSuratData.file_surat ? (
                    <div className="w-full flex flex-col items-center h-full">
                      <p className="text-sm font-bold text-ink mb-2">Pratinjau Berkas Fisik Digital</p>
                      {selectedSuratData.file_surat.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <div className="w-full flex flex-col items-center">
                          <div className="w-full flex-1 overflow-auto bg-background rounded border border-border p-2 flex items-center justify-center">
                            <img
                              src={selectedSuratData.file_surat.startsWith('http') || selectedSuratData.file_surat.startsWith('/') ? selectedSuratData.file_surat : `/${selectedSuratData.file_surat}`}
                              alt="Preview"
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <p className="mt-2 text-xs font-mono text-ink-soft break-all text-center">Path: {selectedSuratData.file_surat}</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-surface border border-border rounded flex flex-col items-center w-full">
                          <FileText className="w-8 h-8 text-primary-600 mb-2" />
                          <p className="text-xs text-ink-soft font-semibold truncate max-w-full">{selectedSuratData.file_surat}</p>
                          <a href={selectedSuratData.file_surat.startsWith('http') || selectedSuratData.file_surat.startsWith('/') ? selectedSuratData.file_surat : `/${selectedSuratData.file_surat}`} target="_blank" rel="noopener noreferrer" className="mt-2 px-4 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-md font-semibold text-xs border border-primary-100">Buka / Unduh Berkas</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-primary-100 rounded-full mb-3 text-primary-700">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-ink">Unggah Berkas Fisik Digital</p>
                      <p className="text-[10px] text-primary-700/80 font-medium mt-1 mb-4">Surat ini belum memiliki lampiran berkas fisik (PDF / Gambar).</p>

                      <div className="w-full flex flex-col space-y-3 mt-auto">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full p-2 bg-surface border border-border rounded-lg text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <button type="button" className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-xs transition shadow-sm">
                          Mulai Unggah Berkas
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-background border-t border-border flex justify-end">
              <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-xs transition shadow-sm">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
