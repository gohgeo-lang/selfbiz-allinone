"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { safeParse } from "@/lib/storage";
import { Ingredient, IngredientCategory, UnitType } from "@/lib/types";
import { INGREDIENT_CATEGORY_LABELS } from "@/lib/ingredients";

interface IngredientFormProps {
  initial?: Ingredient;
  onSave: (ingredient: Ingredient) => void;
  onCancel?: () => void;
}

const DEFAULT_FORM = {
  name: "",
  category: "beverage" as IngredientCategory,
  unitType: "g" as UnitType,
  packSize: "",
  packPrice: "",
};

export default function IngredientForm({ initial, onSave, onCancel }: IngredientFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name,
          category: initial.category,
          unitType: initial.unitType,
          packSize: String(initial.packSize),
          packPrice: String(initial.packPrice),
        }
      : DEFAULT_FORM
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const packSize = safeParse(form.packSize || 0);
    const packPrice = safeParse(form.packPrice || 0);

    if (!form.name.trim()) return setError("재료명을 입력하세요.");
    if (packSize <= 0) return setError("구매 단위 수량은 0보다 커야 합니다.");
    if (packPrice < 0) return setError("구매 가격은 0 이상이어야 합니다.");

    const payload: Ingredient = {
      id: initial?.id ?? `ing-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      unitType: form.unitType,
      packSize,
      packPrice,
      createdAt: initial?.createdAt ?? Date.now(),
    };

    onSave(payload);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">재료명</label>
        <Input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="예: 에스프레소 원두"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">카테고리</label>
        <Select
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value as IngredientCategory })
          }
        >
          {Object.entries(INGREDIENT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">단위</label>
        <Select
          value={form.unitType}
          onChange={(event) => setForm({ ...form, unitType: event.target.value as UnitType })}
        >
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="ea">ea</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">구매 단위 수량</label>
        <Input
          type="number"
          min="0"
          value={form.packSize}
          onChange={(event) => setForm({ ...form, packSize: event.target.value })}
          placeholder="예: 1000"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">구매 가격 (원)</label>
        <Input
          type="number"
          min="0"
          value={form.packPrice}
          onChange={(event) => setForm({ ...form, packPrice: event.target.value })}
          placeholder="예: 24000"
        />
      </div>
      {error && <p className="text-sm text-[var(--warning)]">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSubmit}>{initial ? "수정 저장" : "추가"}</Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    </div>
  );
}
