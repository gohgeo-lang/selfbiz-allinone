"use client";

import { useMemo, useState } from "react";

type PriceCandidate = {
  id: string;
  price: number;
};

type PsychLabel = {
  label: string;
  score: number;
  note: string;
};

const formatKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

const createCandidate = (index: number, price: number): PriceCandidate => ({
  id: `price-${Date.now()}-${index}`,
  price,
});

const analyzePsych = (price: number): PsychLabel[] => {
  const labels: PsychLabel[] = [];
  const lastDigit = price % 10;
  const lastTwo = price % 100;
  const lastThree = price % 1000;

  if (lastTwo === 90 || lastTwo === 99) {
    labels.push({
      label: "엔딩 9",
      score: 2,
      note: "심리적 저가 인식",
    });
  } else if (lastTwo === 0) {
    labels.push({
      label: "라운드",
      score: 1,
      note: "깔끔·프리미엄 인식",
    });
  }

  if (lastThree === 0) {
    labels.push({
      label: "천단위 라운드",
      score: 1,
      note: "단순·명확",
    });
  }

  if (lastDigit === 0 || lastDigit === 5) {
    labels.push({
      label: "끝자리 안정",
      score: 1,
      note: "선택 부담 감소",
    });
  }

  if (price >= 10000 && price % 100 === 0) {
    labels.push({
      label: "프리미엄 구간",
      score: 2,
      note: "고급 인식 강화",
    });
  }

  return labels.length > 0
    ? labels
    : [{ label: "중립", score: 0, note: "특별한 심리 신호 없음" }];
};

export default function PricePsychToolPage() {
  const [cost, setCost] = useState(2500);
  const [targetMargin, setTargetMargin] = useState(65);
  const [candidates, setCandidates] = useState<PriceCandidate[]>([
    createCandidate(0, 5900),
    createCandidate(1, 6500),
    createCandidate(2, 6900),
  ]);

  const analysis = useMemo(() => {
    return candidates.map((item) => {
      const price = Math.max(0, item.price);
      const profit = price - cost;
      const margin = price > 0 ? (profit / price) * 100 : 0;
      const psychLabels = analyzePsych(price);
      const psychScore = psychLabels.reduce((sum, label) => sum + label.score, 0);
      const marginScore = 100 - Math.abs(targetMargin - margin);
      const totalScore = marginScore + psychScore * 5;
      return {
        ...item,
        price,
        profit,
        margin,
        psychLabels,
        totalScore,
      };
    });
  }, [candidates, cost, targetMargin]);

  const ranked = useMemo(() => {
    return [...analysis].sort((a, b) => b.totalScore - a.totalScore);
  }, [analysis]);

  const updateCandidate = (id: string, price: number) => {
    setCandidates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  };

  const addCandidate = () => {
    setCandidates((prev) => [...prev, createCandidate(prev.length, 0)]);
  };

  const removeCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Price Psychology
        </p>
        <h1 className="font-display mt-4 text-4xl">가격 심리 테스트 툴</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          후보 가격을 입력하면 마진과 심리 신호를 함께 비교합니다. 추천 순위는
          목표 마진과 심리 점수를 합산한 간단 지표입니다.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">입력</h2>
          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              원가 (1개 기준)
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              목표 마진율 (%)
              <input
                type="number"
                min={0}
                max={100}
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>
            <div className="grid gap-3">
              <p className="text-sm font-semibold text-black/60">가격 후보</p>
              {candidates.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3"
                >
                  <span className="text-xs font-semibold text-black/40">
                    #{index + 1}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateCandidate(item.id, Number(e.target.value))}
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeCandidate(item.id)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                    disabled={candidates.length <= 2}
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCandidate}
                className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
              >
                후보 추가
              </button>
            </div>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">추천 순위</h2>
          <div className="mt-6 grid gap-4">
            {ranked.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-black/40">
                      #{idx + 1} 추천
                    </p>
                    <p className="text-lg font-semibold text-black">
                      {formatKRW(item.price)}원
                    </p>
                  </div>
                  <div className="text-right text-xs text-black/50">
                    <p>마진율 {item.margin.toFixed(1)}%</p>
                    <p>순익 {formatKRW(item.profit)}원</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.psychLabels.map((label) => (
                    <span
                      key={label.label}
                      className="rounded-full border border-black/10 px-3 py-1 text-[11px] text-black/60"
                    >
                      {label.label} · {label.note}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="font-display text-xl">후보별 비교</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/50">
                <th className="px-3 py-2">가격</th>
                <th className="px-3 py-2">마진율</th>
                <th className="px-3 py-2">순익</th>
                <th className="px-3 py-2">심리 포인트</th>
              </tr>
            </thead>
            <tbody>
              {analysis.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="px-3 py-2 font-semibold text-black/70">
                    {formatKRW(item.price)}원
                  </td>
                  <td className="px-3 py-2 text-black/60">
                    {item.margin.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-black/60">
                    {formatKRW(item.profit)}원
                  </td>
                  <td className="px-3 py-2 text-black/60">
                    {item.psychLabels.map((label) => label.label).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        이 도구는 심리 가격대(끝자리 9, 라운드 가격 등)를 참고하여 추천하는 간단 분석입니다.
        실제 매장/브랜드 포지셔닝에 따라 다른 전략을 적용하세요.
      </section>
    </div>
  );
}
