const useCases = [
  "직원 가용 시간 입력",
  "교대 근무 자동 배치",
  "근무표 공유 및 출력",
];

export default function ScheduleToolPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Schedule Builder
        </p>
        <h1 className="font-display mt-4 text-4xl">근무표생성기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          주간 근무표를 자동으로 생성하고 팀과 공유합니다. 인건비와 연동해 효율적인
          배치를 고민할 수 있습니다.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {useCases.map((item) => (
          <div
            key={item}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <p className="text-sm font-semibold text-black/60">활용 시나리오</p>
            <h3 className="font-display mt-4 text-xl">{item}</h3>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        어떤 주기(주간/월간)로 만들고 싶은지 알려주시면 화면 구조를 맞춰볼게요.
      </section>
    </div>
  );
}
