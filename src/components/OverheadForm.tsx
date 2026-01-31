"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatKRW } from "@/lib/calc";
import { safeParse } from "@/lib/storage";
import { Overhead, OverheadCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<OverheadCategory, string> = {
  facility: "공간비",
  labor: "인건비",
  utilities: "공과금",
  fees: "수수료",
  depreciation: "시설비(감가상각)",
  marketing: "광고비",
  etc: "기타",
};

const DEFAULT_FORM = {
  category: "facility" as OverheadCategory,
  facilityType: "lease" as "lease" | "own",
  amount: "",
  facilityRent: "",
  facilityManagementFee: "",
  facilityDeposit: "",
  facilityContractStart: "",
  facilityContractEnd: "",
  facilityDepositLoanAmount: "",
  facilityDepositLoanRate: "",
  facilityDepositLoanStart: "",
  facilityDepositLoanEnd: "",
  facilityMaintenance: "",
  facilityPurchasePrice: "",
  facilityCashPaid: "",
  facilityLoanAmount: "",
  facilityLoanRate: "",
  facilityLoanStart: "",
  facilityLoanEnd: "",
  facilityLoanGraceMonths: "",
  facilityLoanMethod: "" as "" | "annuity" | "equal_principal" | "balloon" | "increasing" | "other",
  facilityLoanCustomPayment: "",
  facilityLoanIncreasingStart: "",
  facilityLoanIncreasingRate: "",
  facilityPropertyTaxAnnual: "",
  facilityComprehensiveTaxAnnual: "",
  utilitiesElectric: "",
  utilitiesGas: "",
  utilitiesWater: "",
  utilitiesInternet: "",
  utilitiesSubscriptionsItems: [
    { id: "sub-security", name: "보안/방범", amount: "" },
    { id: "sub-pos", name: "POS", amount: "" },
    { id: "sub-kiosk", name: "키오스크", amount: "" },
    { id: "sub-rental", name: "장비 렌탈", amount: "" },
  ] as { id: string; name: string; amount: string }[],
  utilitiesOtherItems: [] as { id: string; name: string; amount: string }[],
  laborItems: [] as { id: string; name: string; monthlyCost: string }[],
  feeItems: [
    { id: "fee-card", name: "카드/간편결제 수수료", monthlyCost: "" },
    { id: "fee-delivery", name: "배달앱 수수료", monthlyCost: "" },
    { id: "fee-pg", name: "PG/플랫폼 이용료", monthlyCost: "" },
  ] as { id: string; name: string; monthlyCost: string }[],
  marketingItems: [
    { id: "mkt-naver", platform: "네이버", actualSpend: "" },
    { id: "mkt-instagram", platform: "인스타그램", actualSpend: "" },
    { id: "mkt-google", platform: "구글", actualSpend: "" },
    { id: "mkt-kakao", platform: "카카오", actualSpend: "" },
    { id: "mkt-daangn", platform: "당근", actualSpend: "" },
    { id: "mkt-delivery", platform: "배달앱 광고", actualSpend: "" },
  ] as { id: string; platform: string; actualSpend: string }[],
  etcItems: [] as { id: string; name: string; monthlyCost: string }[],
  depreciationItems: [
    {
      id: "dep-machine",
      name: "에스프레소 머신",
      purchaseDate: "",
      paymentMethod: "cash" as "cash" | "installment" | "lease",
      totalRepayment: "",
      usefulMonths: "36",
    },
  ] as {
    id: string;
    name: string;
    purchaseDate: string;
    paymentMethod: "cash" | "installment" | "lease";
    totalRepayment: string;
    usefulMonths: string;
  }[],
};

const calcMonthDiff = (start: Date, end: Date) => {
  if (end < start) return 0;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months + (end.getDate() >= start.getDate() ? 1 : 0);
};

interface OverheadFormProps {
  initial?: Overhead;
  onSave: (overhead: Overhead) => void;
  onCancel?: () => void;
}

export default function OverheadForm({ initial, onSave, onCancel }: OverheadFormProps) {
  const [form, setForm] = useState(() => {
    if (!initial) return DEFAULT_FORM;
    return {
      ...DEFAULT_FORM,
      category: initial.category,
      facilityType: initial.facilityType ?? "lease",
      amount: String(initial.amount ?? ""),
      facilityRent: String(initial.facilityRent ?? ""),
      facilityManagementFee: String(initial.facilityManagementFee ?? ""),
      facilityDeposit: String(initial.facilityDeposit ?? ""),
      facilityContractStart: initial.facilityContractStart ?? "",
      facilityContractEnd: initial.facilityContractEnd ?? "",
      facilityDepositLoanAmount: String(initial.facilityDepositLoanAmount ?? ""),
      facilityDepositLoanRate: String(initial.facilityDepositLoanRate ?? ""),
      facilityDepositLoanStart: initial.facilityDepositLoanStart ?? "",
      facilityDepositLoanEnd: initial.facilityDepositLoanEnd ?? "",
      facilityMaintenance: String(initial.facilityMaintenance ?? ""),
      facilityPurchasePrice: String(initial.facilityPurchasePrice ?? ""),
      facilityCashPaid: String(initial.facilityCashPaid ?? ""),
      facilityLoanAmount: String(initial.facilityLoanAmount ?? ""),
      facilityLoanRate: String(initial.facilityLoanRate ?? ""),
      facilityLoanStart: initial.facilityLoanStart ?? "",
      facilityLoanEnd: initial.facilityLoanEnd ?? "",
      facilityLoanGraceMonths: String(initial.facilityLoanGraceMonths ?? ""),
      facilityLoanMethod: initial.facilityLoanMethod ?? "",
      facilityLoanCustomPayment: String(initial.facilityLoanCustomPayment ?? ""),
      facilityLoanIncreasingStart: String(initial.facilityLoanIncreasingStart ?? ""),
      facilityLoanIncreasingRate: String(initial.facilityLoanIncreasingRate ?? ""),
      facilityPropertyTaxAnnual: String(initial.facilityPropertyTaxAnnual ?? ""),
      facilityComprehensiveTaxAnnual: String(initial.facilityComprehensiveTaxAnnual ?? ""),
      utilitiesElectric: String(initial.utilitiesElectric ?? ""),
      utilitiesGas: String(initial.utilitiesGas ?? ""),
      utilitiesWater: String(initial.utilitiesWater ?? ""),
      utilitiesInternet: String(initial.utilitiesInternet ?? ""),
      utilitiesSubscriptionsItems:
        initial.utilitiesSubscriptionsItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          amount: String(entry.amount),
        })) ?? DEFAULT_FORM.utilitiesSubscriptionsItems,
      utilitiesOtherItems:
        initial.utilitiesOtherItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          amount: String(entry.amount),
        })) ?? [],
      laborItems:
        initial.laborItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          monthlyCost: String(entry.monthlyCost),
        })) ?? [],
      feeItems:
        initial.feeItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          monthlyCost: String(entry.monthlyCost),
        })) ?? DEFAULT_FORM.feeItems,
      marketingItems:
        initial.marketingItems?.map((entry) => ({
          id: entry.id,
          platform: entry.platform,
          actualSpend: String(entry.actualSpend),
        })) ?? DEFAULT_FORM.marketingItems,
      etcItems:
        initial.etcItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          monthlyCost: String(entry.monthlyCost),
        })) ?? [],
      depreciationItems:
        initial.depreciationItems?.map((entry) => ({
          id: entry.id,
          name: entry.name,
          purchaseDate: entry.purchaseDate ?? "",
          paymentMethod: entry.paymentMethod ?? "cash",
          totalRepayment: String(entry.totalRepayment ?? ""),
          usefulMonths: String(entry.usefulMonths ?? "36"),
        })) ??
        (initial.purchasePrice || initial.usefulMonths
          ? [
              {
                id: "legacy-dep",
                name: initial.name || "기타 시설비",
                purchaseDate: "",
                paymentMethod: "cash" as const,
                totalRepayment: String(initial.purchasePrice ?? ""),
                usefulMonths: String(initial.usefulMonths ?? "36"),
              },
            ]
          : DEFAULT_FORM.depreciationItems),
    };
  });

  const [error, setError] = useState<string | null>(null);
  const isFacility = form.category === "facility";
  const facilityType = form.facilityType ?? "lease";
  const isUtilities = form.category === "utilities";
  const usesDepreciation = form.category === "depreciation";

  const contractMonths = useMemo(() => {
    if (!form.facilityContractStart || !form.facilityContractEnd) return 0;
    const start = new Date(form.facilityContractStart);
    const end = new Date(form.facilityContractEnd);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return 0;
    return calcMonthDiff(start, end);
  }, [form.facilityContractStart, form.facilityContractEnd]);

  const loanMonths = useMemo(() => {
    if (!form.facilityLoanStart || !form.facilityLoanEnd) return 0;
    const start = new Date(form.facilityLoanStart);
    const end = new Date(form.facilityLoanEnd);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return 0;
    return calcMonthDiff(start, end);
  }, [form.facilityLoanStart, form.facilityLoanEnd]);

  const loanMonthsElapsed = useMemo(() => {
    if (!form.facilityLoanStart) return 0;
    const start = new Date(form.facilityLoanStart);
    if (Number.isNaN(start.valueOf())) return 0;
    const today = new Date();
    if (today < start) return 0;
    return calcMonthDiff(start, today);
  }, [form.facilityLoanStart]);

  const parsedFacilityPurchasePrice = safeParse(form.facilityPurchasePrice || 0);
  const parsedFacilityCashPaid = safeParse(form.facilityCashPaid || 0);
  const hasManualLoanAmount = form.facilityLoanAmount.trim().length > 0;
  const parsedFacilityLoanAmount = safeParse(form.facilityLoanAmount || 0);
  const derivedLoanAmount = hasManualLoanAmount
    ? parsedFacilityLoanAmount
    : Math.max(0, parsedFacilityPurchasePrice - parsedFacilityCashPaid);
  const parsedFacilityLoanRate = safeParse(form.facilityLoanRate || 0);
  const parsedFacilityLoanGraceMonths = safeParse(form.facilityLoanGraceMonths || 0);
  const parsedFacilityLoanCustomPayment = safeParse(form.facilityLoanCustomPayment || 0);
  const parsedFacilityLoanIncreasingStart = safeParse(form.facilityLoanIncreasingStart || 0);
  const parsedFacilityLoanIncreasingRate = safeParse(form.facilityLoanIncreasingRate || 0);

  const subscriptionsTotal = form.utilitiesSubscriptionsItems.reduce(
    (sum, item) => sum + safeParse(item.amount || 0),
    0
  );
  const otherUtilitiesTotal = form.utilitiesOtherItems.reduce(
    (sum, item) => sum + safeParse(item.amount || 0),
    0
  );
  const laborTotal = form.laborItems.reduce(
    (sum, item) => sum + safeParse(item.monthlyCost || 0),
    0
  );
  const feeTotal = form.feeItems.reduce((sum, item) => sum + safeParse(item.monthlyCost || 0), 0);
  const marketingTotal = form.marketingItems.reduce(
    (sum, item) => sum + safeParse(item.actualSpend || 0),
    0
  );
  const etcTotal = form.etcItems.reduce((sum, item) => sum + safeParse(item.monthlyCost || 0), 0);

  const utilitiesMonthly = isUtilities
    ? (() => {
        const electric = safeParse(form.utilitiesElectric || 0);
        const gas = safeParse(form.utilitiesGas || 0);
        const water = safeParse(form.utilitiesWater || 0);
        const internet = safeParse(form.utilitiesInternet || 0);
        return electric + gas + water + internet + subscriptionsTotal + otherUtilitiesTotal;
      })()
    : 0;

  const laborMonthly = form.category === "labor" ? laborTotal : 0;
  const feeMonthly = form.category === "fees" ? feeTotal : 0;
  const marketingMonthly = form.category === "marketing" ? marketingTotal : 0;
  const etcMonthly = form.category === "etc" ? etcTotal : 0;

  const facilityMonthly = isFacility
    ? (() => {
        if (facilityType === "lease") {
          const rent = safeParse(form.facilityRent || 0);
          const management = safeParse(form.facilityManagementFee || 0);
          const deposit = safeParse(form.facilityDeposit || 0);
          const depositMonths = contractMonths;
          const depositMonthly = depositMonths > 0 ? deposit / depositMonths : 0;
          const depositLoanAmount = safeParse(form.facilityDepositLoanAmount || 0);
          const depositLoanRate = safeParse(form.facilityDepositLoanRate || 0);
          const depositLoanStart = form.facilityDepositLoanStart
            ? new Date(form.facilityDepositLoanStart)
            : null;
          const depositLoanEnd = form.facilityDepositLoanEnd
            ? new Date(form.facilityDepositLoanEnd)
            : null;
          const inLoanWindow =
            !depositLoanStart ||
            !depositLoanEnd ||
            (!Number.isNaN(depositLoanStart.valueOf()) &&
              !Number.isNaN(depositLoanEnd.valueOf()) &&
              new Date() >= depositLoanStart &&
              new Date() <= depositLoanEnd);
          const depositLoanMonthly =
            depositLoanAmount > 0 && depositLoanRate > 0 && inLoanWindow
              ? (depositLoanAmount * depositLoanRate) / 12 / 100
              : 0;
          return rent + management + depositMonthly + depositLoanMonthly;
        }

        const maintenance = safeParse(form.facilityMaintenance || 0);
        const propertyTaxAnnual = safeParse(form.facilityPropertyTaxAnnual || 0);
        const propertyTaxMonthly = propertyTaxAnnual > 0 ? propertyTaxAnnual / 12 : 0;
        const comprehensiveTaxAnnual = safeParse(form.facilityComprehensiveTaxAnnual || 0);
        const comprehensiveTaxMonthly = comprehensiveTaxAnnual > 0 ? comprehensiveTaxAnnual / 12 : 0;
        const loanAmount = derivedLoanAmount;
        const monthlyRate = parsedFacilityLoanRate > 0 ? parsedFacilityLoanRate / 12 / 100 : 0;
        const graceMonths = parsedFacilityLoanGraceMonths;
        const loanMethod = form.facilityLoanMethod;
        const customPayment = parsedFacilityLoanCustomPayment;
        const increasingStart = parsedFacilityLoanIncreasingStart;
        const increasingRate = parsedFacilityLoanIncreasingRate / 100;

        let loanMonthly = 0;
        if (loanAmount > 0 && loanMonths > 0 && loanMonthsElapsed > 0 && loanMonthsElapsed <= loanMonths) {
          const inGrace = graceMonths > 0 && loanMonthsElapsed <= graceMonths;
          if (inGrace) {
            loanMonthly = monthlyRate > 0 ? loanAmount * monthlyRate : 0;
          } else {
            const amortizationTerm = Math.max(1, loanMonths - Math.max(0, graceMonths));
            const amortizationMonth = Math.max(1, loanMonthsElapsed - Math.max(0, graceMonths));

            if (loanMethod === "annuity") {
              if (monthlyRate === 0) {
                loanMonthly = loanAmount / amortizationTerm;
              } else {
                const factor = Math.pow(1 + monthlyRate, amortizationTerm);
                loanMonthly = (loanAmount * monthlyRate * factor) / (factor - 1);
              }
            } else if (loanMethod === "equal_principal") {
              const principal = loanAmount / amortizationTerm;
              const paidPrincipal = principal * (amortizationMonth - 1);
              const remaining = Math.max(0, loanAmount - paidPrincipal);
              loanMonthly = principal + remaining * monthlyRate;
            } else if (loanMethod === "balloon") {
              loanMonthly = monthlyRate > 0 ? loanAmount * monthlyRate : 0;
            } else if (loanMethod === "increasing") {
              if (increasingStart > 0) {
                loanMonthly = increasingStart * Math.pow(1 + Math.max(0, increasingRate), amortizationMonth - 1);
              }
            } else if (loanMethod === "other") {
              loanMonthly = customPayment;
            }
          }
        }

        return maintenance + propertyTaxMonthly + comprehensiveTaxMonthly + loanMonthly;
      })()
    : 0;

  const depreciationMonthly = usesDepreciation
    ? form.depreciationItems.reduce((sum, item) => {
        const totalRepayment = safeParse(item.totalRepayment || 0);
        const usefulMonths = safeParse(item.usefulMonths || 0);
        if (totalRepayment <= 0 || usefulMonths <= 0) return sum;
        return sum + Math.max(0, totalRepayment / usefulMonths);
      }, 0)
    : 0;

  const handleSubmit = () => {
    const amount = safeParse(form.amount || 0);
    const facilityRent = safeParse(form.facilityRent || 0);
    const facilityManagementFee = safeParse(form.facilityManagementFee || 0);
    const facilityDeposit = safeParse(form.facilityDeposit || 0);
    const facilityDepositLoanAmount = safeParse(form.facilityDepositLoanAmount || 0);
    const facilityDepositLoanRate = safeParse(form.facilityDepositLoanRate || 0);
    const facilityDepositMonths = contractMonths;
    const facilityMaintenance = safeParse(form.facilityMaintenance || 0);
    const facilityPurchasePrice = safeParse(form.facilityPurchasePrice || 0);
    const facilityCashPaid = safeParse(form.facilityCashPaid || 0);
    const hasManualLoanAmount = form.facilityLoanAmount.trim().length > 0;
    const facilityLoanAmount = hasManualLoanAmount
      ? safeParse(form.facilityLoanAmount || 0)
      : Math.max(0, facilityPurchasePrice - facilityCashPaid);
    const facilityLoanRate = safeParse(form.facilityLoanRate || 0);
    const facilityLoanGraceMonths = safeParse(form.facilityLoanGraceMonths || 0);
    const facilityLoanMethod = form.facilityLoanMethod || undefined;
    const facilityLoanCustomPayment = safeParse(form.facilityLoanCustomPayment || 0);
    const facilityLoanIncreasingStart = safeParse(form.facilityLoanIncreasingStart || 0);
    const facilityLoanIncreasingRate = safeParse(form.facilityLoanIncreasingRate || 0);
    const facilityPropertyTaxAnnual = safeParse(form.facilityPropertyTaxAnnual || 0);
    const facilityComprehensiveTaxAnnual = safeParse(form.facilityComprehensiveTaxAnnual || 0);
    const contractStart = form.facilityContractStart
      ? new Date(form.facilityContractStart)
      : null;
    const contractEnd = form.facilityContractEnd ? new Date(form.facilityContractEnd) : null;

    if (
      !usesDepreciation &&
      !isFacility &&
      !isUtilities &&
      form.category !== "labor" &&
      form.category !== "fees" &&
      form.category !== "marketing" &&
      form.category !== "etc" &&
      amount < 0
    ) {
      return setError("금액은 0 이상이어야 합니다.");
    }
    if (isFacility) {
      if (facilityType === "lease") {
        if (facilityRent < 0 || facilityManagementFee < 0) {
          return setError("임대료/관리비는 0 이상이어야 합니다.");
        }
        if (facilityDeposit < 0) {
          return setError("보증금은 0 이상이어야 합니다.");
        }
        if (facilityDepositLoanAmount < 0 || facilityDepositLoanRate < 0) {
          return setError("보증금 대출금/이율은 0 이상이어야 합니다.");
        }
        if (
          contractStart &&
          contractEnd &&
          !Number.isNaN(contractStart.valueOf()) &&
          !Number.isNaN(contractEnd.valueOf()) &&
          contractEnd < contractStart
        ) {
          return setError("계약 종료일은 시작일 이후여야 합니다.");
        }
        if (facilityDeposit > 0 && facilityDepositMonths <= 0) {
          return setError("계약기간을 입력하세요.");
        }
        if (form.facilityDepositLoanStart && form.facilityDepositLoanEnd) {
          const loanStart = new Date(form.facilityDepositLoanStart);
          const loanEnd = new Date(form.facilityDepositLoanEnd);
          if (
            !Number.isNaN(loanStart.valueOf()) &&
            !Number.isNaN(loanEnd.valueOf()) &&
            loanEnd < loanStart
          ) {
            return setError("보증금 대출 종료일은 시작일 이후여야 합니다.");
          }
        }
      }
      if (facilityType === "own") {
        if (facilityMaintenance < 0) {
          return setError("유지비는 0 이상이어야 합니다.");
        }
        if (facilityPropertyTaxAnnual < 0 || facilityComprehensiveTaxAnnual < 0) {
          return setError("재산세/종합부동산세는 0 이상이어야 합니다.");
        }
        if (facilityPurchasePrice < 0 || facilityCashPaid < 0) {
          return setError("구입금액/현금은 0 이상이어야 합니다.");
        }
        if (facilityLoanAmount < 0) {
          return setError("대출금액은 0 이상이어야 합니다.");
        }
        if (facilityLoanRate < 0 || facilityLoanGraceMonths < 0) {
          return setError("대출 이율/거치기간은 0 이상이어야 합니다.");
        }
        if (form.facilityLoanStart && form.facilityLoanEnd) {
          const loanStart = new Date(form.facilityLoanStart);
          const loanEnd = new Date(form.facilityLoanEnd);
          if (
            !Number.isNaN(loanStart.valueOf()) &&
            !Number.isNaN(loanEnd.valueOf()) &&
            loanEnd < loanStart
          ) {
            return setError("대출 종료일은 시작일 이후여야 합니다.");
          }
        }
        if (facilityLoanMethod === "increasing" && facilityLoanIncreasingStart <= 0) {
          return setError("체증식 초기 월 상환액을 입력하세요.");
        }
        if (facilityLoanMethod === "increasing" && facilityLoanIncreasingRate < 0) {
          return setError("체증식 증가율은 0 이상이어야 합니다.");
        }
        if (facilityLoanMethod === "other" && facilityLoanCustomPayment < 0) {
          return setError("월 상환액은 0 이상이어야 합니다.");
        }
      }
    }
    if (isUtilities) {
      const utilitiesElectric = safeParse(form.utilitiesElectric || 0);
      const utilitiesGas = safeParse(form.utilitiesGas || 0);
      const utilitiesWater = safeParse(form.utilitiesWater || 0);
      const utilitiesInternet = safeParse(form.utilitiesInternet || 0);
      if (
        utilitiesElectric < 0 ||
        utilitiesGas < 0 ||
        utilitiesWater < 0 ||
        utilitiesInternet < 0
      ) {
        return setError("공과금 세부 항목은 0 이상이어야 합니다.");
      }
      const negativeSubscription = form.utilitiesSubscriptionsItems.some(
        (item) => safeParse(item.amount || 0) < 0
      );
      if (negativeSubscription) {
        return setError("구독/정기 서비스 금액은 0 이상이어야 합니다.");
      }
      const negativeOther = form.utilitiesOtherItems.some(
        (item) => safeParse(item.amount || 0) < 0
      );
      if (negativeOther) {
        return setError("기타 공과금 금액은 0 이상이어야 합니다.");
      }
    }
    if (form.category === "labor") {
      const negativeLabor = form.laborItems.some((item) => safeParse(item.monthlyCost || 0) < 0);
      if (negativeLabor) {
        return setError("인건비 항목은 0 이상이어야 합니다.");
      }
    }
    if (form.category === "fees") {
      const negativeFees = form.feeItems.some((item) => safeParse(item.monthlyCost || 0) < 0);
      if (negativeFees) {
        return setError("수수료 항목은 0 이상이어야 합니다.");
      }
    }
    if (form.category === "marketing") {
      const negativeMarketing = form.marketingItems.some(
        (item) => safeParse(item.actualSpend || 0) < 0
      );
      if (negativeMarketing) {
        return setError("광고비 항목은 0 이상이어야 합니다.");
      }
    }
    if (form.category === "etc") {
      const negativeEtc = form.etcItems.some((item) => safeParse(item.monthlyCost || 0) < 0);
      if (negativeEtc) {
        return setError("기타 항목은 0 이상이어야 합니다.");
      }
    }
    if (usesDepreciation) {
      const hasInvalid = form.depreciationItems.some((item) => {
        const totalRepayment = safeParse(item.totalRepayment || 0);
        const usefulMonths = safeParse(item.usefulMonths || 0);
        if (totalRepayment < 0 || usefulMonths < 0) return true;
        return false;
      });
      if (hasInvalid) {
        return setError("시설비 항목의 총 상환액/감가기간을 확인하세요.");
      }
    }

    const payload: Overhead = {
      id: initial?.id ?? `overhead-${Date.now()}`,
      name: CATEGORY_LABELS[form.category],
      category: form.category,
      facilityType: form.category === "facility" ? facilityType : undefined,
      amount: usesDepreciation
        ? depreciationMonthly
        : isFacility
        ? facilityMonthly
        : isUtilities
        ? utilitiesMonthly
        : form.category === "labor"
        ? laborMonthly
        : form.category === "fees"
        ? feeMonthly
        : form.category === "marketing"
        ? marketingMonthly
        : form.category === "etc"
        ? etcMonthly
        : amount,
      calcMethod: usesDepreciation ? "depreciation" : "monthly",
      facilityRent: isFacility && facilityType === "lease" ? facilityRent : undefined,
      facilityManagementFee:
        isFacility && facilityType === "lease" ? facilityManagementFee : undefined,
      facilityDeposit: isFacility && facilityType === "lease" ? facilityDeposit : undefined,
      facilityDepositMonths: isFacility && facilityType === "lease" ? facilityDepositMonths : undefined,
      facilityContractStart:
        isFacility && facilityType === "lease" ? form.facilityContractStart : undefined,
      facilityContractEnd:
        isFacility && facilityType === "lease" ? form.facilityContractEnd : undefined,
      facilityDepositLoanAmount:
        isFacility && facilityType === "lease" ? facilityDepositLoanAmount : undefined,
      facilityDepositLoanRate:
        isFacility && facilityType === "lease" ? facilityDepositLoanRate : undefined,
      facilityDepositLoanStart:
        isFacility && facilityType === "lease" ? form.facilityDepositLoanStart : undefined,
      facilityDepositLoanEnd:
        isFacility && facilityType === "lease" ? form.facilityDepositLoanEnd : undefined,
      facilityMaintenance: isFacility && facilityType === "own" ? facilityMaintenance : undefined,
      facilityPurchasePrice:
        isFacility && facilityType === "own" ? facilityPurchasePrice : undefined,
      facilityCashPaid: isFacility && facilityType === "own" ? facilityCashPaid : undefined,
      facilityLoanAmount: isFacility && facilityType === "own" ? facilityLoanAmount : undefined,
      facilityLoanRate: isFacility && facilityType === "own" ? facilityLoanRate : undefined,
      facilityLoanStart: isFacility && facilityType === "own" ? form.facilityLoanStart : undefined,
      facilityLoanEnd: isFacility && facilityType === "own" ? form.facilityLoanEnd : undefined,
      facilityLoanGraceMonths:
        isFacility && facilityType === "own" ? facilityLoanGraceMonths : undefined,
      facilityLoanMethod: isFacility && facilityType === "own" ? facilityLoanMethod : undefined,
      facilityLoanCustomPayment:
        isFacility && facilityType === "own" ? facilityLoanCustomPayment : undefined,
      facilityLoanIncreasingStart:
        isFacility && facilityType === "own" ? facilityLoanIncreasingStart : undefined,
      facilityLoanIncreasingRate:
        isFacility && facilityType === "own" ? facilityLoanIncreasingRate : undefined,
      facilityPropertyTaxAnnual:
        isFacility && facilityType === "own" ? facilityPropertyTaxAnnual : undefined,
      facilityComprehensiveTaxAnnual:
        isFacility && facilityType === "own" ? facilityComprehensiveTaxAnnual : undefined,
      utilitiesElectric: isUtilities ? safeParse(form.utilitiesElectric || 0) : undefined,
      utilitiesGas: isUtilities ? safeParse(form.utilitiesGas || 0) : undefined,
      utilitiesWater: isUtilities ? safeParse(form.utilitiesWater || 0) : undefined,
      utilitiesInternet: isUtilities ? safeParse(form.utilitiesInternet || 0) : undefined,
      utilitiesSubscriptions: isUtilities ? subscriptionsTotal : undefined,
      utilitiesSubscriptionsItems: isUtilities
        ? form.utilitiesSubscriptionsItems
            .filter((item) => item.name.trim() || safeParse(item.amount || 0) > 0)
            .map((item) => ({
              id: item.id || `sub-${Date.now()}`,
              name: item.name.trim(),
              amount: safeParse(item.amount || 0),
            }))
        : undefined,
      utilitiesOther: isUtilities ? otherUtilitiesTotal : undefined,
      utilitiesOtherItems: isUtilities
        ? form.utilitiesOtherItems
            .filter((item) => item.name.trim() || safeParse(item.amount || 0) > 0)
            .map((item) => ({
              id: item.id || `util-${Date.now()}`,
              name: item.name.trim(),
              amount: safeParse(item.amount || 0),
            }))
        : undefined,
      laborItems:
        form.category === "labor"
          ? form.laborItems
              .filter((item) => item.name.trim() || safeParse(item.monthlyCost || 0) > 0)
              .map((item) => ({
                id: item.id || `labor-${Date.now()}`,
                name: item.name.trim(),
                monthlyCost: safeParse(item.monthlyCost || 0),
              }))
          : undefined,
      feeItems:
        form.category === "fees"
          ? form.feeItems
              .filter((item) => item.name.trim() || safeParse(item.monthlyCost || 0) > 0)
              .map((item) => ({
                id: item.id || `fee-${Date.now()}`,
                name: item.name.trim(),
                monthlyCost: safeParse(item.monthlyCost || 0),
              }))
          : undefined,
      marketingItems:
        form.category === "marketing"
          ? form.marketingItems
              .filter((item) => item.platform.trim() || safeParse(item.actualSpend || 0) > 0)
              .map((item) => ({
                id: item.id || `mkt-${Date.now()}`,
                platform: item.platform.trim(),
                actualSpend: safeParse(item.actualSpend || 0),
              }))
          : undefined,
      etcItems:
        form.category === "etc"
          ? form.etcItems
              .filter((item) => item.name.trim() || safeParse(item.monthlyCost || 0) > 0)
              .map((item) => ({
                id: item.id || `etc-${Date.now()}`,
                name: item.name.trim(),
                monthlyCost: safeParse(item.monthlyCost || 0),
              }))
          : undefined,
      depreciationItems: usesDepreciation
        ? form.depreciationItems
            .filter(
              (item) =>
                item.name.trim() ||
                safeParse(item.totalRepayment || 0) > 0 ||
                safeParse(item.usefulMonths || 0) > 0
            )
            .map((item) => ({
              id: item.id || `dep-${Date.now()}`,
              name: item.name.trim(),
              purchaseDate: item.purchaseDate || undefined,
              paymentMethod: item.paymentMethod || "cash",
              totalRepayment: safeParse(item.totalRepayment || 0),
              usefulMonths: safeParse(item.usefulMonths || 0),
              salvageValue: 0,
            }))
        : undefined,
      createdAt: initial?.createdAt ?? Date.now(),
    };

    onSave(payload);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ink-muted">카테고리</label>
        <Select
          value={form.category}
          onChange={(event) =>
            setForm({ ...form, category: event.target.value as OverheadCategory })
          }
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {isFacility && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-muted">구분</label>
            <Select
              value={facilityType}
              onChange={(event) =>
                setForm({ ...form, facilityType: event.target.value as "lease" | "own" })
              }
            >
              <option value="lease">임대</option>
              <option value="own">자가</option>
            </Select>
          </div>
          {facilityType === "lease" ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">월 임대료 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityRent}
                    onChange={(event) => setForm({ ...form, facilityRent: event.target.value })}
                    placeholder="예: 1500000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">월 관리비 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityManagementFee}
                    onChange={(event) =>
                      setForm({ ...form, facilityManagementFee: event.target.value })
                    }
                    placeholder="예: 200000"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">보증금 (원, 선택)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityDeposit}
                    onChange={(event) => setForm({ ...form, facilityDeposit: event.target.value })}
                    placeholder="예: 20000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">계약 시작일</label>
                  <Input
                    type="date"
                    value={form.facilityContractStart}
                    onChange={(event) =>
                      setForm({ ...form, facilityContractStart: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">계약 종료일</label>
                  <Input
                    type="date"
                    value={form.facilityContractEnd}
                    onChange={(event) =>
                      setForm({ ...form, facilityContractEnd: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
                보증금 대출이 있다면 아래를 입력하세요.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">보증금 대출금 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityDepositLoanAmount}
                    onChange={(event) =>
                      setForm({ ...form, facilityDepositLoanAmount: event.target.value })
                    }
                    placeholder="예: 15000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 이율 (연 %)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityDepositLoanRate}
                    onChange={(event) =>
                      setForm({ ...form, facilityDepositLoanRate: event.target.value })
                    }
                    placeholder="예: 4.5"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 시작일</label>
                  <Input
                    type="date"
                    value={form.facilityDepositLoanStart}
                    onChange={(event) =>
                      setForm({ ...form, facilityDepositLoanStart: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 종료일</label>
                  <Input
                    type="date"
                    value={form.facilityDepositLoanEnd}
                    onChange={(event) =>
                      setForm({ ...form, facilityDepositLoanEnd: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
                월 공간비 합계: <span className="font-semibold text-ink">{formatKRW(facilityMonthly)}원</span>
                {contractMonths > 0 && (
                  <span className="ml-2 text-xs text-ink-muted">(계약기간 {contractMonths}개월)</span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">건물 관리비 (월, 원)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.facilityMaintenance}
                  onChange={(event) =>
                    setForm({ ...form, facilityMaintenance: event.target.value })
                  }
                  placeholder="예: 300000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">건물 구입금액 (원)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.facilityPurchasePrice}
                  onChange={(event) =>
                    setForm({ ...form, facilityPurchasePrice: event.target.value })
                  }
                  placeholder="예: 500000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">현금 지급액 (원)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.facilityCashPaid}
                  onChange={(event) => setForm({ ...form, facilityCashPaid: event.target.value })}
                  placeholder="예: 200000000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">대출금액 (원, 직접 입력 가능)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.facilityLoanAmount}
                  onChange={(event) => setForm({ ...form, facilityLoanAmount: event.target.value })}
                  placeholder="예: 300000000"
                />
                <p className="text-xs text-ink-muted">자동 계산 대출금액: {formatKRW(derivedLoanAmount)}원</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 시작일</label>
                  <Input
                    type="date"
                    value={form.facilityLoanStart}
                    onChange={(event) => setForm({ ...form, facilityLoanStart: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 종료일</label>
                  <Input
                    type="date"
                    value={form.facilityLoanEnd}
                    onChange={(event) => setForm({ ...form, facilityLoanEnd: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">대출 이율 (연 %)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityLoanRate}
                    onChange={(event) => setForm({ ...form, facilityLoanRate: event.target.value })}
                    placeholder="예: 4.2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">거치기간 (개월)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityLoanGraceMonths}
                    onChange={(event) =>
                      setForm({ ...form, facilityLoanGraceMonths: event.target.value })
                    }
                    placeholder="예: 6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">상환 방식</label>
                <Select
                  value={form.facilityLoanMethod}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      facilityLoanMethod: event.target.value as
                        | ""
                        | "annuity"
                        | "equal_principal"
                        | "balloon"
                        | "increasing"
                        | "other",
                    })
                  }
                >
                  <option value="">선택 안 함</option>
                  <option value="annuity">원리금균등</option>
                  <option value="equal_principal">원금균등</option>
                  <option value="balloon">만기일시</option>
                  <option value="increasing">체증식</option>
                  <option value="other">기타(직접 입력)</option>
                </Select>
              </div>
              {form.facilityLoanMethod === "other" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">월 상환액 (원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityLoanCustomPayment}
                    onChange={(event) =>
                      setForm({ ...form, facilityLoanCustomPayment: event.target.value })
                    }
                    placeholder="예: 800000"
                  />
                </div>
              )}
              {form.facilityLoanMethod === "increasing" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-ink-muted">초기 월 상환액 (원)</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.facilityLoanIncreasingStart}
                      onChange={(event) =>
                        setForm({ ...form, facilityLoanIncreasingStart: event.target.value })
                      }
                      placeholder="예: 500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-ink-muted">월 증가율 (%)</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.facilityLoanIncreasingRate}
                      onChange={(event) =>
                        setForm({ ...form, facilityLoanIncreasingRate: event.target.value })
                      }
                      placeholder="예: 2"
                    />
                  </div>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">재산세 (연 1회, 원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityPropertyTaxAnnual}
                    onChange={(event) =>
                      setForm({ ...form, facilityPropertyTaxAnnual: event.target.value })
                    }
                    placeholder="예: 1800000"
                  />
                  {safeParse(form.facilityPropertyTaxAnnual || 0) > 0 && (
                    <p className="text-xs text-ink-muted">
                      월 환산 {formatKRW(safeParse(form.facilityPropertyTaxAnnual || 0) / 12)}원
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-muted">종합부동산세 (연 1회, 원)</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.facilityComprehensiveTaxAnnual}
                    onChange={(event) =>
                      setForm({ ...form, facilityComprehensiveTaxAnnual: event.target.value })
                    }
                    placeholder="예: 1200000"
                  />
                  {safeParse(form.facilityComprehensiveTaxAnnual || 0) > 0 && (
                    <p className="text-xs text-ink-muted">
                      월 환산 {formatKRW(safeParse(form.facilityComprehensiveTaxAnnual || 0) / 12)}원
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
                월 공간비 합계: <span className="font-semibold text-ink">{formatKRW(facilityMonthly)}원</span>
                {loanMonths > 0 && (
                  <span className="ml-2 text-xs text-ink-muted">(대출기간 {loanMonths}개월)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {form.category === "labor" && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">직원별 인건비 (월)</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  ...form,
                  laborItems: [
                    ...form.laborItems,
                    { id: `labor-${Date.now()}`, name: "", monthlyCost: "" },
                  ],
                })
              }
            >
              + 직원 추가
            </Button>
          </div>
          {form.laborItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
              직원 인건비를 추가해 주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {form.laborItems.map((item, index) => (
                <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                  <Input
                    value={item.name}
                    onChange={(event) => {
                      const next = [...form.laborItems];
                      next[index] = { ...next[index], name: event.target.value };
                      setForm({ ...form, laborItems: next });
                    }}
                    placeholder="직원명/직책"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={item.monthlyCost}
                    onChange={(event) => {
                      const next = [...form.laborItems];
                      next[index] = { ...next[index], monthlyCost: event.target.value };
                      setForm({ ...form, laborItems: next });
                    }}
                    placeholder="월 급여"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = form.laborItems.filter((_, idx) => idx !== index);
                      setForm({ ...form, laborItems: next });
                    }}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 인건비 합계: <span className="font-semibold text-ink">{formatKRW(laborTotal)}원</span>
          </div>
        </div>
      )}

      {form.category === "fees" && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">수수료 항목 (월)</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  ...form,
                  feeItems: [...form.feeItems, { id: `fee-${Date.now()}`, name: "", monthlyCost: "" }],
                })
              }
            >
              + 항목 추가
            </Button>
          </div>
          {form.feeItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
              수수료 항목을 추가해 주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {form.feeItems.map((item, index) => (
                <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                  <Input
                    value={item.name}
                    onChange={(event) => {
                      const next = [...form.feeItems];
                      next[index] = { ...next[index], name: event.target.value };
                      setForm({ ...form, feeItems: next });
                    }}
                    placeholder="항목명"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={item.monthlyCost}
                    onChange={(event) => {
                      const next = [...form.feeItems];
                      next[index] = { ...next[index], monthlyCost: event.target.value };
                      setForm({ ...form, feeItems: next });
                    }}
                    placeholder="월 금액"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = form.feeItems.filter((_, idx) => idx !== index);
                      setForm({ ...form, feeItems: next });
                    }}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 수수료 합계: <span className="font-semibold text-ink">{formatKRW(feeTotal)}원</span>
          </div>
        </div>
      )}

      {form.category === "marketing" && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">광고 집행 내역 (월)</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  ...form,
                  marketingItems: [
                    ...form.marketingItems,
                    { id: `mkt-${Date.now()}`, platform: "", actualSpend: "" },
                  ],
                })
              }
            >
              + 항목 추가
            </Button>
          </div>
          {form.marketingItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
              광고 플랫폼을 추가해 주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {form.marketingItems.map((item, index) => (
                <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                  <Input
                    value={item.platform}
                    onChange={(event) => {
                      const next = [...form.marketingItems];
                      next[index] = { ...next[index], platform: event.target.value };
                      setForm({ ...form, marketingItems: next });
                    }}
                    placeholder="플랫폼명"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={item.actualSpend}
                    onChange={(event) => {
                      const next = [...form.marketingItems];
                      next[index] = { ...next[index], actualSpend: event.target.value };
                      setForm({ ...form, marketingItems: next });
                    }}
                    placeholder="실제 집행액"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = form.marketingItems.filter((_, idx) => idx !== index);
                      setForm({ ...form, marketingItems: next });
                    }}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 광고비 합계: <span className="font-semibold text-ink">{formatKRW(marketingTotal)}원</span>
          </div>
        </div>
      )}

      {form.category === "etc" && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-ink-muted">기타 항목 (월)</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  ...form,
                  etcItems: [...form.etcItems, { id: `etc-${Date.now()}`, name: "", monthlyCost: "" }],
                })
              }
            >
              + 항목 추가
            </Button>
          </div>
          {form.etcItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
              기타 항목을 추가해 주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {form.etcItems.map((item, index) => (
                <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                  <Input
                    value={item.name}
                    onChange={(event) => {
                      const next = [...form.etcItems];
                      next[index] = { ...next[index], name: event.target.value };
                      setForm({ ...form, etcItems: next });
                    }}
                    placeholder="항목명"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={item.monthlyCost}
                    onChange={(event) => {
                      const next = [...form.etcItems];
                      next[index] = { ...next[index], monthlyCost: event.target.value };
                      setForm({ ...form, etcItems: next });
                    }}
                    placeholder="월 금액"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = form.etcItems.filter((_, idx) => idx !== index);
                      setForm({ ...form, etcItems: next });
                    }}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 기타 합계: <span className="font-semibold text-ink">{formatKRW(etcTotal)}원</span>
          </div>
        </div>
      )}

      {usesDepreciation && (
        <div className="space-y-3 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">매장 집기/시설/장비 구매분을 감가상각으로 계산합니다.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm({
                  ...form,
                  depreciationItems: [
                    ...form.depreciationItems,
                    {
                      id: `dep-${Date.now()}`,
                      name: "",
                      purchaseDate: "",
                      paymentMethod: "cash",
                      totalRepayment: "",
                      usefulMonths: "36",
                    },
                  ],
                })
              }
            >
              + 품목 추가
            </Button>
          </div>
          <div className="space-y-2">
            {form.depreciationItems.map((item, index) => (
              <details
                key={item.id || index}
                className="rounded-xl border border-[var(--line)] bg-white p-3"
                open={!item.name && !item.totalRepayment}
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-ink">
                  <span>{item.name || "시설 품목"}</span>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    월 {formatKRW(
                      (() => {
                        const total = safeParse(item.totalRepayment || 0);
                        const months = safeParse(item.usefulMonths || 0);
                        if (total <= 0 || months <= 0) return 0;
                        return Math.max(0, total / months);
                      })()
                    )}
                    원
                    <span className="summary-chevron text-ink-muted">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M6 9l6 6 6-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <Input
                      value={item.name}
                      onChange={(event) => {
                        const next = [...form.depreciationItems];
                        next[index] = { ...next[index], name: event.target.value };
                        setForm({ ...form, depreciationItems: next });
                      }}
                      placeholder="품목명"
                    />
                    <Input
                      type="date"
                      value={item.purchaseDate}
                      onChange={(event) => {
                        const next = [...form.depreciationItems];
                        next[index] = { ...next[index], purchaseDate: event.target.value };
                        setForm({ ...form, depreciationItems: next });
                      }}
                    />
                    <Select
                      value={item.paymentMethod}
                      onChange={(event) => {
                        const next = [...form.depreciationItems];
                        next[index] = {
                          ...next[index],
                          paymentMethod: event.target.value as "cash" | "installment" | "lease",
                        };
                        setForm({ ...form, depreciationItems: next });
                      }}
                    >
                      <option value="cash">현금구매</option>
                      <option value="installment">할부구매</option>
                      <option value="lease">인수형 렌탈/리스</option>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next = form.depreciationItems.filter((_, idx) => idx !== index);
                        setForm({ ...form, depreciationItems: next });
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
                    <div className="space-y-1">
                      <Input
                        type="number"
                        min="0"
                        value={item.totalRepayment}
                        onChange={(event) => {
                          const next = [...form.depreciationItems];
                          next[index] = { ...next[index], totalRepayment: event.target.value };
                          setForm({ ...form, depreciationItems: next });
                        }}
                        placeholder="총 구매비용(수수료 포함)"
                      />
                      <p className="text-xs text-ink-muted">총 구매비용은 실제 지출 총액입니다.</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={item.usefulMonths}
                      onChange={(event) => {
                        const next = [...form.depreciationItems];
                        next[index] = { ...next[index], usefulMonths: event.target.value };
                        setForm({ ...form, depreciationItems: next });
                      }}
                      placeholder="감가기간(개월)"
                    />
                  </div>
                  <p className="text-xs text-ink-muted">
                    {(() => {
                      if (!item.purchaseDate) return "구매시기 입력 시 경과 개월이 계산됩니다.";
                      const start = new Date(item.purchaseDate);
                      if (Number.isNaN(start.valueOf())) return "구매시기 형식을 확인하세요.";
                      const elapsed = calcMonthDiff(start, new Date());
                      const total = safeParse(item.usefulMonths || 0);
                      const remain = total > 0 ? Math.max(0, total - elapsed) : 0;
                      return `경과 ${elapsed}개월 · 남은 ${remain}개월`;
                    })()}
                  </p>
                </div>
              </details>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 감가상각비 합계: <span className="font-semibold text-ink">{formatKRW(depreciationMonthly)}원</span>
          </div>
        </div>
      )}

      {isUtilities && (
        <div className="space-y-4 rounded-2xl border border-dashed border-[var(--line)] bg-white/70 p-4">
          <div>
            <p className="text-xs font-semibold text-ink-muted">기본 공과금</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">전기료 (월)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.utilitiesElectric}
                  onChange={(event) => setForm({ ...form, utilitiesElectric: event.target.value })}
                  placeholder="예: 200000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">가스비 (월)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.utilitiesGas}
                  onChange={(event) => setForm({ ...form, utilitiesGas: event.target.value })}
                  placeholder="예: 80000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">수도요금 (월)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.utilitiesWater}
                  onChange={(event) => setForm({ ...form, utilitiesWater: event.target.value })}
                  placeholder="예: 50000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">인터넷/통신비 (월)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.utilitiesInternet}
                  onChange={(event) => setForm({ ...form, utilitiesInternet: event.target.value })}
                  placeholder="예: 40000"
                />
              </div>
            </div>
          </div>

          <details className="rounded-xl border border-[var(--line)] bg-white p-3">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-ink">
              <span>구독/정기 서비스 (장비 렌탈 포함)</span>
              <span className="summary-chevron text-ink-muted">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">서비스별로 월 금액을 입력하세요.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      utilitiesSubscriptionsItems: [
                        ...form.utilitiesSubscriptionsItems,
                        { id: `sub-${Date.now()}`, name: "", amount: "" },
                      ],
                    })
                  }
                >
                  + 항목 추가
                </Button>
              </div>
              {form.utilitiesSubscriptionsItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
                  구독 항목을 추가해 주세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.utilitiesSubscriptionsItems.map((item, index) => (
                    <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                      <Input
                        value={item.name}
                        onChange={(event) => {
                          const next = [...form.utilitiesSubscriptionsItems];
                          next[index] = { ...next[index], name: event.target.value };
                          setForm({ ...form, utilitiesSubscriptionsItems: next });
                        }}
                        placeholder="서비스명 예: POS/정수기"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={item.amount}
                        onChange={(event) => {
                          const next = [...form.utilitiesSubscriptionsItems];
                          next[index] = { ...next[index], amount: event.target.value };
                          setForm({ ...form, utilitiesSubscriptionsItems: next });
                        }}
                        placeholder="월 금액"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = form.utilitiesSubscriptionsItems.filter((_, idx) => idx !== index);
                          setForm({ ...form, utilitiesSubscriptionsItems: next });
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          <details className="rounded-xl border border-[var(--line)] bg-white p-3">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-ink">
              <span>기타 공과금</span>
              <span className="summary-chevron text-ink-muted">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">누락된 항목을 추가해 주세요.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      utilitiesOtherItems: [
                        ...form.utilitiesOtherItems,
                        { id: `other-${Date.now()}`, name: "", amount: "" },
                      ],
                    })
                  }
                >
                  + 항목 추가
                </Button>
              </div>
              {form.utilitiesOtherItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-3 text-xs text-ink-muted">
                  기타 항목을 추가해 주세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.utilitiesOtherItems.map((item, index) => (
                    <div key={item.id || index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
                      <Input
                        value={item.name}
                        onChange={(event) => {
                          const next = [...form.utilitiesOtherItems];
                          next[index] = { ...next[index], name: event.target.value };
                          setForm({ ...form, utilitiesOtherItems: next });
                        }}
                        placeholder="항목명 예: 보일러 유지"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={item.amount}
                        onChange={(event) => {
                          const next = [...form.utilitiesOtherItems];
                          next[index] = { ...next[index], amount: event.target.value };
                          setForm({ ...form, utilitiesOtherItems: next });
                        }}
                        placeholder="월 금액"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = form.utilitiesOtherItems.filter((_, idx) => idx !== index);
                          setForm({ ...form, utilitiesOtherItems: next });
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          <div className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm text-ink-muted">
            월 공과금 합계: <span className="font-semibold text-ink">{formatKRW(utilitiesMonthly)}원</span>
          </div>
        </div>
      )}

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
