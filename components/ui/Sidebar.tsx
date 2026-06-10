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
          'fixed inset-y-0 left-0 z-50 w-64 h-screen max-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen overflow-hidden print:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <MailOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">SIPEDIG 110</h1>
              <p className="text-xs text-slate-400">E-Persuratan Modern</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
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
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    className={cn(
                      'w-[18px] h-[18px]',
                      !isActive && item.iconColor
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-bold',
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col space-y-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
              {isAdmin ? 'ADM' : 'VWR'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {userName}
                </p>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0',
                    isAdmin
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  )}
                >
                  {isAdmin ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
          {/* Logout Button */}
          <Link
            href="/login"
            className="w-full py-2 px-3 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/30 rounded-lg text-xs font-semibold text-rose-400 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
