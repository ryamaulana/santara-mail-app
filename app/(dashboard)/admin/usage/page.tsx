"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Gauge, Save, Percent, AlertTriangle, BellRing } from "lucide-react";
import Swal from "sweetalert2";
import { UsageChart, UsageTimeseriesPoint } from "@/components/ui/UsageChart";
import { useCurrencyDisplay } from "@/hooks/useCurrencyDisplay";
import { formatMoney } from "@/lib/currency";

type UsageRow = {
  id: string;
  username: string;
  name: string;
  monthlyQuota: number | null;
  aiEnabled: boolean;
  requestCount: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
};

type UsageResponse = {
  scope: "month" | "all";
  users: UsageRow[];
  timeseries: UsageTimeseriesPoint[];
  todaySpendUsd: number;
  thisMonthSpendUsd: number;
};

type PricingSettings = {
  groqInputPerMillion: number;
  groqOutputPerMillion: number;
  marginPercent: number;
  dailySpendAlertUsd: number | null;
  monthlySpendAlertUsd: number | null;
  updatedAt: string;
  updatedBy: string | null;
};

async function fetchUsage(scope: "month" | "all"): Promise<UsageResponse> {
  const res = await fetch(`/api/admin/usage?scope=${scope}`);
  if (!res.ok) throw new Error("Gagal memuat data pemakaian AI");
  return res.json();
}

async function fetchPricing(): Promise<PricingSettings> {
  const res = await fetch("/api/admin/pricing-settings");
  if (!res.ok) throw new Error("Gagal memuat pengaturan harga");
  return res.json();
}

function formatTokens(n: number) {
  return n.toLocaleString("id-ID");
}

export default function AdminUsagePage() {
  const { isAdmin, isLoading: isLoadingSession } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"month" | "all">("month");
  const [pricingDraft, setPricingDraft] = useState<{ groqInputPerMillion: string; groqOutputPerMillion: string; marginPercent: string } | null>(null);
  const [alertDraft, setAlertDraft] = useState<{ dailySpendAlertUsd: string; monthlySpendAlertUsd: string } | null>(null);
  const { currency, setCurrency, usdToIdr, isRateLoading, isRateError } = useCurrencyDisplay(isAdmin);
  const cost = (usd: number) => formatMoney(usd, currency, usdToIdr);

  const usageQuery = useQuery({
    queryKey: ["admin", "usage", scope],
    queryFn: () => fetchUsage(scope),
    enabled: isAdmin,
  });

  const pricingQuery = useQuery({
    queryKey: ["admin", "pricing-settings"],
    queryFn: fetchPricing,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (pricingQuery.data && !pricingDraft) {
      setPricingDraft({
        groqInputPerMillion: String(pricingQuery.data.groqInputPerMillion),
        groqOutputPerMillion: String(pricingQuery.data.groqOutputPerMillion),
        marginPercent: String(pricingQuery.data.marginPercent),
      });
    }
    if (pricingQuery.data && !alertDraft) {
      setAlertDraft({
        dailySpendAlertUsd: pricingQuery.data.dailySpendAlertUsd === null ? "" : String(pricingQuery.data.dailySpendAlertUsd),
        monthlySpendAlertUsd: pricingQuery.data.monthlySpendAlertUsd === null ? "" : String(pricingQuery.data.monthlySpendAlertUsd),
      });
    }
  }, [pricingQuery.data, pricingDraft, alertDraft]);

  const pricingMutation = useMutation({
    mutationFn: async (payload: {
      groqInputPerMillion: number;
      groqOutputPerMillion: number;
      marginPercent: number;
      dailySpendAlertUsd: number | null;
      monthlySpendAlertUsd: number | null;
    }) => {
      const res = await fetch("/api/admin/pricing-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan harga");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "billing"] });
      Swal.fire({ icon: "success", title: "Pengaturan harga disimpan", timer: 1500, showConfirmButton: false });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
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

  const rows = usageQuery.data?.users ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      requestCount: acc.requestCount + r.requestCount,
      tokensIn: acc.tokensIn + r.tokensIn,
      tokensOut: acc.tokensOut + r.tokensOut,
      costUsd: acc.costUsd + r.costUsd,
    }),
    { requestCount: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 }
  );

  const handleSaveSettings = () => {
    if (!pricingDraft || !alertDraft) return;
    const groqInputPerMillion = Number(pricingDraft.groqInputPerMillion);
    const groqOutputPerMillion = Number(pricingDraft.groqOutputPerMillion);
    const marginPercent = Number(pricingDraft.marginPercent);
    if (
      !Number.isFinite(groqInputPerMillion) || groqInputPerMillion < 0 ||
      !Number.isFinite(groqOutputPerMillion) || groqOutputPerMillion < 0 ||
      !Number.isFinite(marginPercent) || marginPercent < 0
    ) {
      Swal.fire({ icon: "error", title: "Nilai tidak valid", text: "Harga input/output dan margin harus angka >= 0." });
      return;
    }

    const parseAlert = (raw: string): number | null | undefined => {
      if (raw.trim() === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const dailySpendAlertUsd = parseAlert(alertDraft.dailySpendAlertUsd);
    const monthlySpendAlertUsd = parseAlert(alertDraft.monthlySpendAlertUsd);
    if (dailySpendAlertUsd === undefined || monthlySpendAlertUsd === undefined) {
      Swal.fire({ icon: "error", title: "Nilai tidak valid", text: "Ambang alert harus angka >= 0, atau kosongkan untuk menonaktifkan." });
      return;
    }

    pricingMutation.mutate({ groqInputPerMillion, groqOutputPerMillion, marginPercent, dailySpendAlertUsd, monthlySpendAlertUsd });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-2 text-ink-soft">
          <Gauge className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-ink text-base">Pemakaian AI Reader per Pengguna</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
          <button
            onClick={() => setScope("month")}
            className={`px-4 py-2 rounded-lg transition ${scope === "month" ? "bg-primary-600 text-white" : "bg-background text-ink-soft border border-border"}`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setScope("all")}
            className={`px-4 py-2 rounded-lg transition ${scope === "all" ? "bg-primary-600 text-white" : "bg-background text-ink-soft border border-border"}`}
          >
            Semua Waktu
          </button>
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border">
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2.5 py-1.5 rounded-md transition ${currency === "USD" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"}`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency("IDR")}
              className={`px-2.5 py-1.5 rounded-md transition ${currency === "IDR" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"}`}
            >
              IDR
            </button>
          </div>
        </div>
      </div>
      {currency === "IDR" && (
        <p className="text-[11px] text-ink-soft -mt-4 px-1">
          {isRateLoading
            ? "Memuat kurs USD/IDR..."
            : isRateError || !usdToIdr
              ? "Gagal memuat kurs realtime — angka masih ditampilkan dalam USD."
              : `Kurs realtime: $1 = Rp${Math.round(usdToIdr).toLocaleString("id-ID")}`}
        </p>
      )}

      {/* Pengaturan Harga & Margin */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <Percent className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-ink text-base">Harga Token & Margin</h3>
        </div>
        <p className="text-xs text-ink-soft mb-4">
          Groq tidak punya API untuk pricing — cek manual ke{" "}
          <span className="font-semibold">groq.com/pricing</span> lalu isi angkanya di sini. Harga ini dipakai untuk
          menghitung estimasi biaya dan tagihan ke user.
        </p>
        {pricingDraft && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Harga Input ($/juta token)</label>
              <input
                type="number"
                step="0.001"
                min={0}
                value={pricingDraft.groqInputPerMillion}
                onChange={(e) => setPricingDraft({ ...pricingDraft, groqInputPerMillion: e.target.value })}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Harga Output ($/juta token)</label>
              <input
                type="number"
                step="0.001"
                min={0}
                value={pricingDraft.groqOutputPerMillion}
                onChange={(e) => setPricingDraft({ ...pricingDraft, groqOutputPerMillion: e.target.value })}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Margin (%)</label>
              <input
                type="number"
                step="1"
                min={0}
                value={pricingDraft.marginPercent}
                onChange={(e) => setPricingDraft({ ...pricingDraft, marginPercent: e.target.value })}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <p className="text-[11px] text-ink-soft">
            {pricingQuery.data?.updatedAt
              ? `Terakhir diupdate ${new Date(pricingQuery.data.updatedAt).toLocaleString("id-ID")}${pricingQuery.data.updatedBy ? ` oleh ${pricingQuery.data.updatedBy}` : ""}`
              : "Belum pernah diupdate — memakai nilai default."}
          </p>
          <button
            onClick={handleSaveSettings}
            disabled={pricingMutation.isPending || !pricingDraft}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {pricingMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* Alert Biaya */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <BellRing className="w-5 h-5 text-warning" />
          <h3 className="font-bold text-ink text-base">Alert Biaya</h3>
        </div>
        <p className="text-xs text-ink-soft mb-4">
          Tampilkan peringatan di halaman ini kalau total biaya AI (semua user) tembus ambang. Kosongkan untuk menonaktifkan.
        </p>
        {alertDraft && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Ambang Harian ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Nonaktif"
                value={alertDraft.dailySpendAlertUsd}
                onChange={(e) => setAlertDraft({ ...alertDraft, dailySpendAlertUsd: e.target.value })}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Ambang Bulanan ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                placeholder="Nonaktif"
                value={alertDraft.monthlySpendAlertUsd}
                onChange={(e) => setAlertDraft({ ...alertDraft, monthlySpendAlertUsd: e.target.value })}
                className="w-full p-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSaveSettings}
            disabled={pricingMutation.isPending || !alertDraft}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {pricingMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {(() => {
        const daily = pricingQuery.data?.dailySpendAlertUsd;
        const monthly = pricingQuery.data?.monthlySpendAlertUsd;
        const todaySpend = usageQuery.data?.todaySpendUsd ?? 0;
        const monthSpend = usageQuery.data?.thisMonthSpendUsd ?? 0;
        const dailyBreached = daily !== null && daily !== undefined && todaySpend >= daily;
        const monthlyBreached = monthly !== null && monthly !== undefined && monthSpend >= monthly;
        if (!dailyBreached && !monthlyBreached) return null;
        return (
          <div className="p-4 bg-danger-bg border border-danger/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="text-sm text-danger">
              <p className="font-bold">Peringatan: biaya AI tembus ambang yang di-set.</p>
              {dailyBreached && <p>Biaya hari ini {cost(todaySpend)} ≥ ambang harian {cost(daily!)}.</p>}
              {monthlyBreached && <p>Biaya bulan ini {cost(monthSpend)} ≥ ambang bulanan {cost(monthly!)}.</p>}
            </div>
          </div>
        );
      })()}

      {!usageQuery.isLoading && (
        <UsageChart scope={scope} timeseries={usageQuery.data?.timeseries ?? []} />
      )}

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 bg-background border-b border-border text-xs text-ink-soft font-medium flex flex-wrap gap-x-6 gap-y-1">
          <span>Total request: <strong className="text-ink">{formatTokens(totals.requestCount)}</strong></span>
          <span>Total token in/out: <strong className="text-ink">{formatTokens(totals.tokensIn)} / {formatTokens(totals.tokensOut)}</strong></span>
          <span>Estimasi biaya total: <strong className="text-ink">{cost(totals.costUsd)}</strong></span>
          <span className="ml-auto italic">Klik baris untuk lihat detail, kuota, dan akses AI per pengguna</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4 text-right">Request</th>
                <th className="px-6 py-4 text-right">Token In</th>
                <th className="px-6 py-4 text-right">Token Out</th>
                <th className="px-6 py-4 text-right">Biaya (Cost)</th>
                <th className="px-6 py-4 text-right">Harga ke User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {usageQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-soft">Memuat data...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-soft">Belum ada pengguna dengan role User.</td>
                </tr>
              ) : (
                rows.map((row) => {
                  const marginPercent = pricingQuery.data?.marginPercent ?? 0;
                  const hargaKeUser = row.costUsd * (1 + marginPercent / 100);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/admin/usage/${row.id}`)}
                      tabIndex={0}
                      role="link"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(`/admin/usage/${row.id}`);
                      }}
                      className="cursor-pointer hover:bg-primary-50/30 focus:bg-primary-50/30 outline-none transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-ink">{row.name}</div>
                        <div className="text-xs text-ink-soft font-mono">{row.username}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-ink">{formatTokens(row.requestCount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-ink-soft">{formatTokens(row.tokensIn)}</td>
                      <td className="px-6 py-4 text-right font-mono text-ink-soft">{formatTokens(row.tokensOut)}</td>
                      <td className="px-6 py-4 text-right font-mono text-ink-soft">{cost(row.costUsd)}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-ink">{cost(hargaKeUser)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
