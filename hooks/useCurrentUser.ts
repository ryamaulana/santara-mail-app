"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: "SUPER_ADMIN" | "USER";
  isActive: boolean;
};

export function useCurrentUser() {
  const query = useQuery<CurrentUser>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAdmin: query.data?.role === "SUPER_ADMIN",
  };
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.push("/login");
  };
}
