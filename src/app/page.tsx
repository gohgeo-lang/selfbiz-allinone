import Link from "next/link";

const tools = [
  {
    title: "원가계산기",
    description: "재료비, 고정비, 마진까지 한 번에 계산.",
    href: "/tools/cost",
  },
  {
    title: "리뷰답글생성기",
    description: "톤앤매너에 맞는 답글을 빠르게 자동 작성.",
    href: "/tools/review-reply",
  },
  {
    title: "인건비계산기",
    description: "시급, 주휴, 연장까지 실시간 인건비 추적.",
    href: "/tools/labor",
  },
  {
    title: "근무표생성기",
    description: "직원 스케줄을 자동 구성하고 충돌을 줄이기.",
    href: "/tools/schedule",
  },
];

const highlights = [
  {
    title: "통합 운영",
    body: "툴을 흩어놓지 말고 한 계정 안에서 연결해 운영하세요.",
  },
  {
    title: "실전 최적화",
    body: "자영업자 워크플로에 맞춘 계산 로직과 입력 방식.",
  },
  {
    title: "꾸준한 확장",
    body: "필요한 도구를 계속 추가해도 구조는 흔들리지 않게.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-20">
      <section className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white/70 px-8 py-14 md:px-12">
        <div className="absolute -right-10 top-10 h-56 w-56 rounded-full border border-black/5 bg-[radial-gradient(circle_at_center,rgba(255,122,61,0.25),transparent_65%)] blur-2xl" />
        <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full border border-black/5 bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.2),transparent_70%)] blur-2xl" />
        <div className="relative z-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
            SelfBiz Tool Suite
          </p>
          <h1 className="font-display text-4xl leading-tight md:text-6xl">
            자영업자의 하루를
            <span className="block text-[var(--accent-strong)]">
              빠르게 자동화하는 올인원
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--muted)]">
            원가, 인건비, 리뷰답글, 근무표까지 한 화면에서 연결하세요.
            필요한 도구를 계속 추가해도 흐름이 깨지지 않는 통합 플랫폼을 만듭니다.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/tools/cost"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(255,122,61,0.35)] transition hover:-translate-y-0.5"
            >
              원가계산기 시작하기
            </Link>
            <Link
              href="/tools/review-reply"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-black/80 transition hover:border-black/30"
            >
              리뷰답글 흐름 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <h3 className="font-display text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        {tools.map((tool, index) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 p-7 transition hover:-translate-y-1"
            style={{ animation: `fadeUp 0.6s ease ${index * 0.08}s both` }}
          >
            <div className="absolute right-6 top-6 h-12 w-12 rounded-full border border-black/10 bg-[var(--surface-strong)]" />
            <h3 className="font-display text-2xl font-semibold">
              {tool.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {tool.description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-black">
              상세 보기
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/10 transition group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-10 rounded-[32px] border border-black/5 bg-[var(--surface)] p-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-3xl">확장 가능한 통합 운영 시스템</h2>
          <p className="mt-4 text-[var(--muted)]">
            자영업자에게 필요한 도구를 계속 붙여도 흔들리지 않는 구조를 설계합니다.
            모듈형으로 추가되는 계산기와 생성기를 통해 하나의 흐름으로 연결합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {[
              "데이터 공유",
              "통합 대시보드",
              "브랜드 톤 유지",
              "자동 기록",
              "빠른 입력",
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-black/10 bg-[var(--surface-strong)] px-4 py-2"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex min-h-[220px] flex-col justify-between rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/40">
            Next Step
          </p>
          <div className="space-y-3">
            <p className="font-display text-2xl">지금부터 필요한 기능을 추가하세요.</p>
            <p className="text-sm text-[var(--muted)]">
              새 도구를 붙일 때마다 전체 흐름이 더 강해집니다.
            </p>
          </div>
          <Link
            href="/tools/schedule"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
          >
            근무표생성기 살펴보기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
