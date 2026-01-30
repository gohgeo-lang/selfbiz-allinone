"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calcMarginPercent, calcMenuCost, calcOverheadPerMenu, formatKRW } from "@/lib/calc";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient, Menu, MenuCategory, Overhead, Settings, SimulationScenario } from "@/lib/types";
import { safeParse } from "@/lib/storage";
import { useToast } from "@/components/ui/toast";
import { MENU_CATEGORY_LABELS } from "@/lib/menus";

const DEFAULT_SETTINGS: Settings = {
  targetMarginPercent: 65,
  roundingUnit: 100,
  monthlySalesVolume: 1000,
  includeOverheadInCost: true,
  categorySalesMixPercent: { drink: 25, dessert: 25, food: 25, etc: 25 },
  categoryOverheadMixPercent: { drink: 25, dessert: 25, food: 25, etc: 25 },
};

export default function SimulationsPage() {
  const [ingredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [settings] = useLocalStorageState<Settings>("cafeops.settings", DEFAULT_SETTINGS);
  const [scenarios, setScenarios] = useLocalStorageState<SimulationScenario[]>(
    "cafeops.simulations",
    []
  );
  const [salesMix, setSalesMix] = useState<Record<MenuCategory, string>>(
    (Object.keys(DEFAULT_SETTINGS.categorySalesMixPercent) as MenuCategory[]).reduce(
      (acc, key) => {
        acc[key] = String(DEFAULT_SETTINGS.categorySalesMixPercent[key] ?? 0);
        return acc;
      },
      {} as Record<MenuCategory, string>
    )
  );
  const [overheadMix, setOverheadMix] = useState<Record<MenuCategory, string>>(
    (Object.keys(DEFAULT_SETTINGS.categoryOverheadMixPercent) as MenuCategory[]).reduce(
      (acc, key) => {
        acc[key] = String(DEFAULT_SETTINGS.categoryOverheadMixPercent[key] ?? 0);
        return acc;
      },
      {} as Record<MenuCategory, string>
    )
  );
  const [salesMixMode, setSalesMixMode] = useState<"percent" | "count">("percent");
  const [overheadMixMode, setOverheadMixMode] = useState<"percent" | "count">("percent");
  const [name, setName] = useState("");
  const [monthlySalesVolume, setMonthlySalesVolume] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [wastePercent, setWastePercent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();

  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

  useEffect(() => {
    setSalesMix(
      (Object.keys(mergedSettings.categorySalesMixPercent) as MenuCategory[]).reduce(
        (acc, key) => {
          acc[key] = String(mergedSettings.categorySalesMixPercent[key] ?? 0);
          return acc;
        },
        {} as Record<MenuCategory, string>
      )
    );
    setOverheadMix(
      (Object.keys(mergedSettings.categoryOverheadMixPercent) as MenuCategory[]).reduce(
        (acc, key) => {
          acc[key] = String(mergedSettings.categoryOverheadMixPercent[key] ?? 0);
          return acc;
        },
        {} as Record<MenuCategory, string>
      )
    );
  }, [mergedSettings.categorySalesMixPercent, mergedSettings.categoryOverheadMixPercent]);

  const avgIngredientCost = useMemo(() => {
    if (menus.length === 0) return 0;
    const total = menus.reduce((sum, menu) => sum + calcMenuCost(menu, ingredients), 0);
    return total / menus.length;
  }, [menus, ingredients]);

  const buildMetrics = (volume: number, revenue: number, wasteRate: number) => {
    if (volume <= 0 || revenue <= 0) {
      return {
        averagePrice: 0,
        overheadPerMenu: 0,
        averageCost: 0,
        averageCostWithOverhead: 0,
        margin: 0,
        monthlyProfit: 0,
        marginWithOverhead: 0,
        monthlyProfitWithOverhead: 0,
      };
    }

    const wasteMultiplier = 1 + wasteRate / 100;
    const averagePrice = revenue / volume;
    const overheadPerMenu = calcOverheadPerMenu(overheads, volume);
    const averageCostWithOverhead = avgIngredientCost * wasteMultiplier + overheadPerMenu;
    const averageCost =
      avgIngredientCost * wasteMultiplier +
      (mergedSettings.includeOverheadInCost ? overheadPerMenu : 0);
    const netProfit = averagePrice - averageCost;
    const margin = calcMarginPercent(averagePrice, netProfit);
    const monthlyProfit = netProfit * volume;
    const netProfitWithOverhead = averagePrice - averageCostWithOverhead;
    const marginWithOverhead = calcMarginPercent(averagePrice, netProfitWithOverhead);
    const monthlyProfitWithOverhead = netProfitWithOverhead * volume;

    return {
      averagePrice,
      overheadPerMenu,
      averageCost,
      averageCostWithOverhead,
      margin,
      monthlyProfit,
      marginWithOverhead,
      monthlyProfitWithOverhead,
    };
  };

  const previewMetrics = buildMetrics(
    safeParse(monthlySalesVolume),
    safeParse(monthlyRevenue),
    safeParse(wastePercent)
  );
  const salesMixTotal = (Object.keys(salesMix) as MenuCategory[]).reduce(
    (sum, key) => sum + safeParse(salesMix[key]),
    0
  );
  const overheadMixTotal = (Object.keys(overheadMix) as MenuCategory[]).reduce(
    (sum, key) => sum + safeParse(overheadMix[key]),
    0
  );
  const mixReady =
    (salesMixMode === "percent" ? Math.round(salesMixTotal) === 100 : salesMixTotal > 0) &&
    (overheadMixMode === "percent" ? Math.round(overheadMixTotal) === 100 : overheadMixTotal > 0);
  const scenarioReady =
    Boolean(name.trim()) &&
    safeParse(monthlySalesVolume) > 0 &&
    safeParse(monthlyRevenue) > 0 &&
    mixReady;

  const handleAdd = () => {
    const volume = safeParse(monthlySalesVolume);
    const revenue = safeParse(monthlyRevenue);
    if (!name.trim()) return setError("시나리오 이름을 입력하세요.");
    if (volume <= 0) return setError("월 예상 판매잔수는 1 이상이어야 합니다.");
    if (revenue <= 0) return setError("월 예상 매출은 1 이상이어야 합니다.");
    if (!mixReady) {
      return setError(
        salesMixMode === "percent" || overheadMixMode === "percent"
          ? "카테고리 배분 합계를 100%로 맞춰주세요."
          : "카테고리 배분 합계를 1 이상으로 입력하세요."
      );
    }
    const wasteRate = safeParse(wastePercent);
    if (wasteRate < 0 || wasteRate > 100) {
      return setError("폐기/손실율은 0~100 사이여야 합니다.");
    }

    const salesMixPercent =
      salesMixMode === "percent"
        ? (Object.keys(salesMix) as MenuCategory[]).reduce((acc, key) => {
            acc[key] = safeParse(salesMix[key]);
            return acc;
          }, {} as Record<MenuCategory, number>)
        : (Object.keys(salesMix) as MenuCategory[]).reduce((acc, key) => {
            acc[key] = salesMixTotal > 0 ? (safeParse(salesMix[key]) / salesMixTotal) * 100 : 0;
            return acc;
          }, {} as Record<MenuCategory, number>);

    const overheadMixPercent =
      overheadMixMode === "percent"
        ? (Object.keys(overheadMix) as MenuCategory[]).reduce((acc, key) => {
            acc[key] = safeParse(overheadMix[key]);
            return acc;
          }, {} as Record<MenuCategory, number>)
        : (Object.keys(overheadMix) as MenuCategory[]).reduce((acc, key) => {
            acc[key] =
              overheadMixTotal > 0 ? (safeParse(overheadMix[key]) / overheadMixTotal) * 100 : 0;
            return acc;
          }, {} as Record<MenuCategory, number>);

    const nextScenario: SimulationScenario = {
      id: `sim-${Date.now()}`,
      name: name.trim(),
      monthlySalesVolume: volume,
      monthlyRevenue: revenue,
      wastePercent: wasteRate,
      createdAt: Date.now(),
    };

    setSettings({
      ...mergedSettings,
      categorySalesMixPercent: salesMixPercent,
      categoryOverheadMixPercent: overheadMixPercent,
    });
    setScenarios((prev) => [nextScenario, ...prev]);
    setName("");
    setMonthlySalesVolume("");
    setMonthlyRevenue("");
    setWastePercent("");
    setError(null);
    toast("시나리오가 추가되었습니다.");
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setScenarios((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    toast("시나리오가 삭제되었습니다.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Scenario Planner
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">시뮬레이션</h1>
            <p className="mt-2 text-sm text-slate-500">
              판매량/가격/손실률에 따른 예상 마진을 시나리오로 비교합니다.
            </p>
          </div>
          <Badge variant="outline">
            원가 기준: {mergedSettings.includeOverheadInCost ? "재료+고정비" : "재료만"}
          </Badge>
        </div>
      </section>

      {menus.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-ink-muted">
            메뉴가 없어 평균 재료 원가를 계산할 수 없습니다. 메뉴를 먼저 등록해주세요.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>시뮬레이션 조건</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-ink">카테고리 배분 기준</p>
            <p className="text-xs text-ink-muted">
              시뮬레이션에서 사용할 카테고리별 판매/고정비 비중을 설정합니다.
            </p>
            <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink-muted">
                  예상 판매 비중 ({salesMixMode === "percent" ? "%" : "잔수"})
                </p>
                <Select
                  value={salesMixMode}
                  onChange={(event) => setSalesMixMode(event.target.value as "percent" | "count")}
                >
                  <option value="percent">비율(%)</option>
                  <option value="count">잔수(개)</option>
                </Select>
              </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {(Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]).map((key) => (
                <div key={`sales-${key}`} className="space-y-1">
                  <label className="text-xs text-ink-muted">{MENU_CATEGORY_LABELS[key]}</label>
                  <Input
                    type="number"
                    min="0"
                    max={salesMixMode === "percent" ? "100" : undefined}
                    value={salesMix[key]}
                    onChange={(event) =>
                      setSalesMix((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              합계{" "}
              {salesMixTotal}
              {salesMixMode === "percent" ? "%" : "잔"}
            </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-muted">
                고정비 배분 비중 ({overheadMixMode === "percent" ? "%" : "잔수"})
              </p>
              <Select
                value={overheadMixMode}
                onChange={(event) => setOverheadMixMode(event.target.value as "percent" | "count")}
              >
                <option value="percent">비율(%)</option>
                <option value="count">잔수(개)</option>
              </Select>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              {(Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]).map((key) => (
                <div key={`overhead-${key}`} className="space-y-1">
                  <label className="text-xs text-ink-muted">{MENU_CATEGORY_LABELS[key]}</label>
                  <Input
                    type="number"
                    min="0"
                    max={overheadMixMode === "percent" ? "100" : undefined}
                    value={overheadMix[key]}
                    onChange={(event) =>
                      setOverheadMix((prev) => ({ ...prev, [key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              합계{" "}
              {overheadMixTotal}
              {overheadMixMode === "percent" ? "%" : "잔"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">시나리오 이름</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">월 예상 판매잔수</label>
              <Input
                type="number"
                min="0"
                value={monthlySalesVolume}
                onChange={(event) => setMonthlySalesVolume(event.target.value)}
                placeholder="예: 3000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">월 예상 매출 (원)</label>
              <Input
                type="number"
                min="0"
                value={monthlyRevenue}
                onChange={(event) => setMonthlyRevenue(event.target.value)}
                placeholder="예: 13500000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">폐기/손실율 (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={wastePercent}
                onChange={(event) => setWastePercent(event.target.value)}
                placeholder="예: 3"
              />
            </div>
          </div>
          {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
              <p className="text-xs text-ink-muted">평균 판매가</p>
              <p className="font-semibold">{formatKRW(previewMetrics.averagePrice)}원</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
              <p className="text-xs text-ink-muted">메뉴당 고정비</p>
              <p className="font-semibold">{formatKRW(previewMetrics.overheadPerMenu)}원</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
              <p className="text-xs text-ink-muted">평균 원가</p>
              <p className="font-semibold">{formatKRW(previewMetrics.averageCost)}원</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
              <p className="text-xs text-ink-muted">예상 마진율</p>
              <p className="font-semibold">{previewMetrics.margin.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            예상 월 순수익:
            <span className="font-semibold text-ink">
              {formatKRW(previewMetrics.monthlyProfit)}원
            </span>
          </div>
          {!mergedSettings.includeOverheadInCost && (
            <div className="text-xs text-ink-muted">
              고정비 포함 기준 · 평균 원가 {formatKRW(previewMetrics.averageCostWithOverhead)}원 ·
              마진율 {previewMetrics.marginWithOverhead.toFixed(1)}% · 월 순수익{" "}
              {formatKRW(previewMetrics.monthlyProfitWithOverhead)}원
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!scenarioReady}>
              시나리오 추가
            </Button>
            {!mixReady && (
              <span className="text-xs text-ink-muted">
                {salesMixMode === "percent" || overheadMixMode === "percent"
                  ? "배분 합계를 100%로 맞춰주세요."
                  : "배분 합계를 0 이상으로 입력하세요."}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시나리오 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-ink-muted">
              등록된 시나리오가 없습니다. 위에서 새 시나리오를 추가하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>월 매출</TableHead>
                  <TableHead>월 잔수</TableHead>
                  <TableHead>폐기율</TableHead>
                  <TableHead>평균 판매가</TableHead>
                  <TableHead>메뉴당 고정비</TableHead>
                  <TableHead>평균 원가</TableHead>
                  <TableHead>예상 순수익</TableHead>
                  <TableHead>마진율</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => {
                  const metrics = buildMetrics(
                    scenario.monthlySalesVolume,
                    scenario.monthlyRevenue,
                    scenario.wastePercent ?? 0
                  );
                  return (
                    <TableRow key={scenario.id}>
                      <TableCell className="font-semibold text-ink">{scenario.name}</TableCell>
                      <TableCell>{formatKRW(scenario.monthlyRevenue)}원</TableCell>
                      <TableCell>{scenario.monthlySalesVolume}잔</TableCell>
                      <TableCell>{scenario.wastePercent ?? 0}%</TableCell>
                      <TableCell>{formatKRW(metrics.averagePrice)}원</TableCell>
                      <TableCell>{formatKRW(metrics.overheadPerMenu)}원</TableCell>
                      <TableCell>{formatKRW(metrics.averageCost)}원</TableCell>
                      <TableCell>
                        <div className="text-sm">{formatKRW(metrics.monthlyProfit)}원</div>
                        {!mergedSettings.includeOverheadInCost && (
                          <div className="text-xs text-ink-muted">
                            고정비 포함 {formatKRW(metrics.monthlyProfitWithOverhead)}원
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {metrics.margin.toFixed(1)}%
                          {metrics.margin < mergedSettings.targetMarginPercent && (
                            <Badge variant="warning">목표 미달</Badge>
                          )}
                        </div>
                        {!mergedSettings.includeOverheadInCost && (
                          <div className="text-xs text-ink-muted">
                            고정비 포함 {metrics.marginWithOverhead.toFixed(1)}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(scenario.id)}>
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시나리오 삭제</DialogTitle>
            <DialogDescription>삭제하면 목록에서 제거됩니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              취소
            </Button>
            <Button onClick={confirmDelete}>삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
