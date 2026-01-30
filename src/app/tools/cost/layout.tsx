import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import "./cafeops.css";

export default function CostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cafeops">
      <AppShell>{children}</AppShell>
    </div>
  );
}
