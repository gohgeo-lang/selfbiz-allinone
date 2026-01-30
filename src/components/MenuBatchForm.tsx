"use client";

import { useMemo, useState } from "react";
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
import { MENU_CATEGORY_LABELS } from "@/lib/menus";
import { safeParse } from "@/lib/storage";
import { Ingredient, Menu, MenuCategory, MenuRecipeItem, Overhead, Settings } from "@/lib/types";

interface VariantDraft {
  id: string;
  temp: Menu["temp"];
  sizeLabel: string;
  sellPrice: string;
  steps: string[];
  recipeItems: MenuRecipeItem[];
  ingredientQueries: string[];
}

interface MenuBatchFormProps {
  ingredients: Ingredient[];
  overheads: Overhead[];
  settings: Settings;
  onSave: (menus: Menu[]) => void;
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

const createEmptyVariant = (): VariantDraft => ({
  id: `variant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  temp: "ICE",
  sizeLabel: "",
  sellPrice: "",
  steps: DEFAULT_STEPS,
  recipeItems: [],
  ingredientQueries: [],
});

const cloneVariant = (source: VariantDraft, ingredients: Ingredient[]): VariantDraft => ({
  id: `variant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  temp: source.temp,
  sizeLabel: "",
  sellPrice: "",
  steps: source.steps.map((step) => step),
  recipeItems: source.recipeItems.map((item) => ({ ...item })),
  ingredientQueries: source.recipeItems.map((item) => {
    const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
    return ingredient?.name ?? "";
  }),
});

export default function MenuBatchForm({
  ingredients,
  overheads,
  settings,
  onSave,
  onCancel,
}: MenuBatchFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MenuCategory>("drink");
  const [variants, setVariants] = useState<VariantDraft[]>([createEmptyVariant()]);
  const [copyBaseRecipe, setCopyBaseRecipe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addVariant = () => {
    setVariants((prev) => {
      if (copyBaseRecipe && prev[0]) {
        return [...prev, cloneVariant(prev[0], ingredients)];
      }
      return [...prev, createEmptyVariant()];
    });
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateVariant = (index: number, next: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((variant, idx) => (idx === index ? { ...variant, ...next } : variant)));
  };

  const addRecipeItem = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        return {
          ...variant,
          recipeItems: [
            ...variant.recipeItems,
            { ingredientId: "", amount: 0, unitType: "g" },
          ],
          ingredientQueries: [...variant.ingredientQueries, ""],
        };
      })
    );
  };

  const removeRecipeItem = (variantIndex: number, itemIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        return {
          ...variant,
          recipeItems: variant.recipeItems.filter((_, i) => i !== itemIndex),
          ingredientQueries: variant.ingredientQueries.filter((_, i) => i !== itemIndex),
        };
      })
    );
  };

  const updateRecipeItem = (
    variantIndex: number,
    itemIndex: number,
    next: Partial<MenuRecipeItem>
  ) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const recipeItems = variant.recipeItems.map((item, i) =>
          i === itemIndex ? { ...item, ...next } : item
        );
        return { ...variant, recipeItems };
      })
    );
  };

  const updateIngredientQuery = (variantIndex: number, itemIndex: number, value: string) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const ingredientQueries = [...variant.ingredientQueries];
        ingredientQueries[itemIndex] = value;
        return { ...variant, ingredientQueries };
      })
    );

    const trimmed = value.trim();
    if (!trimmed) {
      updateRecipeItem(variantIndex, itemIndex, { ingredientId: "" });
      return;
    }

    const match = ingredients.find(
      (ing) => ing.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      updateRecipeItem(variantIndex, itemIndex, { ingredientId: match.id, unitType: match.unitType });
    } else {
      updateRecipeItem(variantIndex, itemIndex, { ingredientId: "" });
    }
  };

  const addStep = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        if (variant.steps.length >= 6) return variant;
        return { ...variant, steps: [...variant.steps, ""] };
      })
    );
  };

  const updateStep = (variantIndex: number, stepIndex: number, value: string) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const steps = variant.steps.map((step, i) => (i === stepIndex ? value : step));
        return { ...variant, steps };
      })
    );
  };

  const removeStep = (variantIndex: number, stepIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const steps = variant.steps.filter((_, i) => i !== stepIndex);
        return { ...variant, steps: steps.length ? steps : [""] };
      })
    );
  };

  const overheadByCategory = useMemo(() => {
    const salesShare = settings.categorySalesMixPercent?.[category] ?? 0;
    const overheadShare = settings.categoryOverheadMixPercent?.[category] ?? 0;
    if (salesShare > 0 && overheadShare > 0) {
      return calcOverheadPerMenuByCategory(
        overheads,
        settings.monthlySalesVolume,
        salesShare,
        overheadShare
      );
    }
    return calcOverheadPerMenu(overheads, settings.monthlySalesVolume);
  }, [settings, overheads, category]);

  const getMetrics = (variant: VariantDraft) => {
    const menuDraft: Menu = {
      id: "",
      name: name.trim(),
      category,
      temp: variant.temp,
      sizeLabel: variant.sizeLabel,
      sellPrice: safeParse(variant.sellPrice),
      steps: variant.steps,
      recipeItems: variant.recipeItems,
      createdAt: Date.now(),
    };
    const ingredientCost = calcMenuCost(menuDraft, ingredients);
    const cost = ingredientCost + (settings.includeOverheadInCost ? overheadByCategory : 0);
    const netProfit = calcNetProfit(menuDraft.sellPrice, cost);
    const margin = calcMarginPercent(menuDraft.sellPrice, netProfit);
    const recommended = calcRecommendedPrice(
      cost,
      settings.targetMarginPercent,
      settings.roundingUnit
    );
    return { cost, netProfit, margin, recommended };
  };

  const handleSave = () => {
    if (!name.trim()) return setError("메뉴명을 입력하세요.");
    if (variants.length === 0) return setError("베리에이션을 추가하세요.");

    for (const variant of variants) {
      if (!variant.sizeLabel.trim()) return setError("사이즈 라벨을 입력하세요.");
      if (safeParse(variant.sellPrice) < 0) return setError("판매가는 0 이상이어야 합니다.");
      if (variant.recipeItems.length === 0) return setError("레시피 항목을 추가하세요.");
    }

    const menus: Menu[] = variants.map((variant) => ({
      id: `menu-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      category,
      temp: category === "drink" ? variant.temp : "ICE",
      sizeLabel: variant.sizeLabel.trim(),
      sellPrice: safeParse(variant.sellPrice),
      steps: variant.steps.map((step) => step.trim()).filter(Boolean).slice(0, 6),
      recipeItems: variant.recipeItems.map((item) => ({
        ...item,
        amount: safeParse(item.amount),
      })),
      createdAt: Date.now(),
    }));

    onSave(menus);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>메뉴 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <CardTitle>메뉴 베리에이션</CardTitle>
          <p className="text-xs text-ink-muted">온도/사이즈별 레시피를 한 번에 등록하세요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={copyBaseRecipe ? "default" : "outline"}
              onClick={() => setCopyBaseRecipe((prev) => !prev)}
            >
              기본 레시피 복사 {copyBaseRecipe ? "ON" : "OFF"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addVariant}>
              + 베리에이션 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, variantIndex) => {
            const metrics = getMetrics(variant);
            return (
              <div key={variant.id} className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">베리에이션 #{variantIndex + 1}</p>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariant(variantIndex)}
                    >
                      베리에이션 삭제
                    </Button>
                  )}
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  {category === "drink" && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-ink-muted">HOT / ICE</label>
                      <Select
                        value={variant.temp}
                        onChange={(event) =>
                          updateVariant(variantIndex, { temp: event.target.value as Menu["temp"] })
                        }
                      >
                        <option value="HOT">HOT</option>
                        <option value="ICE">ICE</option>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-ink-muted">사이즈 라벨</label>
                    <Input
                      value={variant.sizeLabel}
                      onChange={(event) =>
                        updateVariant(variantIndex, { sizeLabel: event.target.value })
                      }
                      placeholder="예: 12oz"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-ink-muted">판매가 (원)</label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.sellPrice}
                      onChange={(event) =>
                        updateVariant(variantIndex, { sellPrice: event.target.value })
                      }
                      placeholder="예: 4500"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">레시피 항목</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addRecipeItem(variantIndex)}
                      disabled={!ingredients.length}
                    >
                      + 항목 추가
                    </Button>
                  </div>
                  {variant.recipeItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-ink-muted">
                      재료를 선택해 레시피를 구성하세요.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variant.recipeItems.map((item, itemIndex) => {
                        const ingredient = ingredients.find((ing) => ing.id === item.ingredientId);
                        const missing = !ingredient && item.ingredientId;
                        const query = variant.ingredientQueries[itemIndex] ?? "";
                        return (
                          <div
                            key={`${variant.id}-${item.ingredientId}-${itemIndex}`}
                            className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white/70 p-3 md:grid-cols-[2fr_1fr_auto]"
                          >
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-ink-muted">재료 선택</label>
                              <Input
                                value={query}
                                onChange={(event) =>
                                  updateIngredientQuery(variantIndex, itemIndex, event.target.value)
                                }
                                placeholder="이름으로 검색"
                              />
                              {query.trim() && !item.ingredientId && (
                                <div className="flex flex-wrap gap-2">
                                  {ingredients
                                    .filter((ing) => {
                                      const normalizedQuery = query.toLowerCase();
                                      const name = ing.name.toLowerCase();
                                      if (name.includes(normalizedQuery)) return true;
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
                                          updateIngredientQuery(variantIndex, itemIndex, ing.name);
                                        }}
                                      >
                                        {ing.name}
                                      </Button>
                                    ))}
                                </div>
                              )}
                              {missing && <Badge variant="warning">삭제된 재료</Badge>}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-ink-muted">사용량</label>
                              <Input
                                type="number"
                                min="0"
                                value={item.amount === 0 ? "" : item.amount}
                                onChange={(event) =>
                                  updateRecipeItem(variantIndex, itemIndex, {
                                    amount: safeParse(event.target.value),
                                  })
                                }
                              />
                              <p className="text-xs text-ink-muted">
                                단위: {ingredient?.unitType ?? item.unitType}
                              </p>
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRecipeItem(variantIndex, itemIndex)}
                              >
                                삭제
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">제조 단계</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addStep(variantIndex)}
                      disabled={variant.steps.length >= 6}
                    >
                      + 단계 추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {variant.steps.map((step, stepIndex) => (
                      <div key={`${variant.id}-step-${stepIndex}`} className="flex items-center gap-2">
                        <Input
                          value={step}
                          onChange={(event) =>
                            updateStep(variantIndex, stepIndex, event.target.value)
                          }
                          placeholder={`${stepIndex + 1}단계`}
                        />
                        {variant.steps.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStep(variantIndex, stepIndex)}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
                    <p className="text-xs text-ink-muted">원가</p>
                    <p className="font-semibold">{formatKRW(metrics.cost)}원</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
                    <p className="text-xs text-ink-muted">순수익</p>
                    <p className="font-semibold">{formatKRW(metrics.netProfit)}원</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
                    <p className="text-xs text-ink-muted">마진율</p>
                    <p className="font-semibold">{metrics.margin.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-sm">
                    <p className="text-xs text-ink-muted">권장 판매가</p>
                    <p className="font-semibold">{formatKRW(metrics.recommended)}원</p>
                  </div>
                </div>
              </div>
            );
          })}

          {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>저장</Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
