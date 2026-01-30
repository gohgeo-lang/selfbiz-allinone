"use client";

import { useMemo, useState } from "react";

type AmountMode = "inclusive" | "exclusive";

type Period = "monthly" | "quarterly" | "yearly";

const formatKRW = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(Math.round(value));

const periodLabels: Record<Period, string> = {
  monthly: "월 기준",
  quarterly: "분기 기준",
  yearly: "연 기준",
};

const periodMultiplier: Record<Period, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export default function TaxToolPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [vatRate, setVatRate] = useState(10);
  const [salesAmount, setSalesAmount] = useState(5000000);
  const [salesMode, setSalesMode] = useState<AmountMode>("inclusive");
  const [purchaseAmount, setPurchaseAmount] = useState(2000000);
  const [purchaseMode, setPurchaseMode] = useState<AmountMode>("inclusive");
  const [laborCost, setLaborCost] = useState(1200000);
  const [otherCost, setOtherCost] = useState(300000);
  const [assumedTaxRate, setAssumedTaxRate] = useState(8);

  const result = useMemo(() => {
    const rate = Math.max(0, vatRate) / 100;
    const multiplier = periodMultiplier[period];

    const toSupply = (amount: number, mode: AmountMode) =>
      mode === "inclusive" ? amount / (1 + rate) : amount;

    const toVat = (amount: number, mode: AmountMode) =>
      mode === "inclusive" ? amount - amount / (1 + rate) : amount * rate;

    const salesSupply = toSupply(salesAmount, salesMode);
    const salesVat = toVat(salesAmount, salesMode);
    const purchaseSupply = toSupply(purchaseAmount, purchaseMode);
    const purchaseVat = toVat(purchaseAmount, purchaseMode);

    const vatPayable = salesVat - purchaseVat;
    const profitEstimate =
      salesSupply - purchaseSupply - laborCost - otherCost;
    const assumedTax = profitEstimate * (Math.max(0, assumedTaxRate) / 100);

    return {
      multiplier,
      salesSupply,
      salesVat,
      purchaseSupply,
      purchaseVat,
      vatPayable,
      profitEstimate,
      assumedTax,
      totalSales: salesAmount,
      totalPurchase: purchaseAmount,
    };
  }, [
    period,
    vatRate,
    salesAmount,
    salesMode,
    purchaseAmount,
    purchaseMode,
    laborCost,
    otherCost,
    assumedTaxRate,
  ]);

  const scaled = {
    salesSupply: result.salesSupply * result.multiplier,
    salesVat: result.salesVat * result.multiplier,
    purchaseSupply: result.purchaseSupply * result.multiplier,
    purchaseVat: result.purchaseVat * result.multiplier,
    vatPayable: result.vatPayable * result.multiplier,
    profitEstimate: result.profitEstimate * result.multiplier,
    assumedTax: result.assumedTax * result.multiplier,
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Tax & VAT
        </p>
        <h1 className="font-display mt-4 text-4xl">세금/부가세 간편 계산기</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted)]">
          매출/매입 입력만으로 부가세 예상액과 간단 손익을 확인합니다. 실제 신고는
          업종·과세 유형에 따라 달라질 수 있으니 참고용으로 활용하세요.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">입력</h2>
          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              계산 기준
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              >
                <option value="monthly">월 기준</option>
                <option value="quarterly">분기 기준</option>
                <option value="yearly">연 기준</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              부가세율 (%)
              <input
                type="number"
                min={0}
                step={0.1}
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                매출 금액
                <input
                  type="number"
                  min={0}
                  value={salesAmount}
                  onChange={(e) => setSalesAmount(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                매출 입력 방식
                <select
                  value={salesMode}
                  onChange={(e) => setSalesMode(e.target.value as AmountMode)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                >
                  <option value="inclusive">부가세 포함</option>
                  <option value="exclusive">부가세 별도(공급가)</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                매입/경비 금액
                <input
                  type="number"
                  min={0}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                매입 입력 방식
                <select
                  value={purchaseMode}
                  onChange={(e) => setPurchaseMode(e.target.value as AmountMode)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                >
                  <option value="inclusive">부가세 포함</option>
                  <option value="exclusive">부가세 별도(공급가)</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                인건비 (세전)
                <input
                  type="number"
                  min={0}
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
                기타 고정비/비용
                <input
                  type="number"
                  min={0}
                  value={otherCost}
                  onChange={(e) => setOtherCost(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-black/70">
              가정 세율 (%)
              <input
                type="number"
                min={0}
                step={0.1}
                value={assumedTaxRate}
                onChange={(e) => setAssumedTaxRate(Number(e.target.value))}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
              />
              <span className="text-xs text-black/40">
                소득세/법인세는 실제 과세 기준에 따라 달라집니다. 입력한 세율로
                단순 추정합니다.
              </span>
            </label>
          </div>
        </div>

        <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-xl">결과 · {periodLabels[period]}</h2>
          <div className="mt-6 grid gap-4 text-sm text-black/70">
            <div className="flex items-center justify-between">
              <span>매출 공급가</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.salesSupply)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>매출 부가세</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.salesVat)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>매입 공급가</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.purchaseSupply)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>매입 부가세</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.purchaseVat)}원
              </span>
            </div>
            <div className="h-px bg-black/10" />
            <div className="flex items-center justify-between">
              <span>부가세 납부/환급</span>
              <span className="font-semibold text-black">
                {scaled.vatPayable >= 0 ? "납부" : "환급"} ·
                {formatKRW(Math.abs(scaled.vatPayable))}원
              </span>
            </div>
            <div className="h-px bg-black/10" />
            <div className="flex items-center justify-between">
              <span>추정 영업이익</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.profitEstimate)}원
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>예상 세금(가정)</span>
              <span className="font-semibold text-black">
                {formatKRW(scaled.assumedTax)}원
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
            <p className="font-semibold text-black/70">빠른 체크</p>
            <p className="mt-2">
              매출 {formatKRW(result.totalSales)}원, 매입 {formatKRW(result.totalPurchase)}원
              기준 계산입니다. {periodLabels[period]}으로 환산됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-[var(--surface-strong)] p-6 text-sm text-[var(--muted)]">
        간편 계산기 기준으로 산출된 값입니다. 간이과세/일반과세, 업종별 공제, 세액
        공제/감면 등은 반영되지 않습니다.
      </section>
    </div>
  );
}
