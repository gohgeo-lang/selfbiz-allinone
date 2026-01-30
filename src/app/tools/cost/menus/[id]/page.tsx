"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import MenuForm from "@/components/MenuForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calcMenuCost,
  calcNetProfit,
  calcOverheadPerMenu,
  calcOverheadPerMenuByCategory,
  formatKRW,
} from "@/lib/calc";
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

export default function MenuDetailPage() {
  const params = useParams();
  const menuId = params.id as string;
  const [ingredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus, setMenus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [settings] = useLocalStorageState<Settings>("cafeops.settings", DEFAULT_SETTINGS);
  const router = useRouter();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const toast = useToast();

  const menu = menus.find((item) => item.id === menuId);

  const recipeSummary = useMemo(() => {
    if (!menu) return [];
    return menu.recipeItems.map((item) => {
      const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
      return {
        ...item,
        ingredientName: ingredient?.name ?? "삭제된 재료",
      };
    });
  }, [menu, ingredients]);

  if (!menu) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="font-display text-2xl">메뉴를 찾을 수 없습니다.</h2>
        <Button onClick={() => router.push("/tools/cost/menus")}>메뉴로 돌아가기</Button>
      </div>
    );
  }

  const handleSave = (updated: Menu) => {
    setMenus((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast("메뉴가 수정되었습니다.");
    router.push("/tools/cost/menus");
  };

  const cost = calcMenuCost(menu, ingredients);
  const category = menu.category || "drink";
  const categorySalesShare = mergedSettings.categorySalesMixPercent?.[category] ?? 0;
  const categoryOverheadShare = mergedSettings.categoryOverheadMixPercent?.[category] ?? 0;
  const overheadPerMenu =
    categorySalesShare > 0 && categoryOverheadShare > 0
      ? calcOverheadPerMenuByCategory(
          overheads,
          mergedSettings.monthlySalesVolume,
          categorySalesShare,
          categoryOverheadShare
        )
      : calcOverheadPerMenu(overheads, mergedSettings.monthlySalesVolume);
  const totalCost = cost + (mergedSettings.includeOverheadInCost ? overheadPerMenu : 0);
  const netProfit = calcNetProfit(menu.sellPrice, totalCost);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="no-print space-y-6">
        <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
            Menu Detail
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl">메뉴 상세</h1>
              <p className="mt-2 text-sm text-slate-500">
                레시피와 판매가를 수정하고 인쇄용 카드로 출력할 수 있습니다.
              </p>
            </div>
            <Button onClick={() => window.print()}>레시피 카드 인쇄</Button>
          </div>
        </section>

      <MenuForm
        ingredients={ingredients}
        overheads={overheads}
        settings={mergedSettings}
        initial={menu}
        onSave={handleSave}
        onCancel={() => router.push("/tools/cost/menus")}
      />
      </div>

      <div className="print-only">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>{menu.name}</CardTitle>
            <p className="text-sm text-ink-muted">
              {MENU_CATEGORY_LABELS[menu.category || "drink"]}
              {menu.category === "drink" ? ` · ${menu.temp}` : ""} · {menu.sizeLabel}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--line)] p-3 text-sm">
                <p className="text-xs text-ink-muted">원가</p>
                <p className="font-semibold">{formatKRW(totalCost)}원</p>
                <p className="text-xs text-ink-muted">
                  {mergedSettings.includeOverheadInCost
                    ? `고정비/잔 ${formatKRW(overheadPerMenu)}원 포함`
                    : "고정비 제외"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] p-3 text-sm">
                <p className="text-xs text-ink-muted">순수익</p>
                <p className="font-semibold">{formatKRW(netProfit)}원</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">레시피</p>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {recipeSummary.map((item, index) => (
                  <li key={`${item.ingredientId}-${index}`}>
                    {item.ingredientName} {item.amount}
                    {item.unitType}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">제조 단계</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-ink-muted">
                {menu.steps.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
