"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Lock, KeyRound, Check, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PASSWORD_REQUIREMENTS, getPasswordPolicyError } from "@/lib/passwordPolicy";

export default function ChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const policyError = getPasswordPolicyError(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal mengubah password.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push(user?.role === "SUPER_ADMIN" ? "/admin/users" : "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-panel-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-panel-accent/10 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <img src="/santara-mail-logo.png" alt="Santara Mail Logo" className="h-16 object-contain" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white">Ganti Password</h2>
        <p className="mt-1 text-center text-sm text-panel-ink-soft">
          Ini adalah login pertama Anda. Buat password baru sebelum melanjutkan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-panel-border/40 py-8 px-6 shadow-2xl rounded-2xl border border-panel-border">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-panel-accent/10 border border-panel-accent/30 rounded-xl text-panel-accent text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-panel-ink-soft uppercase tracking-wider mb-1.5">
                Password Sementara
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-panel-ink-soft">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Password yang diberikan admin"
                  className="block w-full pl-10 pr-3 py-2.5 bg-panel border border-panel-border rounded-xl text-panel-ink text-sm placeholder-panel-ink-soft focus:outline-none focus:ring-2 focus:ring-panel-primary focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-panel-ink-soft uppercase tracking-wider mb-1.5">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-panel-ink-soft">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="block w-full pl-10 pr-3 py-2.5 bg-panel border border-panel-border rounded-xl text-panel-ink text-sm placeholder-panel-ink-soft focus:outline-none focus:ring-2 focus:ring-panel-primary focus:border-transparent transition"
                />
              </div>
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(newPassword);
                  return (
                    <li
                      key={req.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        met ? "text-emerald-400" : "text-panel-ink-soft"
                      }`}
                    >
                      {met ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                      <span>{req.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-panel-ink-soft uppercase tracking-wider mb-1.5">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-panel-ink-soft">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Ulangi password baru"
                  className="block w-full pl-10 pr-3 py-2.5 bg-panel border border-panel-border rounded-xl text-panel-ink text-sm placeholder-panel-ink-soft focus:outline-none focus:ring-2 focus:ring-panel-primary focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-panel-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-panel-primary transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
