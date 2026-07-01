"use client";

import { useSipedigStore } from '@/store/useSipedigStore';
import { Building, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profil } = useSipedigStore();

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 border-b border-slate-200/50 bg-white/75 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30 print:hidden">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight capitalize truncate">
          SIPEDIG 110
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-xs text-slate-400 font-semibold hidden md:inline">
          Hari ini: <strong className="text-slate-600 font-bold">{formattedDate}</strong>
        </span>
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center space-x-2 truncate bg-emerald-50/50 border border-emerald-100/50 px-3 py-1.5 rounded-xl">
          <Building className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700 truncate max-w-[120px] sm:max-w-none">
            {profil.nama_dinas}
          </span>
        </div>
        
        {/* Tombol Keluar Cepat */}
        <div className="h-6 w-px bg-slate-200 block"></div>
        <Link
          href="/login"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-500/10"
          title="Keluar dari sistem"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </Link>
      </div>
    </header>
  );
}

