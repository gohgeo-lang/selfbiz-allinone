"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKRW } from "@/lib/calc";
import { downloadCSV, parseCSV, toCSV } from "@/lib/csv";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorageState";
import { Overhead, OverheadCategory } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

const CATEGORY_LABELS: Record<OverheadCategory, string> = {
  facility: "공간비",
  labor: "인건비",
  utilities: "공과금",
  fees: "수수료",
  depreciation: "시설비(감가상각)",
  marketing: "광고비",
  etc: "기타",
};

const OVERHEAD_CSV_HEADERS = [
  "category",
  "amount",
  "facilityType",
  "facilityRent",
  "facilityManagementFee",
  "facilityDeposit",
  "facilityContractStart",
  "facilityContractEnd",
  "facilityDepositLoanAmount",
  "facilityDepositLoanRate",
  "facilityDepositLoanStart",
  "facilityDepositLoanEnd",
  "facilityMaintenance",
  "facilityPurchasePrice",
  "facilityCashPaid",
  "facilityLoanAmount",
  "facilityLoanRate",
  "facilityLoanStart",
  "facilityLoanEnd",
  "facilityLoanGraceMonths",
  "facilityLoanMethod",
  "facilityLoanCustomPayment",
  "facilityLoanIncreasingStart",
  "facilityLoanIncreasingRate",
  "facilityPropertyTaxAnnual",
  "facilityComprehensiveTaxAnnual",
  "utilitiesElectric",
  "utilitiesGas",
  "utilitiesWater",
  "utilitiesInternet",
  "utilitiesSubscriptions",
  "utilitiesOther",
  "laborItems",
  "feeItems",
  "marketingItems",
  "etcItems",
  "depreciationItems",
];

export default function OverheadsPage() {
  const [overheads, setOverheads] = useLocalStorageState<Overhead[]>("cafeops.overheads", []);
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getDisplayName = (item: Overhead) => {
    if (item.category === "facility") {
      return `공간비 (${item.facilityType === "own" ? "자가" : "임대"})`;
    }
    return CATEGORY_LABELS[item.category];
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return overheads;
    return overheads.filter((item) => getDisplayName(item).toLowerCase().includes(q));
  }, [overheads, query]);

  const confirmDelete = () => {
    if (!deleteId) return;
    setOverheads((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
    toast("고정비가 삭제되었습니다.");
  };

  const serializePairs = (
    items: Array<{ name: string; amount: number }> | undefined,
    fallbackAmount?: number,
    fallbackLabel = "기타"
  ) => {
    if (items && items.length > 0) {
      return items.map((item) => `${item.name}:${item.amount}`).join("|");
    }
    if (fallbackAmount && fallbackAmount > 0) {
      return `${fallbackLabel}:${fallbackAmount}`;
    }
    return "";
  };

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length <= 1) return toast("CSV에 데이터가 없습니다.");
    const headers = rows[0].map((cell) => cell.trim().toLowerCase());
    const categoryMap: Record<string, OverheadCategory> = {
      facility: "facility",
      labor: "labor",
      utilities: "utilities",
      fees: "fees",
      depreciation: "depreciation",
      marketing: "marketing",
      etc: "etc",
      공간비: "facility",
      인건비: "labor",
      공과금: "utilities",
      수수료: "fees",
      시설비: "depreciation",
      광고비: "marketing",
      기타: "etc",
    };

    const parsePairs = (raw: string) =>
      raw
        .split("|")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => {
          const [name, amount] = chunk.split(":");
          return { name: (name || "").trim(), amount: Number(amount || 0) };
        })
        .filter((item) => item.name && item.amount >= 0);

    const nextItems: Overhead[] = [];
    rows.slice(1).forEach((row, index) => {
      const get = (name: string) => row[headers.indexOf(name)] ?? "";
      const rawCategory = (get("category") || row[0] || "").trim();
      const category = categoryMap[rawCategory] ?? "etc";
      const baseAmount = Number(get("amount") || row[2] || 0);

      const item: Overhead = {
        id: `oh-${Date.now()}-${index}`,
        name: CATEGORY_LABELS[category],
        category,
        amount: baseAmount,
        createdAt: Date.now(),
      };

      if (category === "facility") {
        item.facilityType = (get("facilitytype") || "lease") as "lease" | "own";
        item.facilityRent = Number(get("facilityrent") || 0) || undefined;
        item.facilityManagementFee = Number(get("facilitymanagementfee") || 0) || undefined;
        item.facilityDeposit = Number(get("facilitydeposit") || 0) || undefined;
        item.facilityContractStart = get("facilitycontractstart") || undefined;
        item.facilityContractEnd = get("facilitycontractend") || undefined;
        item.facilityDepositLoanAmount = Number(get("facilitydepositloanamount") || 0) || undefined;
        item.facilityDepositLoanRate = Number(get("facilitydepositloanrate") || 0) || undefined;
        item.facilityDepositLoanStart = get("facilitydepositloanstart") || undefined;
        item.facilityDepositLoanEnd = get("facilitydepositloanend") || undefined;
        item.facilityMaintenance = Number(get("facilitymaintenance") || 0) || undefined;
        item.facilityPurchasePrice = Number(get("facilitypurchaseprice") || 0) || undefined;
        item.facilityCashPaid = Number(get("facilitycashpaid") || 0) || undefined;
        item.facilityLoanAmount = Number(get("facilityloanamount") || 0) || undefined;
        item.facilityLoanRate = Number(get("facilityloanrate") || 0) || undefined;
        item.facilityLoanStart = get("facilityloanstart") || undefined;
        item.facilityLoanEnd = get("facilityloanend") || undefined;
        item.facilityLoanGraceMonths = Number(get("facilityloangracemonths") || 0) || undefined;
        item.facilityLoanMethod = (get("facilityloanmethod") || undefined) as Overhead["facilityLoanMethod"];
        item.facilityLoanCustomPayment = Number(get("facilityloancustompayment") || 0) || undefined;
        item.facilityLoanIncreasingStart = Number(get("facilityloanincreasingstart") || 0) || undefined;
        item.facilityLoanIncreasingRate = Number(get("facilityloanincreasingrate") || 0) || undefined;
        item.facilityPropertyTaxAnnual = Number(get("facilitypropertytaxannual") || 0) || undefined;
        item.facilityComprehensiveTaxAnnual =
          Number(get("facilitycomprehensivetaxannual") || 0) || undefined;
      }

      if (category === "utilities") {
        item.utilitiesElectric = Number(get("utilitieselectric") || 0) || undefined;
        item.utilitiesGas = Number(get("utilitiesgas") || 0) || undefined;
        item.utilitiesWater = Number(get("utilitieswater") || 0) || undefined;
        item.utilitiesInternet = Number(get("utilitiesinternet") || 0) || undefined;
        const subscriptions = parsePairs(get("utilitiessubscriptions") || "");
        const other = parsePairs(get("utilitiesother") || "");
        item.utilitiesSubscriptionsItems = subscriptions.map((s, idx) => ({
          id: `sub-${index}-${idx}`,
          name: s.name,
          amount: s.amount,
        }));
        item.utilitiesOtherItems = other.map((s, idx) => ({
          id: `other-${index}-${idx}`,
          name: s.name,
          amount: s.amount,
        }));
        item.utilitiesSubscriptions = subscriptions.reduce((sum, s) => sum + s.amount, 0);
        item.utilitiesOther = other.reduce((sum, s) => sum + s.amount, 0);
      }

      if (category === "labor") {
        const labor = parsePairs(get("laboritems") || "");
        item.laborItems = labor.map((s, idx) => ({
          id: `labor-${index}-${idx}`,
          name: s.name,
          monthlyCost: s.amount,
        }));
      }

      if (category === "fees") {
        const fees = parsePairs(get("feeitems") || "");
        item.feeItems = fees.map((s, idx) => ({
          id: `fee-${index}-${idx}`,
          name: s.name,
          monthlyCost: s.amount,
        }));
      }

      if (category === "marketing") {
        const marketing = parsePairs(get("marketingitems") || "");
        item.marketingItems = marketing.map((s, idx) => ({
          id: `mkt-${index}-${idx}`,
          platform: s.name,
          actualSpend: s.amount,
        }));
      }

      if (category === "etc") {
        const etc = parsePairs(get("etcitems") || "");
        item.etcItems = etc.map((s, idx) => ({
          id: `etc-${index}-${idx}`,
          name: s.name,
          monthlyCost: s.amount,
        }));
      }

      if (category === "depreciation") {
        const deps = (get("depreciationitems") || "")
          .split("|")
          .map((chunk) => chunk.trim())
          .filter(Boolean)
          .map((chunk) => {
            const [name, totalRepayment, usefulMonths, purchaseDate, paymentMethod] = chunk.split(":");
            return {
              name: (name || "").trim(),
              totalRepayment: Number(totalRepayment || 0),
              usefulMonths: Number(usefulMonths || 36),
              purchaseDate: (purchaseDate || "").trim(),
              paymentMethod: (paymentMethod || "cash") as "cash" | "installment" | "lease",
            };
          })
          .filter((entry) => entry.name && entry.totalRepayment >= 0);

        item.depreciationItems = deps.map((d, idx) => ({
          id: `dep-${index}-${idx}`,
          name: d.name,
          totalRepayment: d.totalRepayment,
          usefulMonths: d.usefulMonths,
          purchaseDate: d.purchaseDate || undefined,
          paymentMethod: d.paymentMethod,
        }));
      }

      nextItems.push(item);
    });

    if (!nextItems.length) return toast("가져올 고정비가 없습니다.");
    setOverheads((prev) => [...nextItems, ...prev]);
    toast(`고정비 ${nextItems.length}개를 가져왔습니다.`);
  };

  const handleCSVExport = () => {
    const rows = [
      OVERHEAD_CSV_HEADERS,
      ...overheads.map((item) => {
        const record: Record<string, string> = {
          category: item.category,
          amount: String(item.amount ?? 0),
          facilityType: item.facilityType ?? "",
          facilityRent: String(item.facilityRent ?? ""),
          facilityManagementFee: String(item.facilityManagementFee ?? ""),
          facilityDeposit: String(item.facilityDeposit ?? ""),
          facilityContractStart: item.facilityContractStart ?? "",
          facilityContractEnd: item.facilityContractEnd ?? "",
          facilityDepositLoanAmount: String(item.facilityDepositLoanAmount ?? ""),
          facilityDepositLoanRate: String(item.facilityDepositLoanRate ?? ""),
          facilityDepositLoanStart: item.facilityDepositLoanStart ?? "",
          facilityDepositLoanEnd: item.facilityDepositLoanEnd ?? "",
          facilityMaintenance: String(item.facilityMaintenance ?? ""),
          facilityPurchasePrice: String(item.facilityPurchasePrice ?? ""),
          facilityCashPaid: String(item.facilityCashPaid ?? ""),
          facilityLoanAmount: String(item.facilityLoanAmount ?? ""),
          facilityLoanRate: String(item.facilityLoanRate ?? ""),
          facilityLoanStart: item.facilityLoanStart ?? "",
          facilityLoanEnd: item.facilityLoanEnd ?? "",
          facilityLoanGraceMonths: String(item.facilityLoanGraceMonths ?? ""),
          facilityLoanMethod: item.facilityLoanMethod ?? "",
          facilityLoanCustomPayment: String(item.facilityLoanCustomPayment ?? ""),
          facilityLoanIncreasingStart: String(item.facilityLoanIncreasingStart ?? ""),
          facilityLoanIncreasingRate: String(item.facilityLoanIncreasingRate ?? ""),
          facilityPropertyTaxAnnual: String(item.facilityPropertyTaxAnnual ?? ""),
          facilityComprehensiveTaxAnnual: String(item.facilityComprehensiveTaxAnnual ?? ""),
          utilitiesElectric: String(item.utilitiesElectric ?? ""),
          utilitiesGas: String(item.utilitiesGas ?? ""),
          utilitiesWater: String(item.utilitiesWater ?? ""),
          utilitiesInternet: String(item.utilitiesInternet ?? ""),
          utilitiesSubscriptions: serializePairs(
            item.utilitiesSubscriptionsItems?.map((entry) => ({
              name: entry.name,
              amount: entry.amount,
            })),
            item.utilitiesSubscriptions,
            "기타"
          ),
          utilitiesOther: serializePairs(
            item.utilitiesOtherItems?.map((entry) => ({
              name: entry.name,
              amount: entry.amount,
            })),
            item.utilitiesOther,
            "기타"
          ),
          laborItems: item.laborItems
            ? item.laborItems.map((entry) => `${entry.name}:${entry.monthlyCost}`).join("|")
            : "",
          feeItems: item.feeItems
            ? item.feeItems.map((entry) => `${entry.name}:${entry.monthlyCost}`).join("|")
            : "",
          marketingItems: item.marketingItems
            ? item.marketingItems.map((entry) => `${entry.platform}:${entry.actualSpend}`).join("|")
            : "",
          etcItems: item.etcItems
            ? item.etcItems.map((entry) => `${entry.name}:${entry.monthlyCost}`).join("|")
            : "",
          depreciationItems: item.depreciationItems
            ? item.depreciationItems
                .map((entry) => {
                  const totalRepayment = entry.totalRepayment ?? 0;
                  const usefulMonths = entry.usefulMonths ?? 36;
                  const purchaseDate = entry.purchaseDate ?? "";
                  const paymentMethod = entry.paymentMethod ?? "cash";
                  return `${entry.name}:${totalRepayment}:${usefulMonths}:${purchaseDate}:${paymentMethod}`;
                })
                .join("|")
            : "",
        };

        return OVERHEAD_CSV_HEADERS.map((header) => record[header] ?? "");
      }),
    ];

    downloadCSV("cafeops-overheads.csv", toCSV(rows));
    toast("CSV가 다운로드되었습니다.");
  };

  const handleTemplateDownload = () => {
    const rows = [
      OVERHEAD_CSV_HEADERS,
      [
        "utilities",
        "0",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "120000",
        "80000",
        "20000",
        "40000",
        "POS:30000|Security:15000",
        "Other:10000",
        "",
        "",
        "",
        "",
      ],
      [
        "facility",
        "0",
        "lease",
        "2000000",
        "200000",
        "10000000",
        "2024-01-01",
        "2026-12-31",
        "15000000",
        "4",
        "2024-01-01",
        "2026-12-31",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        "depreciation",
        "0",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Espresso Machine:4800000:36:2024-01-01:cash",
      ],
    ];
    downloadCSV("cafeops-overheads-template.csv", toCSV(rows));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
          Overhead Manager
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">고정비 관리</h1>
            <p className="mt-2 text-sm text-slate-500">
              임대료, 인건비 외 고정비를 모아 원가 계산에 반영합니다.
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
            <Button onClick={() => router.push("/tools/cost/overheads/new")}>
              새 고정비 추가
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>고정비 리스트</CardTitle>
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
              고정비 항목이 없습니다. 새 항목을 추가하세요.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>월 금액</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-ink">{getDisplayName(item)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[item.category]}</Badge>
                    </TableCell>
                    <TableCell>{formatKRW(item.amount)}원</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/tools/cost/overheads/${item.id}`)}
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
            <DialogTitle>고정비 삭제</DialogTitle>
            <DialogDescription>삭제하면 메뉴 원가에서 해당 고정비가 제외됩니다.</DialogDescription>
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
