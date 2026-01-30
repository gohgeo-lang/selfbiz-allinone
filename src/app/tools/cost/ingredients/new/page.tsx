"use client";

import { useRouter } from "next/navigation";
import IngredientForm from "@/components/IngredientForm";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient } from "@/lib/types";

export default function NewIngredientPage() {
  const [ingredients, setIngredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const router = useRouter();
  const toast = useToast();

  const handleSave = (ingredient: Ingredient) => {
    setIngredients([ingredient, ...ingredients]);
    toast("재료가 추가되었습니다.");
    router.push("/tools/cost/ingredients");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Ingredient Builder
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">새 재료 추가</h1>
          <p className="mt-2 text-sm text-slate-500">
            단가/용량/단위를 등록해 원가 계산 정확도를 높입니다.
          </p>
        </div>
      </section>

      <Card>
        <CardContent className="p-6">
          <IngredientForm onSave={handleSave} onCancel={() => router.push("/tools/cost/ingredients")} />
        </CardContent>
      </Card>
    </div>
  );
}
