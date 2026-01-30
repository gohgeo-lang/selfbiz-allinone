"use client";

import { useMemo, useState } from "react";

type PlanCard = {
  title: string;
  subtitle: string;
  steps: string[];
  costPerVisit: number;
  notes: string[];
};

const formatKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

export default function RetentionToolPage() {
  const [avgOrderValue, setAvgOrderValue] = useState(8500);
  const [grossMargin, setGrossMargin] = useState(60);
  const [targetReturnRate, setTargetReturnRate] = useState(25);
  const [couponDiscount, setCouponDiscount] = useState(1000);
  const [stampCount, setStampCount] = useState(8);
  const [stampRewardValue, setStampRewardValue] = useState(4500);
  const [membershipFee, setMembershipFee] = useState(9900);
  const [membershipBenefit, setMembershipBenefit] = useState(10);

  const plans = useMemo(() => {
    const marginRate = Math.max(0, Math.min(grossMargin, 100)) / 100;
    const avgProfit = avgOrderValue * marginRate;
    const returnRate = Math.max(0, Math.min(targetReturnRate, 100)) / 100;

    const couponCost = Math.max(0, couponDiscount);
    const couponCostPerVisit = couponCost * returnRate;

    const stampCostPerVisit =
      stampCount > 0 ? (stampRewardValue / stampCount) * returnRate : 0;

    const membershipBenefitValue =
      avgOrderValue * (Math.max(0, membershipBenefit) / 100);
    const membershipCostPerVisit = membershipBenefitValue * returnRate;

    const couponPlan: PlanCard = {
      title: "리뷰/재방문 쿠폰",
      subtitle: "간단하고 빠른 리텐션 플랜",
      steps: [
        "방문 후 3일 내 문자/DM 발송",
        `다음 방문 ${formatKRW(couponDiscount)}원 할인 제공`,
        "유효기간 14일 설정",
      ],
      costPerVisit: couponCostPerVisit,
      notes: [
        `예상 1회 방문당 비용: ${formatKRW(couponCostPerVisit)}원`,
        `평균 순이익 ${formatKRW(avgProfit)}원 기준 회수 가능성 확인`,
      ],
    };

    const stampPlan: PlanCard = {
      title: "스탬프 카드",
      subtitle: "꾸준한 방문 습관 만들기",
      steps: [
        `${stampCount}회 적립 시 보상 제공`,
        `보상가치 ${formatKRW(stampRewardValue)}원 설정`,
        "중간 보상(5회) 소소한 혜택 제공",
      ],
      costPerVisit: stampCostPerVisit,
      notes: [
        `예상 1회 방문당 비용: ${formatKRW(stampCostPerVisit)}원`,
        "장기 리텐션에 유리",
      ],
    };

    const membershipPlan: PlanCard = {
      title: "멤버십 구독",
      subtitle: "고정 수익 + VIP 혜택",
      steps: [
        `월 ${formatKRW(membershipFee)}원 멤버십`,
        `메뉴 ${membershipBenefit}% 할인 또는 전용 메뉴`,
        "멤버 전용 데이/예약 우선권 제공",
      ],
      costPerVisit: membershipCostPerVisit,
      notes: [
        `예상 1회 방문당 비용: ${formatKRW(membershipCostPerVisit)}원`,
        "고정 수익 창출 및 충성도 강화",
      ],
    };

    const breakeven = avgProfit > 0 ? couponCost / avgProfit : 0;

    return {
      cards: [couponPlan, stampPlan, membershipPlan],
      avgProfit,
      breakeven,
    };
  }, [
    avgOrderValue,
    grossMargin,
    targetReturnRate,
    couponDiscount,
    stampCount,
    stampRewardValue,
    membershipFee,
    membershipBenefit,
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Retention Plan
        </p>
        <h1 className="font-display mt-4 text-4xl">고객 리텐션 플랜 생성기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          평균 객단가와 마진을 기준으로 재방문 인센티브 비용을 비교합니다. 간단한
          시뮬레이션으로 쿠폰/스탬프/멤버십 전략을 설계하세요.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">입력</h2>
          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              평균 객단가 (원)
              <input
                type="number"
                min={0}
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              평균 마진율 (%)
              <input
                type="number"
                min={0}
                max={100}
                value={grossMargin}
                onChange={(e) => setGrossMargin(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              목표 재방문율 (%)
              <input
                type="number"
                min={0}
                max={100}
                value={targetReturnRate}
                onChange={(e) => setTargetReturnRate(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                쿠폰 할인 금액
                <input
                  type="number"
                  min={0}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                스탬프 횟수
                <input
                  type="number"
                  min={1}
                  value={stampCount}
                  onChange={(e) => setStampCount(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                스탬프 보상 가치
                <input
                  type="number"
                  min={0}
                  value={stampRewardValue}
                  onChange={(e) => setStampRewardValue(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                멤버십 월 요금
                <input
                  type="number"
                  min={0}
                  value={membershipFee}
                  onChange={(e) => setMembershipFee(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              멤버십 할인율 (%)
              <input
                type="number"
                min={0}
                max={100}
                value={membershipBenefit}
                onChange={(e) => setMembershipBenefit(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">핵심 지표</h2>
          <div className="mt-6 grid gap-4 text-sm text-black/70">
            <div className="flex items-center justify-between">
              <span>평균 순이익 (1회)</span>
              <span className="font-semibold text-black">
                {formatKRW(plans.avgProfit)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>쿠폰 손익분기 방문수</span>
              <span className="font-semibold text-black">
                {plans.breakeven.toFixed(1)}회
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
            <p className="font-semibold text-black/70">활용 팁</p>
            <p className="mt-2">
              평균 순이익 대비 쿠폰/보상 비용이 과도하면, 스탬프 횟수를 늘리거나
              멤버십 혜택을 분산해 부담을 줄이세요.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {plans.cards.map((card) => (
          <div
            key={card.title}
            className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
              {card.subtitle}
            </p>
            <h3 className="font-display mt-3 text-2xl">{card.title}</h3>
            <div className="mt-4 space-y-2 text-sm text-black/70">
              {card.steps.map((step) => (
                <div key={step} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/50" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-3 text-xs text-black/60">
              <p className="font-semibold text-black/70">비용 인사이트</p>
              {card.notes.map((note) => (
                <p key={note} className="mt-1">
                  {note}
                </p>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        이 플랜은 입력한 수치를 기반으로 한 시뮬레이션입니다. 실제 재방문율은
        매장 운영/고객층에 따라 달라질 수 있으므로 테스트 후 조정하세요.
      </section>
    </div>
  );
}
