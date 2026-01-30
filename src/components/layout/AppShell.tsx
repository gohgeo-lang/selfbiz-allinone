"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="lg:grid lg:grid-cols-[260px_1fr]">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="px-4 pb-16 pt-6 lg:px-10 lg:pt-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
