"use client";

import { useParams, useRouter } from "next/navigation";
import OverheadForm from "@/components/OverheadForm";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Overhead } from "@/lib/types";

export default function EditOverheadPage() {
  const params = useParams();
  const overheadId = params.id as string;
  const [overheads, setOverheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const router = useRouter();
  const toast = useToast();

  const overhead = overheads.find((item) => item.id === overheadId);

  if (!overhead) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="font-display text-2xl">고정비 항목을 찾을 수 없습니다.</h2>
      </div>
    );
  }

  const handleSave = (updated: Overhead) => {
    setOverheads((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    toast("고정비가 수정되었습니다.");
    router.push("/tools/cost/overheads");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Overhead Detail
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">고정비 수정</h1>
          <p className="mt-2 text-sm text-slate-500">
            항목 정보를 수정해 월 고정비 합계를 최신화하세요.
          </p>
        </div>
      </section>

      <Card>
        <CardContent className="p-6">
          <OverheadForm
            initial={overhead}
            onSave={handleSave}
            onCancel={() => router.push("/tools/cost/overheads")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
