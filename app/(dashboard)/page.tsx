"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useSipedigStore } from "@/store/useSipedigStore";
import { Badge } from "@/components/ui/Badge";
import { MiniChart } from "@/components/ui/MiniChart";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  Plus, 
  FileText,
  ChevronRight,
  Inbox,
  Send
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardPage() {
  const { 
    suratMasuk, 
    suratKeluar,
    fetchSuratMasuk,
    fetchSuratKeluar
  } = useSipedigStore();

  // Fetch data on load
  useEffect(() => {
    fetchSuratMasuk();
    fetchSuratKeluar();
  }, [fetchSuratMasuk, fetchSuratKeluar]);

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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Banner - Sophisticated Slate Solid Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-soft flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700/50 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Portal SIPEDIG 110</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Sistem Informasi Persuratan Digital
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-semibold leading-relaxed">
            Kelola agenda dinas, lakukan disposisi surat secara cepat, dan buat draf naskah resmi A4 instan dengan data relasional terintegrasi.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <Link 
            href="/surat-masuk" 
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Surat Masuk</span>
          </Link>
          <Link 
            href="/buat-surat" 
            className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-orange-950/40"
          >
            <FileText className="w-4 h-4" />
            <span>Buat Surat Dinas</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Surat Masuk" value={totalMasuk} icon={ArrowDownLeft} colorClass="bg-emerald-500 text-emerald-600" />
        <StatCard title="Total Surat Keluar" value={totalKeluar} icon={ArrowUpRight} colorClass="bg-orange-500 text-orange-600" />
        <StatCard title="Disposisi Berjalan" value={disposisiAktif} icon={Clock} colorClass="bg-amber-500 text-amber-600" />
        <StatCard title="Butuh Persetujuan" value={pendingReview} icon={AlertTriangle} colorClass="bg-rose-500 text-rose-600" />
      </div>

      {/* Mini Chart Section */}
      <div className="w-full">
        <MiniChart />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Surat Masuk Terbaru */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/60 shadow-soft space-y-5 transition-all duration-300 hover:shadow-md hover:border-slate-350/50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/50">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Surat Masuk Terbaru</h3>
            </div>
            <Link 
              href="/surat-masuk" 
              className="text-xs text-slate-500 font-bold hover:text-emerald-650 flex items-center space-x-0.5 transition"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="space-y-2">
            {limitedMasuk.map((sm) => (
              <div 
                key={sm.id} 
                className="p-3 flex items-start justify-between gap-4 bg-white/40 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm"
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSifatColor(sm.sifat) as any}>{sm.sifat}</Badge>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{sm.id}</span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-700 truncate">
                    {sm.perihal}
                  </h5>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-semibold">
                    <span className="truncate max-w-[150px]">Dari: {sm.asal_surat}</span>
                    <span>•</span>
                    <span>{sm.tanggal_diterima}</span>
                  </div>
                </div>
                <Badge variant={getStatusMasukColor(sm.status) as any}>{sm.status}</Badge>
              </div>
            ))}
            {limitedMasuk.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">Belum ada agenda surat masuk.</p>
              </div>
            )}
          </div>
        </div>

        {/* Surat Keluar Terbaru */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200/60 shadow-soft space-y-5 transition-all duration-300 hover:shadow-md hover:border-slate-350/50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200/50">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Surat Keluar Terbaru</h3>
            </div>
            <Link 
              href="/surat-keluar" 
              className="text-xs text-slate-500 font-bold hover:text-emerald-650 flex items-center space-x-0.5 transition"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="space-y-2">
            {limitedKeluar.map((sk) => (
              <div 
                key={sk.id} 
                className="p-3 flex items-start justify-between gap-4 bg-white/40 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-sm"
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSifatColor(sk.sifat) as any}>{sk.sifat}</Badge>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{sk.id}</span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-700 truncate">
                    {sk.perihal}
                  </h5>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 font-semibold">
                    <span className="truncate max-w-[150px]">Ke: {sk.tujuan}</span>
                    <span>•</span>
                    <span>{sk.tanggal_surat}</span>
                  </div>
                </div>
                <Badge variant={getStatusKeluarColor(sk.status) as any}>{sk.status}</Badge>
              </div>
            ))}
            {limitedKeluar.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <Send className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">Belum ada agenda surat keluar.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

