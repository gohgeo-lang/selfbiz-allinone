"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  calcMarginPercent,
  calcMenuCost,
  calcNetProfit,
  calcOverheadPerMenu,
  calcOverheadPerMenuByCategory,
  calcRecommendedPrice,
  formatKRW,
} from "@/lib/calc";
import { safeParse } from "@/lib/storage";
import { Ingredient, Menu, MenuCategory, MenuRecipeItem, Overhead, Settings } from "@/lib/types";
import { MENU_CATEGORY_LABELS } from "@/lib/menus";

interface MenuFormProps {
  ingredients: Ingredient[];
  overheads: Overhead[];
  settings: Settings;
  initial?: Menu;
  onSave: (menu: Menu) => void;
  onCancel?: () => void;
}

const DEFAULT_STEPS = [""];
const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const HANGUL_INITIALS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const getInitials = (value: string) => {
  let result = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      const index = Math.floor((code - HANGUL_BASE) / 588);
      result += HANGUL_INITIALS[index] ?? "";
    } else {
      result += char.toLowerCase();
    }
  }
  return result;
};

export default function MenuForm({
  ingredients,
  overheads,
  settings,
  initial,
  onSave,
  onCancel,
}: MenuFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<MenuCategory>(initial?.category ?? "drink");
  const [temp, setTemp] = useState<Menu["temp"]>(initial?.temp ?? "ICE");
  const [sizeLabel, setSizeLabel] = useState(initial?.sizeLabel ?? "");
  const [sellPrice, setSellPrice] = useState(String(initial?.sellPrice ?? ""));
  const [steps, setSteps] = useState<string[]>(initial?.steps ?? DEFAULT_STEPS);
  const [recipeItems, setRecipeItems] = useState<MenuRecipeItem[]>(
    initial?.recipeItems ?? []
  );
  const [ingredientQueries, setIngredientQueries] = useState<string[]>(
    (initial?.recipeItems ?? []).map((item) => {
      const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
      return ingredient?.name ?? "";
    })
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIngredientQueries((prev) =>
      recipeItems.map((item, idx) => {
        const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
        if (ingredient) return ingredient.name;
        return prev[idx] ?? "";
      })
    );
  }, [recipeItems, ingredients]);

  const metrics = useMemo(() => {
    const menuDraft: Menu = {
      id: initial?.id ?? "",
      name,
      category,
      temp,
      sizeLabel,
      sellPrice: safeParse(sellPrice),
      steps,
      recipeItems,
      createdAt: initial?.createdAt ?? Date.now(),
    };
    const ingredientCost = calcMenuCost(menuDraft, ingredients);
    const categorySalesShare = settings.categorySalesMixPercent?.[category] ?? 0;
    const categoryOverheadShare = settings.categoryOverheadMixPercent?.[category] ?? 0;
    const overheadPerMenu =
      categorySalesShare > 0 && categoryOverheadShare > 0
        ? calcOverheadPerMenuByCategory(
            overheads,
            settings.monthlySalesVolume,
            categorySalesShare,
            categoryOverheadShare
          )
        : calcOverheadPerMenu(overheads, settings.monthlySalesVolume);
    const cost = ingredientCost + (settings.includeOverheadInCost ? overheadPerMenu : 0);
    const netProfit = calcNetProfit(menuDraft.sellPrice, cost);
    const margin = calcMarginPercent(menuDraft.sellPrice, netProfit);
    const recommended = calcRecommendedPrice(
      cost,
      settings.targetMarginPercent,
      settings.roundingUnit
    );

    return { cost, netProfit, margin, recommended, overheadPerMenu };
  }, [
    name,
    category,
    temp,
    sizeLabel,
    sellPrice,
    steps,
    recipeItems,
    ingredients,
    overheads,
    settings,
    initial,
  ]);

  const addRecipeItem = () => {
    setRecipeItems((prev) => [
      ...prev,
      {
        ingredientId: "",
        amount: 0,
        unitType: "g",
      },
    ]);
    setIngredientQueries((prev) => [...prev, ""]);
  };

  const updateRecipeItem = (index: number, next: Partial<MenuRecipeItem>) => {
    setRecipeItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...next } : item))
    );
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, idx) => idx !== index));
    setIngredientQueries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleIngredientQuery = (index: number, value: string) => {
    setIngredientQueries((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    const trimmed = value.trim();
    if (!trimmed) {
      updateRecipeItem(index, { ingredientId: "" });
      return;
    }

    const match = ingredients.find(
      (ing) => ing.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      updateRecipeItem(index, { ingredientId: match.id, unitType: match.unitType });
    } else {
      updateRecipeItem(index, { ingredientId: "" });
    }
  };

  const addStep = () => {
    if (steps.length >= 6) return;
    setSteps((prev) => [...prev, ""]);
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => prev.map((step, idx) => (idx === index ? value : step)));
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return setError("메뉴명을 입력하세요.");
    if (!sizeLabel.trim()) return setError("사이즈 라벨을 입력하세요.");
    if (safeParse(sellPrice) < 0) return setError("판매가는 0 이상이어야 합니다.");
    if (recipeItems.length === 0) return setError("레시피 항목을 추가하세요.");

    const payload: Menu = {
      id: initial?.id ?? `menu-${Date.now()}`,
      name: name.trim(),
      category,
      temp,
      sizeLabel: sizeLabel.trim(),
      sellPrice: safeParse(sellPrice),
      steps: steps.map((step) => step.trim()).filter(Boolean).slice(0, 6),
      recipeItems: recipeItems.map((item) => ({
        ...item,
        amount: safeParse(item.amount),
      })),
      createdAt: initial?.createdAt ?? Date.now(),
    };

    onSave(payload);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>메뉴 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">메뉴명</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">카테고리</label>
              <Select value={category} onChange={(event) => setCategory(event.target.value as MenuCategory)}>
                {(Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {MENU_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </Select>
            </div>
            {category === "drink" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">HOT / ICE</label>
                <Select value={temp} onChange={(event) => setTemp(event.target.value as Menu["temp"])}>
                  <option value="HOT">HOT</option>
                  <option value="ICE">ICE</option>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">사이즈 라벨</label>
              <Input
                value={sizeLabel}
                onChange={(event) => setSizeLabel(event.target.value)}
                placeholder="예: 12oz"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">판매가 (원)</label>
              <Input
                type="number"
                min="0"
                value={sellPrice}
                onChange={(event) => setSellPrice(event.target.value)}
                placeholder="예: 4500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">레시피 항목</p>
              <Button size="sm" variant="outline" onClick={addRecipeItem} disabled={!ingredients.length}>
                + 항목 추가
              </Button>
            </div>
            {recipeItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-sm text-ink-muted">
                재료를 선택해 레시피를 구성하세요.
              </div>
            ) : (
              <div className="space-y-3">
                {recipeItems.map((item, idx) => {
                  const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
                  const missing = !ingredient && item.ingredientId;
                  return (
                    <div
                      key={`${item.ingredientId}-${idx}`}
                      className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4 md:grid-cols-[2fr_1fr_auto]"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-ink-muted">재료 선택</label>
                        <div className="space-y-2">
                          <Input
                            value={ingredientQueries[idx] ?? ""}
                            onChange={(event) => handleIngredientQuery(idx, event.target.value)}
                            placeholder="이름으로 검색"
                          />
                          {ingredientQueries[idx]?.trim() && !item.ingredientId && (
                            <div className="flex flex-wrap gap-2">
                              {ingredients
                                .filter((ing) => {
                                  const query = (ingredientQueries[idx] ?? "").trim().toLowerCase();
                                  if (!query) return false;
                                  const name = ing.name.toLowerCase();
                                  if (name.includes(query)) return true;
                                  const initials = getInitials(ing.name).replace(/\s+/g, "");
                                  const initialsQuery = getInitials(query).replace(/\s+/g, "");
                                  return initials.includes(initialsQuery);
                                })
                                .slice(0, 6)
                                .map((ing) => (
                                  <Button
                                    key={ing.id}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setIngredientQueries((prev) => {
                                        const next = [...prev];
                                        next[idx] = ing.name;
                                        return next;
                                      });
                                      updateRecipeItem(idx, { ingredientId: ing.id, unitType: ing.unitType });
                                    }}
                                  >
                                    {ing.name}
                                  </Button>
                                ))}
                            </div>
                          )}
                        </div>
                        {missing && <Badge variant="warning">삭제된 재료</Badge>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-ink-muted">사용량</label>
                        <Input
                          type="number"
                          min="0"
                          value={item.amount === 0 ? "" : item.amount}
                          onChange={(event) =>
                            updateRecipeItem(idx, { amount: safeParse(event.target.value) })
                          }
                        />
                        <p className="text-xs text-ink-muted">단위: {ingredient?.unitType ?? item.unitType}</p>
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" variant="ghost" onClick={() => removeRecipeItem(idx)}>
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">제조 단계</p>
              <Button size="sm" variant="outline" onClick={addStep} disabled={steps.length >= 6}>
                + 단계 추가
              </Button>
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={step}
                    onChange={(event) => updateStep(idx, event.target.value)}
                    placeholder={`${idx + 1}단계`}
                  />
                  {steps.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeStep(idx)}>
                      삭제
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave}>저장</Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>실시간 계산</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs text-ink-muted">원가</p>
              <p className="text-2xl font-bold text-ink">{formatKRW(metrics.cost)}원</p>
              <p className="text-xs text-ink-muted">
                {settings.includeOverheadInCost
                  ? `고정비/잔 ${formatKRW(metrics.overheadPerMenu)}원 포함`
                  : "고정비 제외"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs text-ink-muted">순수익</p>
              <p className="text-2xl font-bold text-ink">{formatKRW(metrics.netProfit)}원</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs text-ink-muted">마진율</p>
              <p className="text-2xl font-bold text-ink">{metrics.margin.toFixed(1)}%</p>
              {metrics.margin < settings.targetMarginPercent && (
                <Badge variant="warning">목표 마진 미만</Badge>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-xs text-ink-muted">권장 판매가</p>
              <p className="text-2xl font-bold text-ink">{formatKRW(metrics.recommended)}원</p>
              <p className="text-xs text-ink-muted">
                목표 마진 {settings.targetMarginPercent}% 기준
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>인쇄 프리뷰</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-muted">
            <p>메뉴 저장 후 상세 페이지에서 레시피 카드를 출력할 수 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
