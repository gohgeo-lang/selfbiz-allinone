"use client";

import { useParams, useRouter } from "next/navigation";
import IngredientForm from "@/components/IngredientForm";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient } from "@/lib/types";

export default function EditIngredientPage() {
  const params = useParams();
  const ingredientId = params.id as string;
  const [ingredients, setIngredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const router = useRouter();
  const toast = useToast();

  const ingredient = ingredients.find((item) => item.id === ingredientId);

  if (!ingredient) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="font-display text-2xl">재료를 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const handleSave = (updated: Ingredient) => {
    setIngredients((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast("재료가 수정되었습니다.");
    router.push("/tools/cost/ingredients");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Ingredient Detail
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">재료 수정</h1>
          <p className="mt-2 text-sm text-slate-500">
            재료 단가와 용량 정보를 수정해 원가 계산을 최신화하세요.
          </p>
        </div>
      </section>

      <Card>
        <CardContent className="p-6">
          <IngredientForm
            initial={ingredient}
            onSave={handleSave}
            onCancel={() => router.push("/tools/cost/ingredients")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
