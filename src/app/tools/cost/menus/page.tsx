"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { downloadCSV, parseCSV, toCSV } from "@/lib/csv";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient, Menu, MenuCategory, Overhead, Settings } from "@/lib/types";
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

export default function MenusPage() {
  const [ingredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus, setMenus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [settings] = useLocalStorageState<Settings>("cafeops.settings", DEFAULT_SETTINGS);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "all">("all");
  const router = useRouter();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const cost = ingredientCost + (mergedSettings.includeOverheadInCost ? overheadByCategory : 0);
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
      return { menu, cost, netProfit, margin, recommended, missingCount, ingredientCost, overheadByCategory };
    });
  }, [menus, ingredients, mergedSettings, overheadPerMenu]);

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return summaries.filter(({ menu }) => {
      if (selectedCategory !== "all" && (menu.category || "drink") !== selectedCategory) return false;
      if (!q) return true;
      return (
        menu.name.toLowerCase().includes(q) ||
        menu.sizeLabel.toLowerCase().includes(q) ||
        menu.temp.toLowerCase().includes(q)
      );
    });
  }, [summaries, query, selectedCategory]);

  const groupedSummaries = useMemo(() => {
    const map = new Map<
      string,
      { name: string; category: MenuCategory; items: typeof filteredSummaries }
    >();
    filteredSummaries.forEach((summary) => {
      const category = summary.menu.category || "drink";
      const key = `${summary.menu.name}::${category}`;
      if (!map.has(key)) {
        map.set(key, { name: summary.menu.name, category, items: [] });
      }
      map.get(key)?.items.push(summary);
    });
    return Array.from(map.values());
  }, [filteredSummaries]);

  const confirmDelete = () => {
    if (!deleteId) return;
    setMenus((prev) => prev.filter((menu) => menu.id !== deleteId));
    setDeleteId(null);
    toast("메뉴가 삭제되었습니다.");
  };

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length <= 1) return toast("CSV에 데이터가 없습니다.");
    const headers = rows[0].map((cell) => cell.trim().toLowerCase());
    const hasCategory = headers.includes("category");
    const ingredientMap = new Map(ingredients.map((ing) => [ing.name.trim(), ing]));
    const categoryByLabel = Object.entries(MENU_CATEGORY_LABELS).reduce(
      (acc, [key, label]) => {
        acc[key.toLowerCase()] = key as MenuCategory;
        acc[label.toLowerCase()] = key as MenuCategory;
        return acc;
      },
      {} as Record<string, MenuCategory>
    );

    const nextMenus: Menu[] = [];
    rows.slice(1).forEach((row, index) => {
      const get = (name: string) => row[headers.indexOf(name)] ?? "";
      const name = get("name") || row[0] || "";
      const categoryRaw = hasCategory ? get("category") || row[1] || "drink" : "drink";
      const baseOffset = hasCategory ? 2 : 1;
      const temp = (get("temp") || row[baseOffset] || "ICE") as Menu["temp"];
      const sizeLabel = get("sizelabel") || row[baseOffset + 1] || "";
      const sellPrice = Number(get("sellprice") || row[baseOffset + 2] || 0);
      const stepsRaw = get("steps") || row[baseOffset + 3] || "";
      const recipeRaw = get("recipeitems") || row[baseOffset + 4] || "";

      if (!name.trim()) return;
      const normalizedCategory = categoryRaw.trim().toLowerCase();
      const category = categoryByLabel[normalizedCategory] ?? "drink";
      const steps = stepsRaw
        ? stepsRaw.split("|").map((s) => s.trim()).filter(Boolean).slice(0, 6)
        : [];
      const recipeItems = recipeRaw
        ? recipeRaw
            .split("|")
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .map((chunk) => {
              const [ingredientName, amountRaw, unitTypeRaw] = chunk.split(":");
              const ingredient = ingredientMap.get((ingredientName || "").trim());
              if (!ingredient) return null;
              return {
                ingredientId: ingredient.id,
                amount: Number(amountRaw || 0),
                unitType: (unitTypeRaw || ingredient.unitType) as Menu["recipeItems"][0]["unitType"],
              };
            })
            .filter((item): item is Menu["recipeItems"][0] => Boolean(item))
        : [];

      nextMenus.push({
        id: `menu-${Date.now()}-${index}`,
        name: name.trim(),
        category,
        temp,
        sizeLabel: sizeLabel.trim(),
        sellPrice,
        steps,
        recipeItems,
        createdAt: Date.now(),
      });
    });

    if (!nextMenus.length) return toast("가져올 메뉴가 없습니다.");
    setMenus((prev) => [...nextMenus, ...prev]);
    toast(`메뉴 ${nextMenus.length}개를 가져왔습니다.`);
  };

  const handleCSVExport = () => {
    const ingredientById = new Map(ingredients.map((item) => [item.id, item]));
    const rows = [
      ["name", "category", "temp", "sizeLabel", "sellPrice", "steps", "recipeItems"],
      ...menus.map((menu) => {
        const steps = menu.steps.join("|");
        const recipeItems = menu.recipeItems
          .map((item) => {
            const ingredientName = ingredientById.get(item.ingredientId)?.name || item.ingredientId;
            return `${ingredientName}:${item.amount}:${item.unitType}`;
          })
          .join("|");
        return [
          menu.name,
          menu.category || "drink",
          menu.temp,
          menu.sizeLabel,
          String(menu.sellPrice),
          steps,
          recipeItems,
        ];
      }),
    ];
    downloadCSV("cafeops-menus.csv", toCSV(rows));
    toast("CSV가 다운로드되었습니다.");
  };

  const handleTemplateDownload = () => {
    const rows = [
      ["name", "category", "temp", "sizeLabel", "sellPrice", "steps", "recipeItems"],
      [
        "Americano",
        "drink",
        "ICE",
        "12oz",
        "4500",
        "Pull shot|Add water",
        "Espresso:18:g|Water:200:ml",
      ],
      [
        "Cafe Latte",
        "drink",
        "HOT",
        "12oz",
        "5000",
        "Pull shot|Add milk",
        "Espresso:18:g|Milk:200:ml",
      ],
    ];
    downloadCSV("cafeops-menus-template.csv", toCSV(rows));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Menu Manager
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">메뉴 관리</h1>
            <p className="mt-2 text-sm text-slate-500">
              메뉴/레시피/판매가를 정리하고 원가와 마진을 계산합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCSVExport}>
              CSV 다운로드
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              CSV 업로드
            </Button>
            <Button variant="outline" onClick={handleTemplateDownload}>
              CSV 템플릿
            </Button>
            <Button onClick={() => router.push("/tools/cost/menus/new")}>새 메뉴 추가</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleCSVImport(file);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>메뉴 리스트</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
              >
                전체
              </Button>
              {(Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]).map((category) => (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {MENU_CATEGORY_LABELS[category]}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="outline">
                원가 기준: {mergedSettings.includeOverheadInCost ? "재료+고정비" : "재료만"}
              </Badge>
            </div>
            <Input
              className="max-w-[220px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="메뉴명/사이즈/온도 검색"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSummaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-ink-muted">
              메뉴가 없습니다. 새 메뉴를 추가하세요.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedSummaries.map((group) => {
                const count = group.items.length;
                const totalSell = group.items.reduce((sum, item) => sum + item.menu.sellPrice, 0);
                const totalCost = group.items.reduce((sum, item) => sum + item.cost, 0);
                const totalNet = group.items.reduce((sum, item) => sum + item.netProfit, 0);
                const totalRecommended = group.items.reduce((sum, item) => sum + item.recommended, 0);
                const avgSell = count ? totalSell / count : 0;
                const avgCost = count ? totalCost / count : 0;
                const avgNet = count ? totalNet / count : 0;
                const avgMargin = totalSell > 0 ? (totalNet / totalSell) * 100 : 0;
                const avgRecommended = count ? totalRecommended / count : 0;

                return (
                  <details key={`${group.name}-${group.category}`} className="group">
                    <summary className="list-none">
                      <Card className="border border-[var(--line)]">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle>{group.name}</CardTitle>
                              <span className="text-sm text-ink-muted">|</span>
                              <span className="text-sm font-semibold text-ink">
                                평균 판매가 {formatKRW(avgSell)}원
                              </span>
                              <span className="text-sm text-ink-muted">|</span>
                              <span className="text-sm font-semibold text-ink">
                                평균 마진율 {avgMargin.toFixed(1)}%
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-ink-muted">
                              {MENU_CATEGORY_LABELS[group.category]} · {count}개 베리에이션 · 평균 원가{" "}
                              {formatKRW(avgCost)}원 · 평균 순수익 {formatKRW(avgNet)}원 · 평균 권장가{" "}
                              {formatKRW(avgRecommended)}원
                            </p>
                          </div>
                          <span className="text-ink-muted transition-transform group-open:rotate-180">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                              <path
                                d="M6 9l6 6 6-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </CardHeader>
                      </Card>
                    </summary>
                    <CardContent className="mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>온도</TableHead>
                            <TableHead>사이즈</TableHead>
                            <TableHead>판매가</TableHead>
                            <TableHead>원가</TableHead>
                            <TableHead>순수익</TableHead>
                            <TableHead>마진율</TableHead>
                            <TableHead>권장 판매가</TableHead>
                            <TableHead>관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map(({ menu, cost, netProfit, margin, recommended, missingCount }) => (
                            <TableRow key={menu.id}>
                              <TableCell>{menu.category === "drink" ? menu.temp : "-"}</TableCell>
                              <TableCell>{menu.sizeLabel}</TableCell>
                              <TableCell>{formatKRW(menu.sellPrice)}원</TableCell>
                              <TableCell>{formatKRW(cost)}원</TableCell>
                              <TableCell>{formatKRW(netProfit)}원</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {margin.toFixed(1)}%
                                  {margin < mergedSettings.targetMarginPercent && (
                                    <Badge variant="warning">목표 미달</Badge>
                                  )}
                                  {missingCount > 0 && <Badge variant="warning">재료 누락</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>{formatKRW(recommended)}원</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/tools/cost/menus/${menu.id}`)}
                                  >
                                    수정
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(menu.id)}>
                                    삭제
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메뉴 삭제</DialogTitle>
            <DialogDescription>삭제하면 메뉴와 레시피 정보가 모두 제거됩니다.</DialogDescription>
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
