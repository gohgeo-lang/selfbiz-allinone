const steps = [
  "재료/원부재료 단가 입력",
  "고정비 및 변동비 자동 분배",
  "목표 마진 시뮬레이션",
];

export default function CostToolPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Cost Calculator
        </p>
        <h1 className="font-display mt-4 text-4xl">원가계산기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          메뉴별 원가와 마진을 빠르게 계산해 가격 책정을 돕습니다. 실시간으로
          조정하면서 손익 구조를 확인하세요.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((item) => (
          <div
            key={item}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <p className="text-sm font-semibold text-black/60">핵심 흐름</p>
            <h3 className="font-display mt-4 text-xl">{item}</h3>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        곧 입력 폼과 계산 로직을 연결할 예정입니다. 필요한 필드나 계산 방식이 있으면
        알려주세요.
      </section>
    </div>
  );
}
