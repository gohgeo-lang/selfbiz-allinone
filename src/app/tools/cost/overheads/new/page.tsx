"use client";

import { useRouter } from "next/navigation";
import OverheadForm from "@/components/OverheadForm";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Overhead } from "@/lib/types";

export default function NewOverheadPage() {
  const [overheads, setOverheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const router = useRouter();
  const toast = useToast();

  const handleSave = (overhead: Overhead) => {
    setOverheads([overhead, ...overheads]);
    toast("고정비가 추가되었습니다.");
    router.push("/tools/cost/overheads");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Overhead Builder
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">새 고정비 추가</h1>
          <p className="mt-2 text-sm text-slate-500">
            월 고정비를 항목별로 등록해 원가와 손익 계산에 반영합니다.
          </p>
        </div>
      </section>

      <Card>
        <CardContent className="p-6">
          <OverheadForm onSave={handleSave} onCancel={() => router.push("/tools/cost/overheads")} />
        </CardContent>
      </Card>
    </div>
  );
}
