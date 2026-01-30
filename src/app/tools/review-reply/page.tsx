const focusAreas = [
  "별점별 톤 자동 전환",
  "업종별 문장 템플릿",
  "고객 감정 분석 기반 문구 추천",
];

export default function ReviewReplyPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Review Reply
        </p>
        <h1 className="font-display mt-4 text-4xl">리뷰답글생성기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          리뷰 응답 시간을 줄이고 브랜드 톤을 지키는 자동 답글 도구입니다.
          간단한 키워드만 넣으면 맞춤 답글을 생성합니다.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {focusAreas.map((item) => (
          <div
            key={item}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <p className="text-sm font-semibold text-black/60">중점 기능</p>
            <h3 className="font-display mt-4 text-xl">{item}</h3>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        원하는 톤(정중/친근/감사/사과 등)을 알려주면 기본 템플릿을 바로 설계할 수
        있습니다.
      </section>
    </div>
  );
}
