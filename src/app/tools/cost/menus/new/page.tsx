"use client";

import { useRouter } from "next/navigation";
import MenuBatchForm from "@/components/MenuBatchForm";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient, Menu, Overhead, Settings } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

const DEFAULT_SETTINGS: Settings = {
  targetMarginPercent: 65,
  roundingUnit: 100,
  monthlySalesVolume: 1000,
  includeOverheadInCost: true,
  categorySalesMixPercent: { drink: 25, dessert: 25, food: 25, etc: 25 },
  categoryOverheadMixPercent: { drink: 25, dessert: 25, food: 25, etc: 25 },
};

export default function NewMenuPage() {
  const [ingredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [menus, setMenus] = useLocalStorageState<Menu[]>("cafeops.menus", []);
  const [overheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [settings] = useLocalStorageState<Settings>("cafeops.settings", DEFAULT_SETTINGS);
  const router = useRouter();
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  const toast = useToast();

  const handleSave = (nextMenus: Menu[]) => {
    setMenus([...nextMenus, ...menus]);
    toast(`메뉴 ${nextMenus.length}개가 추가되었습니다.`);
    router.push("/tools/cost/menus");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Menu Builder
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">새 메뉴 추가</h1>
          <p className="mt-2 text-sm text-slate-500">
            레시피와 판매가를 입력해 원가와 마진을 계산합니다.
          </p>
        </div>
      </section>

      {ingredients.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-ink-muted">
            재료가 등록되지 않았습니다. 먼저 재료를 추가해주세요.
          </CardContent>
        </Card>
      )}

      <MenuBatchForm
        ingredients={ingredients}
        overheads={overheads}
        settings={mergedSettings}
        onSave={handleSave}
        onCancel={() => router.push("/tools/cost/menus")}
      />
    </div>
  );
}
