"use client";

import { useSipedigStore } from '@/store/useSipedigStore';
import { useLogout } from '@/hooks/useCurrentUser';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Building, LogOut, Menu } from 'lucide-react';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { profil } = useSipedigStore();
  const logout = useLogout();

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30 print:hidden">
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-ink-soft hover:text-ink hover:bg-background rounded-xl transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-extrabold text-ink tracking-tight capitalize truncate">
          Santara Mail
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-xs text-ink-soft font-semibold hidden md:inline">
          Hari ini: <strong className="text-ink font-bold">{formattedDate}</strong>
        </span>
        <div className="h-6 w-px bg-border hidden md:block"></div>
        <div className="flex items-center space-x-2 truncate bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl">
          <Building className="w-4 h-4 text-primary-700 shrink-0" />
          <span className="text-xs font-bold text-primary-700 truncate max-w-[120px] sm:max-w-none">
            {profil?.nama_dinas ?? '...'}
          </span>
        </div>

        <div className="h-6 w-px bg-border hidden md:block"></div>
        <ThemeToggle />

        {/* Tombol Keluar Cepat */}
        <div className="h-6 w-px bg-border block"></div>
        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-danger-bg hover:opacity-80 text-danger rounded-xl text-xs font-bold transition cursor-pointer border border-danger/10"
          title="Keluar dari sistem"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
