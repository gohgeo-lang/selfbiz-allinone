const modules = [
  "시급/월급 자동 계산",
  "주휴수당 및 연장수당 반영",
  "직원별 비용 리포트",
];

export default function LaborToolPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Labor Cost
        </p>
        <h1 className="font-display mt-4 text-4xl">인건비계산기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          근무 시간과 급여 구조를 입력하면 자동으로 인건비를 산정합니다. 예산
          계획과 비용 관리에 활용할 수 있습니다.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {modules.map((item) => (
          <div
            key={item}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <p className="text-sm font-semibold text-black/60">핵심 모듈</p>
            <h3 className="font-display mt-4 text-xl">{item}</h3>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        원하는 계산 규칙(시급 기준, 휴게시간 처리 등)을 알려주면 우선 반영합니다.
      </section>
    </div>
  );
}
