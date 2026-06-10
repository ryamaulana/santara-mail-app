"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useSipedigStore } from "@/store/useSipedigStore";
import { Badge } from "@/components/ui/Badge";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  Plus, 
  FileText 
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DashboardPage() {
  const { suratMasuk, suratKeluar } = useSipedigStore();

  const totalMasuk = suratMasuk.length;
  const totalKeluar = suratKeluar.length;
  const disposisiAktif = suratMasuk.filter(s => s.status === 'Diproses').length;
  const pendingReview = suratKeluar.filter(s => s.status === 'Persetujuan').length;

  const limitedMasuk = suratMasuk.slice(0, 5);
  const limitedKeluar = suratKeluar.slice(0, 5);

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

  const getStatusKeluarColor = (status: string) => {
    if (status === 'Dikirim') return 'success';
    if (status === 'Persetujuan') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold">Selamat Datang di Portal SIPEDIG 110</h3>
          <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
            Sistem informasi manajemen surat dengan database relasional terintegrasi. Catat agenda dinas, lakukan disposisi, dan buat draf naskah A4 secara instan.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <Link href="/surat-masuk" className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-900/30">
            <Plus className="w-4 h-4" />
            <span>Catat Surat Masuk</span>
          </Link>
          <Link href="/buat-surat" className="flex-1 sm:flex-initial bg-white/15 hover:bg-white/25 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition border border-white/20">
            <FileText className="w-4 h-4" />
            <span>Buat Surat Dinas</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Surat Masuk" value={totalMasuk} icon={ArrowDownLeft} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Total Surat Keluar" value={totalKeluar} icon={ArrowUpRight} colorClass="bg-sky-50 text-sky-600" />
        <StatCard title="Disposisi Berjalan" value={disposisiAktif} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Butuh Persetujuan" value={pendingReview} icon={AlertTriangle} colorClass="bg-rose-50 text-rose-600" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-10">
        
        {/* Surat Masuk Terbaru */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="w-[18px] h-[18px] text-emerald-500" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">5 Surat Masuk Terbaru</h3>
            </div>
            <Link href="/surat-masuk" className="text-xs text-indigo-600 font-semibold hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {limitedMasuk.map((sm) => (
              <div key={sm.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 hover:bg-slate-50/60 p-1.5 rounded-lg transition cursor-pointer">
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSifatColor(sm.sifat) as any}>{sm.sifat}</Badge>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{sm.id}</span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-700 truncate">{sm.perihal}</h5>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                    <span className="truncate max-w-[150px]">Dari: {sm.asal_surat}</span>
                    <span>•</span>
                    <span>{sm.tanggal_diterima}</span>
                  </div>
                </div>
                <Badge variant={getStatusMasukColor(sm.status) as any}>{sm.status}</Badge>
              </div>
            ))}
            {limitedMasuk.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada agenda surat masuk.</p>
            )}
          </div>
        </div>

        {/* Surat Keluar Terbaru */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-[18px] h-[18px] text-sky-500" />
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">5 Surat Keluar Terbaru</h3>
            </div>
            <Link href="/surat-keluar" className="text-xs text-indigo-600 font-semibold hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {limitedKeluar.map((sk) => (
              <div key={sk.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 hover:bg-slate-50/60 p-1.5 rounded-lg transition cursor-pointer">
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSifatColor(sk.sifat) as any}>{sk.sifat}</Badge>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{sk.id}</span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-700 truncate">{sk.perihal}</h5>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                    <span className="truncate max-w-[150px]">Ke: {sk.tujuan}</span>
                    <span>•</span>
                    <span>{sk.tanggal_surat}</span>
                  </div>
                </div>
                <Badge variant={getStatusKeluarColor(sk.status) as any}>{sk.status}</Badge>
              </div>
            ))}
            {limitedKeluar.length === 0 && (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada agenda surat keluar.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
