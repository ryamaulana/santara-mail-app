"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, User, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal masuk. Periksa kembali username dan password.");
        return;
      }

      const data = await res.json();
      router.push(data.role === "SUPER_ADMIN" ? "/admin/users" : "/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Ornaments */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-panel-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-panel-accent/10 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <img src="/santara-mail-logo.png" alt="Santara Mail Logo" className="h-16 object-contain" />
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white">Santara Mail</h2>
        <p className="mt-1 text-center text-sm text-panel-ink-soft">
          Sistem Informasi Persuratan Digital Modern
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
              <label className="block text-xs font-semibold text-panel-ink-soft uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-panel-ink-soft">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Masukkan nama pengguna..."
                  className="block w-full pl-10 pr-3 py-2.5 bg-panel border border-panel-border rounded-xl text-panel-ink text-sm placeholder-panel-ink-soft focus:outline-none focus:ring-2 focus:ring-panel-primary focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-panel-ink-soft uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-panel-ink-soft">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                {isSubmitting ? "Memproses..." : "Masuk ke Aplikasi"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
