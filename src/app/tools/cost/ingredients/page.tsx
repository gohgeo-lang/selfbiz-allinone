"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKRW, getUnitCost } from "@/lib/calc";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Ingredient, IngredientCategory } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { INGREDIENT_CATEGORY_LABELS } from "@/lib/ingredients";
import { downloadCSV, parseCSV, toCSV } from "@/lib/csv";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useLocalStorageState<Ingredient[]>("cafeops.ingredients", []);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | "all">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [ingredients, query, selectedCategory]);


  const confirmDelete = () => {
    if (!deleteId) return;
    setIngredients((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    toast("재료가 삭제되었습니다.");
  };

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length <= 1) return toast("CSV에 데이터가 없습니다.");
    const headers = rows[0].map((cell) => cell.trim().toLowerCase());
    const categoryByLabel = Object.entries(INGREDIENT_CATEGORY_LABELS).reduce(
      (acc, [key, label]) => {
        acc[label.toLowerCase()] = key as IngredientCategory;
        acc[key.toLowerCase()] = key as IngredientCategory;
        return acc;
      },
      {} as Record<string, IngredientCategory>
    );

    const nextItems: Ingredient[] = [];
    rows.slice(1).forEach((row, index) => {
      const get = (name: string) => row[headers.indexOf(name)] ?? "";
      const name = get("name") || row[0] || "";
      const categoryRaw = (get("category") || row[1] || "").toLowerCase();
      const unitType = (get("unittype") || row[2] || "g") as Ingredient["unitType"];
      const packSize = Number(get("packsize") || row[3] || 0);
      const packPrice = Number(get("packprice") || row[4] || 0);
      const category = categoryByLabel[categoryRaw] ?? "etc";

      if (!name.trim() || packSize <= 0 || packPrice < 0) return;
      nextItems.push({
        id: `ing-${Date.now()}-${index}`,
        name: name.trim(),
        category,
        unitType,
        packSize,
        packPrice,
        createdAt: Date.now(),
      });
    });

    if (!nextItems.length) return toast("가져올 재료가 없습니다.");
    setIngredients((prev) => [...nextItems, ...prev]);
    toast(`재료 ${nextItems.length}개를 가져왔습니다.`);
  };

  const handleCSVExport = () => {
    const rows = [
      ["name", "category", "unitType", "packSize", "packPrice"],
      ...ingredients.map((item) => [
        item.name,
        item.category,
        item.unitType,
        String(item.packSize),
        String(item.packPrice),
      ]),
    ];
    downloadCSV("cafeops-ingredients.csv", toCSV(rows));
    toast("CSV가 다운로드되었습니다.");
  };

  const handleTemplateDownload = () => {
    const rows = [
      ["name", "category", "unitType", "packSize", "packPrice"],
      ["Espresso", "beverage", "g", "1000", "16000"],
      ["Milk", "beverage", "ml", "1000", "2500"],
    ];
    downloadCSV("cafeops-ingredients-template.csv", toCSV(rows));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Ingredient Manager
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">재료 관리</h1>
            <p className="mt-2 text-sm text-slate-500">
              원재료 단가와 용량을 등록해 레시피 원가 계산에 활용합니다.
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
            <Button onClick={() => router.push("/tools/cost/ingredients/new")}>
              새 재료 추가
            </Button>
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

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>재료 리스트</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                >
                  전체
                </Button>
                {(Object.keys(INGREDIENT_CATEGORY_LABELS) as IngredientCategory[]).map(
                  (category) => (
                    <Button
                      key={category}
                      type="button"
                      size="sm"
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {INGREDIENT_CATEGORY_LABELS[category]}
                    </Button>
                  )
                )}
              </div>
            </div>
            <Input
              className="max-w-[220px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름 검색"
            />
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-ink-muted">
                재료가 없습니다. 새 재료를 추가하세요.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>재료명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>단가</TableHead>
                    <TableHead>구매 가격</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-ink">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{INGREDIENT_CATEGORY_LABELS[item.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatKRW(getUnitCost(item))}원/{item.unitType}
                      </TableCell>
                      <TableCell>{formatKRW(item.packPrice)}원</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/tools/cost/ingredients/${item.id}`)}
                          >
                            수정
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(item.id)}>
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재료 삭제</DialogTitle>
            <DialogDescription>
              삭제하면 해당 재료를 참조하는 레시피는 단가가 0으로 표시됩니다.
            </DialogDescription>
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
