import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "자영업자 올인원",
  description: "원가, 인건비, 리뷰답글, 근무표까지 한 곳에서 관리하는 통합 도구.",
};

const navItems = [
  { href: "/tools/cost", label: "원가계산기" },
  { href: "/tools/review-reply", label: "리뷰답글생성기" },
  { href: "/tools/labor", label: "인건비계산기" },
  { href: "/tools/schedule", label: "근무표생성기" },
  { href: "/tools/tax", label: "세금/부가세" },
  { href: "/tools/price-psych", label: "가격심리" },
  { href: "/tools/retention", label: "리텐션플랜" },
  { href: "/tools/store-diagnosis", label: "매장진단하기" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${spaceGrotesk.variable} ${manrope.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <div className="relative min-h-screen">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,196,0,0.35),transparent_70%)] blur-2xl" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.25),transparent_70%)] blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,128,128,0.25),transparent_70%)] blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_55%)]" />
          </div>

          <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="font-display text-xl font-semibold tracking-tight">
                자영업자 올인원
              </Link>
              <nav className="flex w-full flex-wrap gap-3 text-sm font-medium text-black/70 md:w-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-black/10 bg-white/70 px-4 py-2 transition hover:border-black/30 hover:text-black"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
