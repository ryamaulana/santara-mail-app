"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, KeyRound, Power, Users as UsersIcon } from "lucide-react";
import Swal from "sweetalert2";

type AdminUser = {
  id: string;
  username: string;
  name: string;
  role: "SUPER_ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
};

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Gagal memuat daftar pengguna");
  return res.json();
}

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin, isLoading: isLoadingSession } = useCurrentUser();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "", name: "", role: "USER" as "USER" | "SUPER_ADMIN" });
  const [createError, setCreateError] = useState<string | null>(null);

  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: fetchUsers, enabled: isAdmin });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setIsCreateModalOpen(false);
      setCreateForm({ username: "", password: "", name: "", role: "USER" });
      setCreateError(null);
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Pengguna baru berhasil dibuat.", timer: 2000, showConfirmButton: false });
    },
    onError: (error: Error) => setCreateError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<Pick<AdminUser, "isActive">> & { password?: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui pengguna");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: Error) => {
      Swal.fire({ icon: "error", title: "Gagal", text: error.message });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate(createForm);
  };

  const handleToggleActive = (u: AdminUser) => {
    Swal.fire({
      title: u.isActive ? "Nonaktifkan pengguna ini?" : "Aktifkan kembali pengguna ini?",
      text: u.isActive
        ? `${u.name} tidak akan bisa masuk sampai diaktifkan lagi.`
        : `${u.name} akan bisa masuk kembali.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, lanjutkan",
      cancelButtonText: "Batal",
      confirmButtonColor: u.isActive ? "#dc2626" : "#0f6e56",
    }).then((result) => {
      if (result.isConfirmed) {
        updateMutation.mutate({ id: u.id, isActive: !u.isActive });
      }
    });
  };

  const handleResetPassword = async (u: AdminUser) => {
    const { value: password } = await Swal.fire({
      title: `Reset password untuk ${u.username}`,
      input: "password",
      inputLabel: "Password baru",
      inputPlaceholder: "Minimal 8 karakter",
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value || value.length < 8) return "Password minimal 8 karakter";
        return undefined;
      },
    });
    if (password) {
      updateMutation.mutate({ id: u.id, password } as any);
      Swal.fire({ icon: "success", title: "Password diperbarui", timer: 1500, showConfirmButton: false });
    }
  };

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

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center space-x-2 text-ink-soft">
          <UsersIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-bold text-ink text-base">Manajemen Pengguna</h3>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-3 bg-background border-b border-border text-xs text-ink-soft font-medium">
          <span>Total {users.length} pengguna</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background text-ink-soft font-bold text-xs uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {usersQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-soft">Memuat data...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-soft">Belum ada pengguna.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-ink">{u.username}</td>
                    <td className="px-6 py-4 font-semibold text-ink">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] text-ink-soft font-normal">(Anda)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === "SUPER_ADMIN" ? "primary" : "default"}>
                        {u.role === "SUPER_ADMIN" ? "Super Admin" : "User"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? "success" : "danger"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.id === currentUser?.id ? (
                        <div className="text-center text-[11px] text-ink-soft italic">Tidak tersedia untuk akun sendiri</div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 text-ink-soft hover:text-primary-600 hover:bg-primary-50 rounded"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="p-1.5 text-ink-soft hover:text-danger hover:bg-danger-bg rounded"
                            title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tambah Pengguna Baru">
        <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
          {createError && (
            <div className="p-3 bg-danger-bg border border-danger/30 rounded-lg text-danger font-semibold">
              {createError}
            </div>
          )}
          <div>
            <label className="block font-semibold text-ink-soft mb-1">Nama Lengkap</label>
            <input
              required
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink-soft mb-1">Username</label>
            <input
              required
              type="text"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink-soft mb-1">Password Awal</label>
            <input
              required
              minLength={8}
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-ink-soft mb-1">Role</label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as "USER" | "SUPER_ADMIN" })}
              className="w-full p-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="USER">User</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="pt-4 border-t border-border flex justify-end space-x-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-background text-ink hover:opacity-80 rounded-lg font-semibold text-xs">
              Batal
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold text-xs transition disabled:opacity-60">
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
