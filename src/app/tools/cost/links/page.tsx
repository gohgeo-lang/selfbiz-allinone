"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { QuickLink } from "@/lib/types";

const emptyForm = { name: "", url: "", category: "" };

const normalizeUrl = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const isValidUrl = (raw: string) => {
  if (!raw.trim()) return false;
  try {
    const value = normalizeUrl(raw);
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export default function LinksPage() {
  const [links, setLinks] = useLocalStorageState<QuickLink[]>("cafeops.links", []);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const filtered = useMemo(() => {
    const sorted = [...links].sort((a, b) => {
      const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pinnedDiff !== 0) return pinnedDiff;
      return b.createdAt - a.createdAt;
    });
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
    );
  }, [links, query]);

  const pinnedLinks = useMemo(() => links.filter((item) => item.pinned), [links]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setError("이름을 입력하세요.");
      return;
    }
    if (!isValidUrl(form.url)) {
      setError("올바른 URL을 입력하세요.");
      return;
    }

    const existing = editId ? links.find((item) => item.id === editId) : undefined;
    const payload: QuickLink = {
      id: editId ?? `link-${Date.now()}`,
      name: form.name.trim(),
      url: normalizeUrl(form.url),
      category: form.category.trim() || undefined,
      pinned: existing?.pinned ?? false,
      createdAt: Date.now(),
    };

    setLinks((prev) => {
      if (editId) {
        return prev.map((item) => (item.id === editId ? { ...payload, createdAt: item.createdAt } : item));
      }
      return [payload, ...prev];
    });
    toast(editId ? "링크가 수정되었습니다." : "링크가 추가되었습니다.");
    resetForm();
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setLinks((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    toast("링크가 삭제되었습니다.");
  };

  const togglePin = (id: string) => {
    setLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Quick Links
        </p>
        <div className="mt-4">
          <h1 className="font-display text-3xl">바로가기</h1>
          <p className="mt-2 text-sm text-slate-500">
            업무에 필요한 링크를 모아 고정하고 바로 접근하세요.
          </p>
        </div>
      </section>

      {pinnedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>고정 바로가기</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pinnedLinks.map((item) => (
              <Card key={item.id} className="border border-[var(--line)]">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-ink-muted">{item.category || "분류 없음"}</p>
                    </div>
                    <Badge variant="outline">고정</Badge>
                  </div>
                  <p className="truncate text-xs text-ink-muted">{item.url}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.url, "_blank", "noreferrer")}
                    >
                      열기
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePin(item.id)}>
                      고정 해제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editId ? "링크 수정" : "새 링크 추가"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">이름</label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">URL</label>
              <Input
                value={form.url}
                onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">분류 (선택)</label>
              <Input
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="예: 블로그, 거래처"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave}>{editId ? "수정 저장" : "링크 추가"}</Button>
            {editId && (
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>등록된 링크</CardTitle>
          <Input
            className="max-w-[220px]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름/분류 검색"
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-ink-muted">
              등록된 링크가 없습니다. 바로가기를 추가하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>분류</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-ink">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.category ? <Badge variant="outline">{item.category}</Badge> : "-"}
                        {item.pinned && <Badge variant="outline">고정</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-ink-muted">
                      {item.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.url, "_blank", "noreferrer")}
                        >
                          열기
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => togglePin(item.id)}>
                          {item.pinned ? "고정 해제" : "고정"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setForm({ name: item.name, url: item.url, category: item.category ?? "" });
                            setEditId(item.id);
                            setError(null);
                          }}
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

      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>링크 삭제</DialogTitle>
            <DialogDescription>삭제하면 바로가기에서 제거됩니다.</DialogDescription>
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
