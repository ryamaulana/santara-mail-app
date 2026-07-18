"use client";

import { useSipedigStore } from '@/store/useSipedigStore';
import { useCurrentUser, useLogout } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Settings,
  Users,
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
  const { user, isAdmin } = useCurrentUser();
  const logout = useLogout();

  const totalMasuk = suratMasuk.length;
  const totalKeluar = suratKeluar.length;

  const userName = user?.name ?? '...';
  const userLabel = user?.username ?? '';

  // Super admin only manages accounts — it never touches surat, so its
  // sidebar is limited to the one page it's allowed to use.
  const menuItems = isAdmin
    ? [{ name: 'Manajemen Pengguna', href: '/admin/users', icon: Users }]
    : [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        {
          name: 'Surat Masuk',
          href: '/surat-masuk',
          icon: ArrowDownLeft,
          badge: totalMasuk,
          iconColor: 'text-panel-primary',
          badgeBg: 'bg-panel-primary/20 text-panel-primary',
        },
        {
          name: 'Surat Keluar',
          href: '/surat-keluar',
          icon: ArrowUpRight,
          badge: totalKeluar,
          iconColor: 'text-panel-accent',
          badgeBg: 'bg-panel-accent/20 text-panel-accent',
        },
        {
          name: 'AI Mail Reader',
          href: '/ai-reader',
          icon: Bot,
          iconColor: 'text-panel-ink-soft',
        },
        {
          name: 'Pembuat Surat (A4)',
          href: '/buat-surat',
          icon: FileText,
          iconColor: 'text-panel-ink-soft',
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
          'fixed inset-y-0 left-0 z-50 w-64 h-screen max-h-screen bg-panel text-panel-ink flex flex-col justify-between border-r border-panel-border shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen overflow-hidden print:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="p-6 border-b border-panel-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <img src="/santara-mail-logo.png" alt="Santara Mail Logo" className="h-10 object-contain" />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-panel-ink-soft hover:text-panel-ink p-1 hover:bg-panel-border rounded-lg transition"
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
                    ? 'bg-panel-border text-white border border-panel-primary/30'
                    : 'text-panel-ink-soft hover:bg-panel-border/50 hover:text-panel-ink hover:translate-x-0.5'
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
        <div className="p-4 border-t border-panel-border flex flex-col space-y-3 shrink-0">
          <div className="flex items-center space-x-3 bg-panel-border/30 p-2 rounded-xl border border-panel-border">
            <div className="w-9 h-9 rounded-xl bg-panel-primary/15 border border-panel-primary/30 text-panel-primary flex items-center justify-center font-extrabold text-xs shrink-0">
              {isAdmin ? 'ADM' : 'USR'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-panel-ink truncate">
                  {userName}
                </p>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0',
                    isAdmin
                      ? 'bg-panel-primary/20 text-panel-primary border border-panel-primary/30'
                      : 'bg-panel-ink-soft/20 text-panel-ink-soft border border-panel-ink-soft/30'
                  )}
                >
                  {isAdmin ? 'Super Admin' : 'User'}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-panel-ink-soft truncate">{userLabel}</p>
            </div>
            <button
              onClick={logout}
              title="Keluar dari sistem"
              className="p-2 text-panel-ink-soft hover:text-panel-accent hover:bg-panel-border rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
