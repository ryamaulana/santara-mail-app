"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ScrollText } from "lucide-react";

type AuditLogEntry = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: any;
  createdAt: string;
  admin: { username: string; name: string };
};

const ACTION_LABELS: Record<string, string> = {
  "user.create": "Buat Pengguna",
  "user.update": "Ubah Pengguna",
  "pricing.update": "Ubah Harga/Margin",
  "billing.mark_paid": "Tandai Tagihan Lunas",
  "billing.mark_unpaid": "Batalkan Status Lunas",
};

function formatAuditDetails(action: string, details: any): string {
  if (!details) return "-";
  switch (action) {
    case "user.create":
      return `Buat user "${details.username}" (role: ${details.role})`;
    case "user.update": {
      const changes = details.changes || {};
      const parts = Object.entries(changes).map(
        ([field, v]: [string, any]) => `${field}: ${JSON.stringify(v.before)} → ${JSON.stringify(v.after)}`
      );
      return `User "${details.targetUsername}" — ${parts.join(", ") || "tidak ada perubahan"}`;
    }
    case "pricing.update": {
      const before = details.before || {};
      const after = details.after || {};
      const parts = Object.keys(after)
        .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        .map((key) => `${key}: ${before[key]} → ${after[key]}`);
      return parts.length > 0 ? parts.join(", ") : "Tidak ada perubahan nilai";
    }
    case "billing.mark_paid":
    case "billing.mark_unpaid":
      return `Tagihan user ${details.userId} — $${Number(details.amountUsd ?? 0).toFixed(4)}`;
    default:
      return JSON.stringify(details);
  }
}

async function fetchAuditLog(): Promise<AuditLogEntry[]> {
  const res = await fetch("/api/admin/audit-log");
  if (!res.ok) throw new Error("Gagal memuat log aktivitas admin");
  return res.json();
}

export default function AdminAuditLogPage() {
  const { isAdmin, isLoading: isLoadingSession } = useCurrentUser();

  const auditQuery = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: fetchAuditLog,
    enabled: isAdmin,
  });

  if (isLoadingSession) {
    return <div className="p-6 text-sm text-ink-soft">Memuat...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 bg-surface rounded-xl border border-border text-sm text-ink-soft">
        Halaman ini khusus untuk Super Admin.
      </div>
    );
  }

  const logs = auditQuery.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 bg-surface p-4 rounded-xl border border-border text-ink-soft">
        <ScrollText className="w-5 h-5 text-primary-600" />
        <h3 className="font-bold text-ink text-base">Log Aktivitas Admin</h3>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 bg-background border-b border-border text-xs text-ink-soft font-medium">
          Menampilkan {logs.length} aktivitas terbaru
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {auditQuery.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-soft">Memuat data...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-ink-soft">Belum ada aktivitas admin yang tercatat.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-primary-50/30 transition-colors align-top">
                    <td className="px-6 py-4 text-xs text-ink-soft whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink text-sm">{log.admin.name}</div>
                      <div className="text-xs text-ink-soft font-mono">{log.admin.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 whitespace-nowrap">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-soft leading-relaxed">
                      {formatAuditDetails(log.action, log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
