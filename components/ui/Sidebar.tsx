"use client";

import { useSipedigStore } from '@/store/useSipedigStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Settings,
  MailOpen,
  LogOut,
  X,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { suratMasuk, suratKeluar } = useSipedigStore();

  const totalMasuk = suratMasuk.length;
  const totalKeluar = suratKeluar.length;

  // Mock roles for now, we'll assume the user is an admin
  const isAdmin = true;
  const userName = 'Administrator Utama';
  const userEmail = 'admin.sipedig@prov.go.id';

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Surat Masuk',
      href: '/surat-masuk',
      icon: ArrowDownLeft,
      badge: totalMasuk,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      name: 'Surat Keluar',
      href: '/surat-keluar',
      icon: ArrowUpRight,
      badge: totalKeluar,
      iconColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-400',
    },
    {
      name: 'AI Mail Reader',
      href: '/ai-reader',
      icon: Bot,
      iconColor: 'text-fuchsia-400',
    },
    {
      name: 'Pembuat Surat (A4)',
      href: '/buat-surat',
      icon: FileText,
      iconColor: 'text-amber-400',
    },
    { name: 'Pengaturan Kop', href: '/pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between border-r border-slate-900 shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen overflow-hidden print:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-emerald-700 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-600/20">
              <MailOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight tracking-tight text-white">SIPEDIG 110</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E-Persuratan</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200',
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700/30'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 hover:translate-x-0.5'
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px] transition-transform group-hover:scale-105',
                      !isActive && item.iconColor
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : item.badgeBg
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/80 flex flex-col space-y-3 shrink-0">
          <div className="flex items-center space-x-3 bg-slate-900/20 p-2 rounded-xl border border-slate-900">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-emerald-500/20 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xs shrink-0">
              {isAdmin ? 'ADM' : 'VWR'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {userName}
                </p>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0',
                    isAdmin
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  )}
                >
                  {isAdmin ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

    </>
  );
}
