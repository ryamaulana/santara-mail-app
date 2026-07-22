"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { useSipedigStore } from "@/store/useSipedigStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fetchProfil = useSipedigStore((state) => state.fetchProfil);
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    fetchProfil();
  }, [fetchProfil]);

  useEffect(() => {
    if (!isLoading && user?.mustChangePassword) {
      router.push("/change-password");
    }
  }, [isLoading, user, router]);

  if (user?.mustChangePassword) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background text-ink overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 bg-background print:bg-white print:p-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-32 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
