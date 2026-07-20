"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Receipt,
  CheckCircle2,
  UploadCloud,
  FileText,
  Gauge,
  Pencil,
  Save,
} from "lucide-react";
import Swal from "sweetalert2";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrencyDisplay } from "@/hooks/useCurrencyDisplay";
import { formatMoney } from "@/lib/currency";
import { UsageLineChart, UsageDetailPoint } from "@/components/ui/UsageLineChart";

type Granularity = "day" | "week" | "month" | "all";

type UsageStat = {
  requestCount: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  amountUsd: number;
};

type UsageDetailResponse = {
  user: { id: string; username: string; name: string; monthlyQuota: number | null; aiEnabled: boolean };
  marginPercent: number;
  stats: { today: UsageStat; week: UsageStat; month: UsageStat; allTime: UsageStat };
  granularity: Granularity;
  timeseries: UsageDetailPoint[];
};

type BillingRecord = {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  costUsd: number;
  marginPercent: number;
  amountUsd: number;
  isPaid: boolean;
  paidAt: string | null;
  markedBy: string | null;
  buktiBayar: string | null;
  buktiBayarUploadedAt: string | null;
  buktiBayarUploadedBy: string | null;
};

type BillingHistoryResponse = {
  userId: string;
  marginPercent: number;
  liveCostUsd: number;
  liveAmountUsd: number;
  currentPeriodRecord: BillingRecord | null;
  history: BillingRecord[];
};

async function fetchUsageDetail(userId: string, granularity: Granularity): Promise<UsageDetailResponse> {
  const res = await fetch(`/api/admin/usage/${userId}?granularity=${granularity}`);
  if (!res.ok) throw new Error("Gagal memuat detail pemakaian");
  return res.json();
}

async function fetchBillingHistory(userId: string): Promise<BillingHistoryResponse> {
  const res = await fetch(`/api/admin/billing?userId=${userId}`);
  if (!res.ok) throw new Error("Gagal memuat riwayat tagihan");
  return res.json();
}

function formatTokens(n: number) {
  return n.toLocaleString("id-ID");
}

function applyMarginPreview(draft: { costUsd: string; marginPercent: string }) {
  const costUsd = Number(draft.costUsd);
  const marginPercent = Number(draft.marginPercent);
  if (!Number.isFinite(costUsd) || !Number.isFinite(marginPercent)) return 0;
  return costUsd * (1 + marginPercent / 100);
}

function StatCard({ label, stat, formatCost }: { label: string; stat: UsageStat; formatCost: (usd: number) => string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-2">
      <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-ink">{formatCost(stat.costUsd)}</p>
      <div className="text-xs text-ink-soft space-y-0.5">
        <p>{stat.requestCount} request</p>
        <p>{formatTokens(stat.tokensIn)} in / {formatTokens(stat.tokensOut)} out</p>
        <p>Harga ke user: <span className="font-semibold text-ink">{formatCost(stat.amountUsd)}</span></p>
      </div>
    </div>
  );
}

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: "Harian",
  week: "Mingguan",
  month: "Bulanan",
  all: "Semua Waktu",
};

const PROOF_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export function UsageDetailClient({ userId }: { userId: string }) {
  const { isAdmin, isLoading: isLoadingSession } = useCurrentUser();
  const queryClient = useQueryClient();
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currency, setCurrency, usdToIdr, isRateLoading, isRateError } = useCurrencyDisplay(isAdmin);
  const cost = (usd: number) => formatMoney(usd, currency, usdToIdr);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ costUsd: string; marginPercent: string }>({ costUsd: "", marginPercent: "" });
  const [quotaDraft, setQuotaDraft] = useState("");
  const [lastSyncedQuota, setLastSyncedQuota] = useState<number | null | undefined>(undefined);

  const detailQuery = useQuery({
    queryKey: ["admin", "usage-detail", userId, granularity],
    queryFn: () => fetchUsageDetail(userId, granularity),
    enabled: isAdmin,
  });

  // Sync the draft whenever the fetched quota changes (first load or after save),
  // without clobbering in-progress edits on every re-render.
  if (detailQuery.data && detailQuery.data.user.monthlyQuota !== lastSyncedQuota) {
    setLastSyncedQuota(detailQuery.data.user.monthlyQuota);
    setQuotaDraft(detailQuery.data.user.monthlyQuota === null ? "" : String(detailQuery.data.user.monthlyQuota));
  }

  const billingQuery = useQuery({
    queryKey: ["admin", "billing", "user", userId],
    queryFn: () => fetchBillingHistory(userId),
    enabled: isAdmin,
  });

  const quotaMutation = useMutation({
    mutationFn: async (monthlyQuota: number | null) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyQuota }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kuota");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usage-detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "usage"] });
      Swal.fire({ icon: "success", title: "Kuota disimpan", timer: 1500, showConfirmButton: false });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const aiEnabledMutation = useMutation({
    mutationFn: async (aiEnabled: boolean) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah akses AI");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usage-detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "usage"] });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const generateBillingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tagihan");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "user", userId] });
      Swal.fire({ icon: "success", title: "Tagihan dibuat", timer: 1500, showConfirmButton: false });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const res = await fetch(`/api/admin/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status tagihan");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "user", userId] });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const correctBillingMutation = useMutation({
    mutationFn: async ({ id, costUsd, marginPercent }: { id: string; costUsd: number; marginPercent: number }) => {
      const res = await fetch(`/api/admin/billing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costUsd, marginPercent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengoreksi tagihan");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "user", userId] });
      setEditingRecordId(null);
      Swal.fire({ icon: "success", title: "Tagihan dikoreksi", timer: 1500, showConfirmButton: false });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/billing/${id}/proof`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah bukti bayar");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "user", userId] });
      Swal.fire({ icon: "success", title: "Bukti bayar diunggah", timer: 1500, showConfirmButton: false });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uploadTargetId) return;
    const allowed = PROOF_ACCEPT.split(",");
    if (!allowed.includes(file.type)) {
      Swal.fire({ icon: "error", title: "Format tidak didukung", text: "File harus JPG/PNG/WEBP/PDF." });
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      Swal.fire({ icon: "error", title: "File terlalu besar", text: "Ukuran file maksimal 5MB." });
      return;
    }
    uploadProofMutation.mutate({ id: uploadTargetId, file });
  };

  const handleSaveQuota = () => {
    const raw = quotaDraft.trim();
    const monthlyQuota = raw === "" ? null : Number(raw);
    if (monthlyQuota !== null && (!Number.isInteger(monthlyQuota) || monthlyQuota < 0)) {
      Swal.fire({ icon: "error", title: "Kuota tidak valid", text: "Isi angka bulat >= 0, atau kosongkan untuk tanpa batas." });
      return;
    }
    quotaMutation.mutate(monthlyQuota);
  };

  const handleStartEdit = (record: BillingRecord) => {
    setEditingRecordId(record.id);
    setEditDraft({ costUsd: String(record.costUsd), marginPercent: String(record.marginPercent) });
  };

  const handleSaveEdit = (id: string) => {
    const costUsd = Number(editDraft.costUsd);
    const marginPercent = Number(editDraft.marginPercent);
    if (!Number.isFinite(costUsd) || costUsd < 0 || !Number.isFinite(marginPercent) || marginPercent < 0) {
      Swal.fire({ icon: "error", title: "Nilai tidak valid", text: "Biaya dan margin harus angka >= 0." });
      return;
    }
    correctBillingMutation.mutate({ id, costUsd, marginPercent });
  };

  if (isLoadingSession || detailQuery.isLoading) {
    return <div className="p-6 text-sm text-ink-soft">Memuat...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6 bg-surface rounded-xl border border-border text-sm text-ink-soft">
        Halaman ini khusus untuk Super Admin.
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="p-6 bg-surface rounded-xl border border-border text-sm text-danger">
        {detailQuery.error instanceof Error ? detailQuery.error.message : "Pengguna tidak ditemukan."}
      </div>
    );
  }

  const { user, stats } = detailQuery.data;
  const history = billingQuery.data?.history ?? [];
  const currentPeriodRecord = billingQuery.data?.currentPeriodRecord ?? null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input ref={fileInputRef} type="file" accept={PROOF_ACCEPT} className="hidden" onChange={handleFileChange} />

      <div>
        <Link href="/admin/usage" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-primary-600 transition mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Pemakaian AI
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-border">
          <div>
            <h2 className="font-extrabold text-ink text-lg">{user.name}</h2>
            <p className="text-xs text-ink-soft font-mono">{user.username}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border text-xs font-semibold">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 rounded-md transition ${currency === "USD" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"}`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency("IDR")}
                className={`px-2.5 py-1 rounded-md transition ${currency === "IDR" ? "bg-primary-600 text-white" : "text-ink-soft hover:text-ink"}`}
              >
                IDR
              </button>
            </div>
          </div>
        </div>
        {currency === "IDR" && (
          <p className="text-[11px] text-ink-soft mt-1.5 px-1">
            {isRateLoading
              ? "Memuat kurs USD/IDR..."
              : isRateError || !usdToIdr
                ? "Gagal memuat kurs realtime — angka masih ditampilkan dalam USD."
                : `Kurs realtime: $1 = Rp${Math.round(usdToIdr).toLocaleString("id-ID")}`}
          </p>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Gauge className="w-4 h-4 text-primary-600 shrink-0" />
          <label className="text-xs font-semibold text-ink-soft">Kuota / bulan</label>
          <input
            type="number"
            min={0}
            placeholder="Tanpa batas"
            value={quotaDraft}
            onChange={(e) => setQuotaDraft(e.target.value)}
            className="w-28 p-2 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSaveQuota}
            disabled={quotaMutation.isPending}
            title="Simpan kuota"
            className="p-2 text-ink-soft hover:text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
          </button>
          {user.monthlyQuota !== null && user.monthlyQuota > 0 && (() => {
            const pct = stats.month.requestCount / user.monthlyQuota;
            if (pct >= 1) {
              return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger-bg text-danger whitespace-nowrap">Kuota Habis</span>;
            }
            if (pct >= 0.8) {
              return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning-bg text-warning whitespace-nowrap">{Math.round(pct * 100)}% Terpakai</span>;
            }
            return null;
          })()}
        </div>
        <button
          onClick={() => aiEnabledMutation.mutate(!user.aiEnabled)}
          disabled={aiEnabledMutation.isPending}
          title={user.aiEnabled ? "Nonaktifkan akses AI" : "Aktifkan akses AI"}
          className={`sm:ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
            user.aiEnabled ? "bg-success-bg text-success" : "bg-background text-ink-soft border border-border"
          }`}
        >
          {user.aiEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          {user.aiEnabled ? "AI Aktif" : "AI Nonaktif"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hari Ini" stat={stats.today} formatCost={cost} />
        <StatCard label="Minggu Ini" stat={stats.week} formatCost={cost} />
        <StatCard label="Bulan Ini" stat={stats.month} formatCost={cost} />
        <StatCard label="Sepanjang Waktu" stat={stats.allTime} formatCost={cost} />
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold">
        {(Object.keys(GRANULARITY_LABEL) as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => setGranularity(g)}
            className={`px-4 py-2 rounded-lg transition ${
              granularity === g ? "bg-primary-600 text-white" : "bg-background text-ink-soft border border-border"
            }`}
          >
            {GRANULARITY_LABEL[g]}
          </button>
        ))}
      </div>

      <UsageLineChart granularity={granularity} timeseries={detailQuery.data.timeseries} currency={currency} usdToIdr={usdToIdr} />

      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-ink text-base">Riwayat Tagihan</h3>
          </div>
          {!currentPeriodRecord && (
            <button
              onClick={() => generateBillingMutation.mutate()}
              disabled={generateBillingMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
            >
              <Receipt className="w-3.5 h-3.5" />
              Buat Tagihan Bulan Ini
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-4 py-3">Periode</th>
                <th className="px-4 py-3 text-right">Biaya Riil</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right">Total Ditagih</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Bukti Bayar</th>
                <th className="px-4 py-3 text-center">Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {billingQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">Memuat riwayat...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">Belum ada tagihan untuk pengguna ini.</td>
                </tr>
              ) : (
                history.map((record) => {
                  const isEditing = editingRecordId === record.id;
                  return (
                  <tr key={record.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">
                      {format(new Date(record.periodStart), "MMMM yyyy", { locale: localeId })}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.0001"
                            min={0}
                            value={editDraft.costUsd}
                            onChange={(e) => setEditDraft({ ...editDraft, costUsd: e.target.value })}
                            className="w-28 p-1.5 bg-background border border-border rounded-lg text-xs text-right focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="1"
                            min={0}
                            value={editDraft.marginPercent}
                            onChange={(e) => setEditDraft({ ...editDraft, marginPercent: e.target.value })}
                            className="w-20 p-1.5 bg-background border border-border rounded-lg text-xs text-right focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                          {cost(applyMarginPreview(editDraft))}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-mono text-ink-soft">{cost(record.costUsd)}</td>
                        <td className="px-4 py-3 text-right font-mono text-ink-soft">{record.marginPercent}%</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-ink">{cost(record.amountUsd)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => markPaidMutation.mutate({ id: record.id, isPaid: !record.isPaid })}
                        disabled={markPaidMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition disabled:opacity-60 ${
                          record.isPaid ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {record.isPaid ? "Lunas" : "Belum Lunas"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {record.buktiBayar ? (
                        <div className="flex items-center gap-2">
                          {record.buktiBayar.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                            <a href={`/${record.buktiBayar}`} target="_blank" rel="noopener noreferrer">
                              <img src={`/${record.buktiBayar}`} alt="Bukti bayar" className="w-10 h-10 object-cover rounded border border-border" />
                            </a>
                          ) : (
                            <a
                              href={`/${record.buktiBayar}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 hover:underline text-xs font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Buka Bukti
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setUploadTargetId(record.id);
                              fileInputRef.current?.click();
                            }}
                            className="text-[11px] font-semibold text-ink-soft hover:text-primary-600"
                          >
                            Ganti
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setUploadTargetId(record.id);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadProofMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border hover:border-primary-300 disabled:opacity-60 text-ink-soft hover:text-primary-600 text-xs font-semibold rounded-lg transition"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Upload Bukti Bayar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(record.id)}
                            disabled={correctBillingMutation.isPending}
                            className="px-2.5 py-1 bg-primary-600 hover:bg-primary-500 disabled:opacity-60 text-white text-[11px] font-semibold rounded-lg transition"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingRecordId(null)}
                            className="px-2.5 py-1 bg-background border border-border text-ink-soft text-[11px] font-semibold rounded-lg transition"
                          >
                            Batal
                          </button>
                        </div>
                      ) : record.isPaid ? (
                        <span className="text-[11px] text-ink-soft" title="Tandai belum lunas dulu untuk mengoreksi">—</span>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(record)}
                          title="Koreksi biaya/margin"
                          className="p-1.5 text-ink-soft hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
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
