import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profil, SuratMasuk, SuratKeluar } from '../types';

interface SipedigState {
  profil: Profil | null;
  suratMasuk: SuratMasuk[];
  suratKeluar: SuratKeluar[];

  // Data fetching
  fetchProfil: () => Promise<void>;
  updateProfil: (profil: Profil) => Promise<void>;
  fetchSuratMasuk: () => Promise<void>;
  fetchSuratKeluar: () => Promise<void>;
  
  // Mutations
  addSuratMasuk: (surat: Omit<SuratMasuk, 'id'>) => Promise<void>;
  deleteSuratMasuk: (id: string) => Promise<void>;
  updateStatusMasuk: (id: string, status: string, disposisi: string) => Promise<void>;

  addSuratKeluar: (surat: Omit<SuratKeluar, 'id'>) => Promise<void>;
  updateStatusKeluar: (id: string, status: string) => Promise<void>;
  deleteSuratKeluar: (id: string) => Promise<void>;
}

export const useSipedigStore = create<SipedigState>()(
  persist(
    (set) => ({
      profil: null,
      suratMasuk: [],
      suratKeluar: [],

      fetchProfil: async () => {
        try {
          const res = await fetch('/api/profil');
          if (!res.ok) return;
          const data = await res.json();
          set({ profil: data });
        } catch (error) {
          console.error("Failed to fetch profil:", error);
        }
      },

      updateProfil: async (profil) => {
        const res = await fetch('/api/profil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profil),
        });
        if (!res.ok) {
          throw new Error('Gagal menyimpan profil');
        }
        const updated = await res.json();
        set({ profil: updated });
      },

      fetchSuratMasuk: async () => {
        try {
          const res = await fetch('/api/surat-masuk');
          const data = await res.json();
          set({ suratMasuk: data });
        } catch (error) {
          console.error("Failed to fetch surat masuk:", error);
        }
      },

      fetchSuratKeluar: async () => {
        try {
          const res = await fetch('/api/surat-keluar');
          const data = await res.json();
          set({ suratKeluar: data });
        } catch (error) {
          console.error("Failed to fetch surat keluar:", error);
        }
      },

      addSuratMasuk: async (surat) => {
        try {
          const res = await fetch('/api/surat-masuk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(surat)
          });
          const newSurat = await res.json();
          set((state) => ({ suratMasuk: [newSurat, ...state.suratMasuk] }));
        } catch (error) {
          console.error("Failed to add surat masuk:", error);
        }
      },

      deleteSuratMasuk: async (id) => {
        try {
          await fetch(`/api/surat-masuk/${id}`, { method: 'DELETE' });
          set((state) => ({
            suratMasuk: state.suratMasuk.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error("Failed to delete surat masuk:", error);
        }
      },

      updateStatusMasuk: async (id, status, disposisi) => {
        try {
          const res = await fetch(`/api/surat-masuk/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, disposisi })
          });
          const updatedSurat = await res.json();
          set((state) => ({
            suratMasuk: state.suratMasuk.map((s) =>
              s.id === id ? { ...s, status: updatedSurat.status, disposisi: updatedSurat.disposisi } : s
            ),
          }));
        } catch (error) {
          console.error("Failed to update status masuk:", error);
        }
      },

      addSuratKeluar: async (surat) => {
        try {
          const res = await fetch('/api/surat-keluar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(surat)
          });
          const newSurat = await res.json();
          set((state) => ({ suratKeluar: [newSurat, ...state.suratKeluar] }));
        } catch (error) {
          console.error("Failed to add surat keluar:", error);
        }
      },

      updateStatusKeluar: async (id, status) => {
        try {
          const res = await fetch(`/api/surat-keluar/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
          const updatedSurat = await res.json();
          set((state) => ({
            suratKeluar: state.suratKeluar.map((s) =>
              s.id === id ? { ...s, status: updatedSurat.status } : s
            ),
          }));
        } catch (error) {
          console.error("Failed to update status keluar:", error);
        }
      },

      deleteSuratKeluar: async (id) => {
        try {
          await fetch(`/api/surat-keluar/${id}`, { method: 'DELETE' });
          set((state) => ({
            suratKeluar: state.suratKeluar.filter((s) => s.id !== id),
          }));
        } catch (error) {
          console.error("Failed to delete surat keluar:", error);
        }
      },
    }),
    {
      name: 'sipedig-storage',
      // profil/suratMasuk/suratKeluar are all DB-backed now; nothing needs
      // localStorage persistence, this is kept only so useSipedigStore stays
      // a drop-in persist() store if something needs caching later.
      partialize: () => ({}),
    }
  )
);
