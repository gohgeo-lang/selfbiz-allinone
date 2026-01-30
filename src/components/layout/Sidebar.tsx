"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const basePath = "/tools/cost";
const navItems = [
  { label: "대시보드", href: `${basePath}/dashboard` },
  { label: "재료 관리", href: `${basePath}/ingredients` },
  { label: "메뉴 관리", href: `${basePath}/menus` },
  { label: "고정비 관리", href: `${basePath}/overheads` },
  { label: "바로가기", href: `${basePath}/links` },
  { label: "시뮬레이션", href: `${basePath}/simulations` },
  { label: "설정", href: `${basePath}/settings` },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) onClose();
  }, [pathname]);

  return (
    <>
      <div
        className={`no-print fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`no-print fixed left-0 top-0 z-40 h-full w-64 border-r border-[var(--line)] bg-[var(--card)] p-6 transition-transform lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="font-display text-lg">Menu</span>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--accent)] text-white shadow"
                    : "text-ink-muted hover:bg-[rgba(212,106,31,0.12)] hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-10 rounded-2xl border border-[var(--line)] bg-white/70 p-4 text-xs text-ink-muted">
          <p className="font-semibold text-ink">사용 팁</p>
          <p className="mt-2">재료 단가 입력 후 메뉴 레시피를 저장하면 자동으로 수익 계산이 완료됩니다.</p>
        </div>
      </aside>
    </>
  );
}
