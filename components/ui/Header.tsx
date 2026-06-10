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
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-8 shrink-0 print:hidden">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-bold text-slate-800 capitalize truncate">
          SIPEDIG 110
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-xs sm:text-sm text-slate-500 hidden md:inline">
          Hari ini: <strong className="text-slate-700">{formattedDate}</strong>
        </span>
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
        <div className="flex items-center space-x-2 truncate">
          <Building className="w-[18px] h-[18px] text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-indigo-600 truncate max-w-[120px] sm:max-w-none">
            {profil.nama_dinas}
          </span>
        </div>
        {/* Tombol Keluar Cepat untuk Laptop/Desktop */}
        <div className="h-8 w-px bg-slate-200 hidden lg:block"></div>
        <Link
          href="/login"
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold transition"
          title="Keluar dari sistem"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </Link>
      </div>
    </header>
  );
}
