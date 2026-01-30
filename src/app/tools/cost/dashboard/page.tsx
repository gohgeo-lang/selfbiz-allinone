"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  calcMarginPercent,
  calcMenuCost,
  calcNetProfit,
  calcOverheadPerMenu,
  calcOverheadPerMenuByCategory,
  calcRecommendedPrice,
  formatKRW,
} from "@/lib/calc";
import { downloadCSV, toCSV } from "@/lib/csv";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient, Menu, Overhead, Settings } from "@/lib/types";
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

export default function DashboardPage() {
  const [ingredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [settings] = useLocalStorageState<Settings>("cafeops.settings", DEFAULT_SETTINGS);
  const router = useRouter();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const toast = useToast();

  const overheadTotal = useMemo(
    () => overheads.reduce((sum, item) => sum + item.amount, 0),
    [overheads]
  );
  const overheadPerMenu = useMemo(
    () => calcOverheadPerMenu(overheads, mergedSettings.monthlySalesVolume),
    [overheads, mergedSettings.monthlySalesVolume]
  );

  const summaries = useMemo(() => {
    return menus.map((menu) => {
      const ingredientCost = calcMenuCost(menu, ingredients);
      const category = menu.category || "drink";
      const categorySalesShare = mergedSettings.categorySalesMixPercent?.[category] ?? 0;
      const categoryOverheadShare = mergedSettings.categoryOverheadMixPercent?.[category] ?? 0;
      const overheadByCategory =
        categorySalesShare > 0 && categoryOverheadShare > 0
          ? calcOverheadPerMenuByCategory(
              overheads,
              mergedSettings.monthlySalesVolume,
              categorySalesShare,
              categoryOverheadShare
            )
          : overheadPerMenu;
      const cost =
        ingredientCost + (mergedSettings.includeOverheadInCost ? overheadByCategory : 0);
      const netProfit = calcNetProfit(menu.sellPrice, cost);
      const margin = calcMarginPercent(menu.sellPrice, netProfit);
      const recommended = calcRecommendedPrice(
        cost,
        mergedSettings.targetMarginPercent,
        mergedSettings.roundingUnit
      );
      const missingCount = menu.recipeItems.filter(
        (item) => !ingredients.find((ing) => ing.id === item.ingredientId)
      ).length;
      return { menu, cost, netProfit, margin, recommended, missingCount };
    });
  }, [menus, ingredients, mergedSettings, overheadPerMenu]);

  const categorySummaries = useMemo(() => {
    const totals = (Object.keys(MENU_CATEGORY_LABELS) as Array<keyof typeof MENU_CATEGORY_LABELS>).reduce(
      (acc, key) => {
        acc[key] = { count: 0, totalSell: 0, totalCost: 0, totalNet: 0 };
        return acc;
      },
      {} as Record<
        keyof typeof MENU_CATEGORY_LABELS,
        { count: number; totalSell: number; totalCost: number; totalNet: number }
      >
    );

    menus.forEach((menu) => {
      const category = (menu.category || "drink") as keyof typeof MENU_CATEGORY_LABELS;
      const ingredientCost = calcMenuCost(menu, ingredients);
      const categorySalesShare = mergedSettings.categorySalesMixPercent?.[category] ?? 0;
      const categoryOverheadShare = mergedSettings.categoryOverheadMixPercent?.[category] ?? 0;
      const overheadByCategory =
        categorySalesShare > 0 && categoryOverheadShare > 0
          ? calcOverheadPerMenuByCategory(
              overheads,
              mergedSettings.monthlySalesVolume,
              categorySalesShare,
              categoryOverheadShare
            )
          : overheadPerMenu;
      const cost = ingredientCost + (mergedSettings.includeOverheadInCost ? overheadByCategory : 0);
      const netProfit = calcNetProfit(menu.sellPrice, cost);

      totals[category].count += 1;
      totals[category].totalSell += menu.sellPrice;
      totals[category].totalCost += cost;
      totals[category].totalNet += netProfit;
    });

    return totals;
  }, [menus, ingredients, mergedSettings, overheadPerMenu, overheads]);

  const averageMargin = summaries.length
    ? summaries.reduce((sum, item) => sum + item.margin, 0) / summaries.length
    : 0;

  const lowestMargin = summaries.reduce(
    (current, item) => (item.margin < current.margin ? item : current),
    summaries[0] ?? {
      menu: { name: "-" } as Menu,
      margin: 0,
    }
  );

  const handleExport = () => {
    const rows = [
      ["메뉴명", "카테고리", "HOT/ICE", "판매가", "원가", "순수익", "마진율", "권장 판매가"],
      ...summaries.map(({ menu, cost, netProfit, margin, recommended }) => [
        menu.name,
        MENU_CATEGORY_LABELS[menu.category || "drink"],
        menu.temp,
        formatKRW(menu.sellPrice),
        formatKRW(cost),
        formatKRW(netProfit),
        `${margin.toFixed(1)}%`,
        formatKRW(recommended),
      ]),
    ];

    downloadCSV("cafeops-dashboard.csv", toCSV(rows));
    toast("CSV가 다운로드되었습니다.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Cost Dashboard
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">원가·수익 대시보드</h1>
            <p className="mt-2 text-sm text-slate-500">
              메뉴별 원가, 순수익, 권장 판매가를 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              CSV 다운로드
            </Button>
            <Button onClick={() => router.push("/tools/cost/menus/new")}>새 메뉴 추가</Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>메뉴 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{menus.length}개</p>
            <p className="text-xs text-ink-muted">활성 메뉴 기준</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>평균 마진율</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{averageMargin.toFixed(1)}%</p>
            <p className="text-xs text-ink-muted">판매가 대비 순수익 비율</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>이번달 총 고정비</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{formatKRW(overheadTotal)}원</p>
            <p className="text-xs text-ink-muted">등록된 고정비 합계</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>최저 마진 메뉴</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-ink">{lowestMargin.menu.name}</p>
            <p className="text-xs text-ink-muted">{lowestMargin.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>메뉴 수익 요약</CardTitle>
            <p className="text-sm text-ink-muted">원가, 순수익, 권장 판매가를 한 번에 확인합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{mergedSettings.targetMarginPercent}% 목표</Badge>
            <Badge variant="outline">
              원가 기준: {mergedSettings.includeOverheadInCost ? "재료+고정비" : "재료만"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {menus.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-ink-muted">
              메뉴가 없습니다. 메뉴를 추가하면 자동 계산이 시작됩니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>HOT/ICE</TableHead>
                  <TableHead>판매가</TableHead>
                  <TableHead>원가</TableHead>
                  <TableHead>순수익</TableHead>
                  <TableHead>마진율</TableHead>
                  <TableHead>권장 판매가</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map(({ menu, cost, netProfit, margin, recommended, missingCount }) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        {menu.name}
                        {missingCount > 0 && <Badge variant="warning">재료 누락</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MENU_CATEGORY_LABELS[menu.category || "drink"]}
                      </Badge>
                    </TableCell>
                    <TableCell>{menu.category === "drink" ? menu.temp : "-"}</TableCell>
                    <TableCell>{formatKRW(menu.sellPrice)}원</TableCell>
                    <TableCell>{formatKRW(cost)}원</TableCell>
                    <TableCell>{formatKRW(netProfit)}원</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {margin.toFixed(1)}%
                        {margin < mergedSettings.targetMarginPercent && (
                          <Badge variant="warning">목표 미달</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatKRW(recommended)}원</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리별 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>메뉴 수</TableHead>
                <TableHead>평균 판매가</TableHead>
                <TableHead>평균 원가</TableHead>
                <TableHead>마진율</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(MENU_CATEGORY_LABELS) as Array<keyof typeof MENU_CATEGORY_LABELS>).map(
                (category) => {
                  const summary = categorySummaries[category];
                  const avgSell = summary.count ? summary.totalSell / summary.count : 0;
                  const avgCost = summary.count ? summary.totalCost / summary.count : 0;
                  const margin = summary.totalSell > 0 ? (summary.totalNet / summary.totalSell) * 100 : 0;
                  return (
                    <TableRow key={category}>
                      <TableCell className="font-semibold text-ink">
                        {MENU_CATEGORY_LABELS[category]}
                      </TableCell>
                      <TableCell>{summary.count}개</TableCell>
                      <TableCell>{formatKRW(avgSell)}원</TableCell>
                      <TableCell>{formatKRW(avgCost)}원</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {margin.toFixed(1)}%
                          {summary.count > 0 && margin < mergedSettings.targetMarginPercent && (
                            <Badge variant="warning">목표 미달</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
