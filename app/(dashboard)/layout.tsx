"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 print:bg-white print:p-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 sm:pb-32 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
