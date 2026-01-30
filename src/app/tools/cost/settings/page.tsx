"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { seedIngredients, seedMenus } from "@/lib/seed";
import { safeParse } from "@/lib/storage";
import { Ingredient, Menu, Overhead, Settings } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

const DEFAULT_SETTINGS: Settings = {
  targetMarginPercent: 65,
  roundingUnit: 100,
  monthlySalesVolume: 1000,
  includeOverheadInCost: true,
  categorySalesMixPercent: {
    drink: 25,
    dessert: 25,
    food: 25,
    etc: 25,
  },
  categoryOverheadMixPercent: {
    drink: 25,
    dessert: 25,
    food: 25,
    etc: 25,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useLocalStorageState<Settings>(
    "cafeops.settings",
    DEFAULT_SETTINGS
  );
  const [ingredients, setIngredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus, setMenus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads, setOverheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);

  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const [targetMargin, setTargetMargin] = useState(String(mergedSettings.targetMarginPercent));
  const [roundingUnit, setRoundingUnit] = useState(String(mergedSettings.roundingUnit));
  const [monthlySales, setMonthlySales] = useState(String(mergedSettings.monthlySalesVolume));
  const [includeOverhead, setIncludeOverhead] = useState(
    mergedSettings.includeOverheadInCost ? "yes" : "no"
  );
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setTargetMargin(String(mergedSettings.targetMarginPercent));
    setRoundingUnit(String(mergedSettings.roundingUnit));
    setMonthlySales(String(mergedSettings.monthlySalesVolume));
    setIncludeOverhead(mergedSettings.includeOverheadInCost ? "yes" : "no");
  }, [
    mergedSettings.targetMarginPercent,
    mergedSettings.roundingUnit,
    mergedSettings.monthlySalesVolume,
    mergedSettings.includeOverheadInCost,
  ]);

  const handleSave = () => {
    const marginValue = safeParse(targetMargin);
    if (marginValue < 0 || marginValue > 90) {
      return setError("목표 마진율은 0~90 사이여야 합니다.");
    }
    const monthlySalesValue = safeParse(monthlySales);
    if (monthlySalesValue < 0) {
      return setError("월 예상 판매잔수는 0 이상이어야 합니다.");
    }
    setSettings({
      targetMarginPercent: marginValue,
      roundingUnit: roundingUnit === "10" ? 10 : 100,
      monthlySalesVolume: monthlySalesValue,
      includeOverheadInCost: includeOverhead === "yes",
    });
    setError(null);
    toast("설정이 저장되었습니다.");
  };

  const handleSeed = () => {
    setIngredients(seedIngredients());
    setMenus(seedMenus());
    setOverheads([
      {
        id: "oh-facility",
        name: "공간비 (임대)",
        category: "facility",
        facilityType: "lease",
        amount: 1500000,
        createdAt: Date.now(),
      },
      { id: "oh-labor", name: "인건비", category: "labor", amount: 2500000, createdAt: Date.now() },
      { id: "oh-utilities", name: "공과금", category: "utilities", amount: 300000, createdAt: Date.now() },
      {
        id: "oh-machine",
        name: "에스프레소 머신",
        category: "depreciation",
        amount: 500000,
        calcMethod: "depreciation",
        purchasePrice: 18000000,
        salvageValue: 0,
        usefulMonths: 36,
        createdAt: Date.now(),
      },
    ]);
    toast("샘플 데이터가 채워졌습니다.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Cost Settings
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">설정</h1>
          <p className="mt-2 text-sm text-slate-500">
            목표 마진, 고정비 포함 여부 등 원가 계산 기준을 설정합니다.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>수익 목표</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">목표 마진율 (%)</label>
              <Input
                type="number"
                min="0"
                max="90"
                value={targetMargin}
                onChange={(event) => setTargetMargin(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">반올림 단위</label>
              <Select value={roundingUnit} onChange={(event) => setRoundingUnit(event.target.value)}>
                <option value="10">10원</option>
                <option value="100">100원</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">월 예상 판매잔수</label>
              <Input
                type="number"
                min="0"
                value={monthlySales}
                onChange={(event) => setMonthlySales(event.target.value)}
                placeholder="예: 1000"
              />
              <p className="text-xs text-ink-muted">
                고정비를 메뉴당 비용으로 나누는 기준입니다. 예상 판매량이 낮을수록 원가가 높게 계산됩니다.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">원가 계산 방식</label>
              <Select value={includeOverhead} onChange={(event) => setIncludeOverhead(event.target.value)}>
                <option value="yes">재료 + 고정비 포함</option>
                <option value="no">재료 원가만</option>
              </Select>
              <p className="text-xs text-ink-muted">
                메뉴 원가 표시에 고정비를 포함할지 선택합니다.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave}>설정 저장</Button>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>샘플 데이터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-ink-muted">
          <p>테스트용 재료와 메뉴 데이터를 즉시 생성합니다.</p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSeed}>
              샘플 데이터 채우기
            </Button>
            <span>
              현재 재료 {ingredients.length}개 · 메뉴 {menus.length}개 · 고정비 {overheads.length}개
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
