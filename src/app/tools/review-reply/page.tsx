"use client";

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type Tone =
  | "정중형"
  | "친근형"
  | "담백형"
  | "공감형"
  | "단호형"
  | "유머형"
  | "논리형"
  | "열정형"
  | "차분형"
  | "권위형";

type Reply = {
  title: string;
  text: string;
  createdAt?: string;
};

type TemplateConfig = {
  id: string;
  name: string;
  industry: string;
  customIndustry: string;
  storeName: string;
  servicesText: string;
  tone: Tone;
  replyTypes: string[];
  storeTone: string;
  introText: string;
  outroText: string;
};

type ReplyTypeOption = {
  id: string;
  label: string;
  description: string;
};

type SnippetCategory = "intro" | "outro" | "extra";

type AutoResizeTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minRows?: number;
  disabled?: boolean;
};

type InfoPopoverProps = {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

const AutoResizeTextarea = ({
  value,
  onChange,
  className,
  minRows = 3,
  disabled,
}: AutoResizeTextareaProps) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      rows={minRows}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ resize: "none", overflow: "hidden" }}
    />
  );
};

const InfoPopover = ({
  title,
  description,
  isOpen,
  onToggle,
  onClose,
}: InfoPopoverProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const width = 288; // w-72
      const padding = 8;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - width / 2, padding),
        window.innerWidth - width - padding
      );
      const top = rect.bottom + 8;
      setCoords({ top, left });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "ml-2 flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold",
          isOpen
            ? "border-slate-900 bg-slate-100 text-slate-900"
            : "border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
        )}
        aria-label="도움말"
      >
        i
      </button>
      {isOpen &&
        portalEl &&
        createPortal(
          <div
            className="fixed z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
            style={{ top: coords.top, left: coords.left }}
          >
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {description}
            </p>
          </div>,
          portalEl
        )}
    </div>
  );
};

const industryOptions = [
  "카페/디저트",
  "배달음식(치킨/피자/분식)",
  "음식점(홀)",
  "미용/네일/피부",
  "헬스/PT/필라테스",
  "숙박/펜션",
  "온라인쇼핑(스마트스토어 등)",
  "기타(직접입력)",
];

const toneOptions: { id: Tone; label: string; description: string }[] = [
  { id: "정중형", label: "정중형", description: "예의 있고 격식 있는 톤" },
  { id: "친근형", label: "친근형", description: "부드럽고 거리감 낮은 톤" },
  { id: "담백형", label: "담백형", description: "짧고 깔끔하게 핵심만" },
  { id: "공감형", label: "공감형", description: "감정을 먼저 받아주는 톤" },
  { id: "단호형", label: "단호형", description: "기준/정책을 분명히 안내" },
  { id: "유머형", label: "유머형", description: "가벼운 위트로 부드럽게" },
  { id: "논리형", label: "논리형", description: "근거·순서·사실 중심 안내" },
  { id: "열정형", label: "열정형", description: "에너지 있고 적극적인 톤" },
  { id: "차분형", label: "차분형", description: "안정적이고 침착한 톤" },
  { id: "권위형", label: "권위형", description: "전문가 느낌으로 리드" },
];

const StatusChip = ({ done }: { done: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold",
      done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
    )}
  >
    {done ? "완료" : "미완"}
  </span>
);

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

const replyTypeOptions: ReplyTypeOption[] = [
  {
    id: "개인화 응대형",
    label: "개인화 응대형",
    description: "고객이 언급한 포인트 반영",
  },
  {
    id: "사과·공감형",
    label: "사과·공감형",
    description: "불편 사과 + 감정 공감",
  },
  {
    id: "사실 확인형",
    label: "사실 확인형",
    description: "주문/시간/상황 정보 확인 요청",
  },
  {
    id: "해결 안내형",
    label: "해결 안내형",
    description: "지금 가능한 조치와 절차 안내",
  },
  {
    id: "재발 방지 약속형",
    label: "재발 방지 약속형",
    description: "내부 개선/교육/프로세스 보완",
  },
  {
    id: "원인 설명형",
    label: "원인 설명형",
    description: "변명 없이 간단한 원인 설명",
  },
  {
    id: "보상 대신 대안 제시형",
    label: "보상 대신 대안 제시형",
    description: "환불/보상 없이 가능한 대안 제시",
  },
  {
    id: "감사·칭찬 수용형",
    label: "감사·칭찬 수용형",
    description: "칭찬에 감사 + 강점 강조",
  },
  {
    id: "리뷰 유도형",
    label: "리뷰 유도형",
    description: "만족 시 리뷰/사진/재방문 부탁",
  },
  {
    id: "재방문 유도형",
    label: "재방문 유도형",
    description: "다음 방문 기대와 환대",
  },
  {
    id: "브랜드 톤 강화형",
    label: "브랜드 톤 강화형",
    description: "가치/철학 한 문장 반영",
  },
  {
    id: "정정·오해 해소형",
    label: "정정·오해 해소형",
    description: "사실과 다른 부분을 정중히 정정",
  },
  {
    id: "정책 안내형",
    label: "정책 안내형",
    description: "교환/환불/운영시간 등 정책 안내",
  },
  {
    id: "안전·위생 안심형",
    label: "안전·위생 안심형",
    description: "위생/품질 관리 프로세스 언급",
  },
  {
    id: "속도·지연 사과형",
    label: "속도·지연 사과형",
    description: "대기/배송 지연 사과 + 개선",
  },
  {
    id: "품질 점검형",
    label: "품질 점검형",
    description: "맛/온도/포장/양 점검 및 조치",
  },
  {
    id: "진정·갈등 완화형",
    label: "진정·갈등 완화형",
    description: "감정 진정, 갈등 완화",
  },
  {
    id: "외부요인 분리형",
    label: "외부요인 분리형",
    description: "외부 요소를 공격 없이 분리 설명",
  },
  {
    id: "추가 채널 유도형",
    label: "추가 채널 유도형",
    description: "민감한 내용은 DM/전화로 안내",
  },
  {
    id: "요약·마무리형",
    label: "요약·마무리형",
    description: "핵심 한 줄 + 더 잘하겠다는 마무리",
  },
];

const replyTypeKeywords: Record<string, string[]> = {
  "사과·공감형": [
    "불편",
    "실망",
    "불친절",
    "짜증",
    "최악",
    "기분 나쁨",
    "불량",
    "맛없",
    "별로",
    "안 좋",
    "실수",
    "실패",
    "형편없",
  ],
  "사실 확인형": [
    "주문번호",
    "결제시간",
    "몇 시",
    "어느 테이블",
    "포장",
    "배달",
    "누가",
    "언제",
    "어디서",
    "애매",
    "좋지 않",
    "별로",
    "다시 안",
    "이번엔",
  ],
  "해결 안내형": [
    "다시 조리",
    "교환",
    "확인 후 연락",
    "처리",
    "조치",
    "접수",
    "바로 조치",
    "대응",
    "애매",
    "좋지 않",
    "별로",
    "다시 안",
    "이번엔",
  ],
  "재발 방지 약속형": [
    "개선",
    "교육",
    "재발",
    "점검",
    "매뉴얼",
    "프로세스",
    "관리 강화",
  ],
  "원인 설명형": [
    "재고",
    "기계 고장",
    "인력 부족",
    "날씨",
    "물량",
    "착오",
    "오해",
    "혼선",
  ],
  "보상 대신 대안 제시형": [
    "보상",
    "환불",
    "대안",
    "재조리",
    "다시 준비",
    "다음 방문",
    "다시 제공",
  ],
  "감사·칭찬 수용형": [
    "맛있",
    "친절",
    "최고",
    "만족",
    "감사",
    "추천",
    "예쁘",
    "깔끔",
    "좋았",
    "또 올게",
  ],
  "리뷰 유도형": ["리뷰", "사진", "후기", "공유", "남겨", "평가"],
  "재방문 유도형": ["또", "다음", "재방문", "단골", "자주", "다시 올게"],
  "브랜드 톤 강화형": [
    "철학",
    "가치",
    "원칙",
    "고집",
    "정성",
    "수제",
    "신념",
    "컨셉",
  ],
  "정정·오해 해소형": ["오해", "사실과 다름", "정정", "확인 결과", "잘못 알려"],
  "정책 안내형": [
    "교환",
    "환불",
    "운영시간",
    "라스트오더",
    "예약",
    "포장 정책",
    "규정",
    "정책",
  ],
  "안전·위생 안심형": [
    "위생",
    "청결",
    "소독",
    "온도",
    "보관",
    "유통기한",
    "안전",
  ],
  "속도·지연 사과형": [
    "지연",
    "늦게",
    "대기",
    "오래",
    "시간 초과",
    "배달 늦",
    "늦었",
  ],
  "품질 점검형": [
    "온도",
    "식은",
    "짜다",
    "싱겁",
    "양이 적",
    "양이 많",
    "양이 부족",
    "양이 적었",
    "포장 터짐",
    "눅눅",
    "식감",
    "기름짐",
  ],
  "개인화 응대형": [
    "라떼",
    "시그니처",
    "케이크",
    "디저트",
    "좌석",
    "분위기",
    "직원",
    "친절한",
    "인테리어",
  ],
  "진정·갈등 완화형": ["화났", "불쾌", "기분", "항의", "언성", "갈등", "싸움"],
  "외부요인 분리형": [
    "배달기사",
    "라이더",
    "플랫폼",
    "앱",
    "시스템 오류",
    "결제 오류",
    "배달 문제",
  ],
  "추가 채널 유도형": ["전화", "dm", "채팅", "톡", "메일", "직접 연락", "상담"],
  "요약·마무리형": ["한 줄", "요약", "정리", "결론", "핵심", "요점"],
};

const fallbackRecommended = ["개인화 응대형", "사실 확인형", "안내형"];

export default function HomePage() {
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [reviewsText, setReviewsText] = useState("");
  const [tone, setTone] = useState<Tone>("정중형");
  const [storeTone, setStoreTone] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [introText, setIntroText] = useState("");
  const [outroText, setOutroText] = useState("");
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedReplyTypes, setSelectedReplyTypes] = useState<string[]>([
    replyTypeOptions[0].id,
  ]);
  const [savedIntros, setSavedIntros] = useState<string[]>([]);
  const [savedOutros, setSavedOutros] = useState<string[]>([]);
  const [savedExtras, setSavedExtras] = useState<string[]>([]);
  const [snippetModal, setSnippetModal] = useState<SnippetCategory | null>(
    null
  );
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateAddModal, setTemplateAddModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copiedRecentKey, setCopiedRecentKey] = useState<string | null>(null);
  const [recentReplies, setRecentReplies] = useState<Reply[]>([]);
  const [recentModalOpen, setRecentModalOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [openTemplateInfo, setOpenTemplateInfo] =
    useState<TemplateConfig | null>(null);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(true);
  const [autoApply, setAutoApply] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);
  const industryRef = useRef<HTMLDivElement | null>(null);
  const reviewRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const templateToggleRef = useRef<HTMLButtonElement | null>(null);
  const handleIntroBlur = () =>
    saveSnippet(introText, savedIntros, setSavedIntros, "머릿말", {
      silent: true,
    });
  const handleOutroBlur = () =>
    saveSnippet(outroText, savedOutros, setSavedOutros, "꼬릿말", {
      silent: true,
    });
  const handleExtraBlur = () =>
    saveSnippet(storeTone, savedExtras, setSavedExtras, "기타 요청사항", {
      silent: true,
    });

  // Portal not used; toasts render directly with high z-index

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const introStored = window.localStorage.getItem("savedIntros");
      const outroStored = window.localStorage.getItem("savedOutros");
      const extraStored = window.localStorage.getItem("savedExtras");
      const templateStored = window.localStorage.getItem("savedTemplatesV1");
      const recentStored = window.localStorage.getItem("recentReplies");
      const tutorialStored = window.localStorage.getItem("tutorialDismissedV1");
      if (introStored) setSavedIntros(JSON.parse(introStored));
      if (outroStored) setSavedOutros(JSON.parse(outroStored));
      if (extraStored) setSavedExtras(JSON.parse(extraStored));
      if (templateStored) {
        const parsed = JSON.parse(templateStored);
        const migrated = Array.isArray(parsed)
          ? parsed.map((tpl: any) => ({
              ...tpl,
              storeName: tpl?.storeName ?? "",
            }))
          : [];
        setTemplates(migrated);
      }
      if (recentStored) setRecentReplies(JSON.parse(recentStored));
    } catch {
      // ignore broken storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("savedIntros", JSON.stringify(savedIntros));
  }, [savedIntros]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("savedOutros", JSON.stringify(savedOutros));
  }, [savedOutros]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("savedExtras", JSON.stringify(savedExtras));
  }, [savedExtras]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("savedTemplatesV1", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    if (replies && replies.length > 0 && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [replies]);

  const dismissTutorial = () => {};

  const effectiveIndustry = useMemo(
    () =>
      industry === "기타(직접입력)"
        ? customIndustry.trim() || "기타"
        : industry,
    [industry, customIndustry]
  );

  const hasIndustry =
    (industry && industry !== "기타(직접입력)") ||
    (industry === "기타(직접입력)" && customIndustry.trim().length > 0);
  const hasStoreName = storeName.trim().length > 0;
  const hasReviews = reviewsText.trim().length > 0;
  const hasTone = Boolean(tone);
  const hasReplyTypes = selectedReplyTypes.length > 0;
  const generateIntro = true;
  const generateOutro = true;

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const recommendTypes = (text: string) => {
    const lower = text.toLowerCase();
    const negativeHints = [
      "불만",
      "별로",
      "애매",
      "안 좋",
      "좋지 않",
      "실망",
      "아쉬",
      "나쁜",
      "다시 안",
      "다시는",
      "이번엔",
      "처음만큼",
      "기대 이하",
      "마감",
      "상태",
      "편차",
    ];
    const scored = replyTypeOptions.map((option) => {
      const keywords = replyTypeKeywords[option.id] || [];
      const score = keywords.reduce(
        (acc, kw) => (lower.includes(kw.toLowerCase()) ? acc + 1 : acc),
        0
      );
      return { id: option.id, score };
    });
    const hasNegative = negativeHints.some((k) => lower.includes(k));
    const sorted = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.id);

    const negativePriority = hasNegative
      ? [
          "사실 확인형",
          "해결 안내형",
          "재발 방지 약속형",
          "원인 설명형",
          "보상 대신 대안 제시형",
        ].filter((id) => replyTypeOptions.some((opt) => opt.id === id))
      : [];

    const merged = Array.from(new Set([...negativePriority, ...sorted]));

    if (merged.length === 0) {
      return fallbackRecommended.filter((id) =>
        replyTypeOptions.some((opt) => opt.id === id)
      );
    }

    return merged.slice(0, 3);
  };

  const recommendedTypes = useMemo(() => {
    if (!reviewsText.trim()) return [];
    const rec = recommendTypes(reviewsText);
    const next = rec.length ? rec : fallbackRecommended;
    return next.slice(0, 3);
  }, [reviewsText]);

  const recommendedTone = useMemo((): Tone | null => {
    const text = reviewsText.toLowerCase().trim();
    if (!text) return null;
    const positive = [
      "맛있",
      "친절",
      "최고",
      "만족",
      "감사",
      "추천",
      "예쁘",
      "깔끔",
    ];
    const negative = [
      "불편",
      "실망",
      "불친절",
      "짜증",
      "최악",
      "기분 나쁨",
      "불량",
      "맛없",
      "별로",
      "안 좋",
      "느렸",
      "지연",
      "늦게",
      "대기",
    ];
    const severe = [
      "환불",
      "보상",
      "최악",
      "다시는",
      "형편없",
      "법적",
      "클레임",
    ];
    const hasPositive = positive.some((k) => text.includes(k));
    const hasNegative = negative.some((k) => text.includes(k));
    const hasSevere = severe.some((k) => text.includes(k));

    if (hasSevere) return "단호형";
    if (hasNegative && hasPositive) return "정중형";
    if (hasNegative) return "공감형";
    if (hasPositive) return "친근형";
    return "담백형";
  }, [reviewsText]);

  const toneOptionsForPlan = useMemo(() => toneOptions, []);

  useEffect(() => {
    // 자동 추천 적용 시, 추천 톤/유형을 UI에도 반영
    if (!autoApply) return;
    if (recommendedTone) {
      setTone(recommendedTone);
    }
    if (recommendedTypes.length > 0) {
      setSelectedReplyTypes(recommendedTypes.slice(0, 3));
    }
  }, [autoApply, recommendedTone, recommendedTypes]);

  const effectiveReplyTypesForSubmit = useMemo(() => {
    if (autoApply) {
      if (recommendedTypes.length > 0) return recommendedTypes.slice(0, 3);
      if (selectedReplyTypes.length > 0) return selectedReplyTypes.slice(0, 3);
      return [replyTypeOptions[0].id];
    }
    return selectedReplyTypes.slice(0, 3);
  }, [autoApply, recommendedTypes, selectedReplyTypes]);

  const effectiveToneForSubmit = useMemo(() => {
    if (autoApply && recommendedTone) return recommendedTone;
    return tone;
  }, [autoApply, recommendedTone, tone]);

  const canSubmit =
    reviewsText.trim().length > 0 &&
    effectiveIndustry.length > 0 &&
    effectiveReplyTypesForSubmit.length > 0 &&
    effectiveReplyTypesForSubmit.length <= 3;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("리뷰와 업종, 답글 유형(최소 1개, 최대 3개)을 선택해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setReplies(null);
    setCopiedIndex(null);

    try {
      const res = await fetch("/api/generate-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: effectiveIndustry,
          reviewsText,
          tone: effectiveToneForSubmit,
          storeTone,
          services: servicesText,
          storeName,
          introText,
          outroText,
          generateIntro,
          generateOutro,
          replyTypes: effectiveReplyTypesForSubmit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error || "답글 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
        setError(msg);
        addToast({ type: "error", message: msg });
        return;
      }

      const now = new Date().toISOString();
      const nextReplies =
        (data.replies ?? []).map((r: Reply) => ({ ...r, createdAt: now })) ||
        [];
      setReplies(nextReplies);
      if (nextReplies.length > 0) {
        setRecentReplies((prev) => {
          const merged = [...nextReplies, ...prev].slice(0, 10);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              "recentReplies",
              JSON.stringify(merged)
            );
          }
          return merged;
        });
      }
      if (!data.replies || data.replies.length === 0) {
        setError("답글이 생성되지 않았습니다. 입력을 다시 확인해주세요.");
        addToast({ type: "error", message: "답글이 생성되지 않았습니다." });
      } else {
        addToast({ type: "success", message: "답글을 생성했습니다." });
        setTimeout(() => {
          if (resultRef.current) {
            resultRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 50);
      }
    } catch (err) {
      const msg = "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setError(msg);
      addToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRecent = async (text: string, key: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedRecentKey(key);
      addToast({ type: "success", message: "복사했습니다." });
    } catch {
      addToast({
        type: "error",
        message: "복사에 실패했습니다. 브라우저 권한을 확인해주세요.",
      });
    } finally {
      setTimeout(() => {
        setCopiedRecentKey((current) => (current === key ? null : current));
      }, 2000);
    }
  };

  const removeRecent = (key: string) => {
    setRecentReplies((prev) => {
      const next = prev.filter(
        (reply, idx) =>
          `${idx}-${reply.title}-${reply.text.slice(0, 8)}` !== key
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem("recentReplies", JSON.stringify(next));
      }
      return next;
    });
    addToast({ type: "info", message: "최근 생성 기록을 삭제했습니다." });
  };

  const saveSnippet = (
    value: string,
    current: string[],
    setter: Dispatch<SetStateAction<string[]>>,
    label: string,
    opts?: { silent?: boolean }
  ) => {
    const text = value.trim();
    if (!text) return;
    const existing = current.filter((item) => item !== text);
    setter([text, ...existing].slice(0, 10));
    if (!opts?.silent) {
      addToast({ type: "success", message: `${label}을 저장했어요.` });
    }
  };

  const removeSnippet = (
    target: string,
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((item) => item !== target));
  };

  const applySnippet = (text: string, setter: (value: string) => void) => {
    setter(text);
  };

  const openSnippetModal = (category: SnippetCategory) => {
    if (
      (category === "intro" && savedIntros.length === 0) ||
      (category === "outro" && savedOutros.length === 0) ||
      (category === "extra" && savedExtras.length === 0)
    ) {
      addToast({
        type: "info",
        message: "저장된 항목이 없습니다. 먼저 저장을 눌러주세요.",
      });
      return;
    }
    setError(null);
    setSnippetModal(category);
  };

  const closeSnippetModal = () => setSnippetModal(null);

  const snippetConfigs: Record<
    SnippetCategory,
    {
      items: string[];
      apply: (value: string) => void;
      remove: (value: string) => void;
      label: string;
    }
  > = {
    intro: {
      items: savedIntros,
      apply: (value: string) => setIntroText(value),
      remove: (value: string) => removeSnippet(value, setSavedIntros),
      label: "머릿말",
    },
    outro: {
      items: savedOutros,
      apply: (value: string) => setOutroText(value),
      remove: (value: string) => removeSnippet(value, setSavedOutros),
      label: "꼬릿말",
    },
    extra: {
      items: savedExtras,
      apply: (value: string) => setStoreTone(value),
      remove: (value: string) => removeSnippet(value, setSavedExtras),
      label: "기타 요청사항",
    },
  };

const toggleReplyType = (id: string) => {
    setAutoApply(false);
    setSelectedReplyTypes((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        return next.length === 0 ? prev : next;
      }
      if (prev.length >= 3) {
        setError("답글 유형은 최대 3개까지 선택할 수 있습니다.");
        return prev;
      }
      setError(null);
      return [...prev, id];
    });
  };

  const saveTemplateConfig = () => {
    const name = templateName.trim();
    if (!name) {
      addToast({ type: "error", message: "템플릿 이름을 입력해주세요." });
      return;
    }
    if (!effectiveIndustry || selectedReplyTypes.length === 0) {
      addToast({
        type: "error",
        message: "업종과 답글 유형을 선택한 뒤 템플릿을 저장하세요.",
      });
      return;
    }
    const payload: TemplateConfig = {
      id:
        templates.find((t) => t.name === name)?.id ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      industry: industry,
      customIndustry,
      servicesText,
      storeName,
      tone,
      replyTypes: selectedReplyTypes,
      storeTone,
      introText,
      outroText,
    };
    setTemplates((prev) => {
      const filtered = prev.filter((t) => t.name !== name);
      return [payload, ...filtered].slice(0, 20);
    });
    addToast({ type: "success", message: "템플릿을 저장했어요." });
    setTemplateAddModal(false);
  };

  const applyTemplate = (tpl: TemplateConfig) => {
    setIndustry(tpl.industry);
    setCustomIndustry(tpl.customIndustry);
    setStoreName(tpl.storeName || "");
    setServicesText(tpl.servicesText);
    setTone(tpl.tone);
    setSelectedReplyTypes(
      tpl.replyTypes.length > 0
        ? tpl.replyTypes.slice(0, 3)
        : [replyTypeOptions[0].id]
    );
    setStoreTone(tpl.storeTone);
    setIntroText(tpl.introText);
    setOutroText(tpl.outroText);
    addToast({ type: "info", message: `"${tpl.name}" 템플릿을 불러왔어요.` });
    setTemplateDrawerOpen(false);
  };

  const deleteTemplate = (id: string) => {
    const target = templates.find((tpl) => tpl.id === id);
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `"${target?.name ?? "이 템플릿"}"을 삭제할까요? 되돌릴 수 없습니다.`
          );
    if (!ok) return;
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
    addToast({ type: "info", message: "템플릿을 삭제했어요." });
  };

  const handleCopy = async (
    text: string,
    index: number,
    opts?: { recentKey?: string }
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      if (opts?.recentKey) setCopiedRecentKey(opts.recentKey);
      addToast({ type: "success", message: "복사했습니다." });
      setTimeout(
        () => setCopiedIndex((current) => (current === index ? null : current)),
        2000
      );
      if (opts?.recentKey) {
        setTimeout(() => {
          setCopiedRecentKey((current) =>
            current === opts.recentKey ? null : current
          );
        }, 2000);
      }
    } catch (err) {
      setError("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
      addToast({
        type: "error",
        message: "복사에 실패했습니다. 클립보드 권한을 확인해주세요.",
      });
    }
  };

  const updateReplyText = (index: number, text: string) => {
    setReplies((prev) => {
      if (!prev) return prev;
      return prev.map((reply, i) => (i === index ? { ...reply, text } : reply));
    });
  };

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.18em]">
                리뷰답글에이전트
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                사장님! 리뷰 답글, 그만 고민하세요!
              </h1>
              <p className="text-base text-slate-600">
                리뷰 복붙하고 답글 생성하기로 10초면 끝!
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="card p-6 space-y-6" ref={industryRef}>
            <div className="space-y-2" ref={reviewRef}>
              <div className="flex items-center justify-between">
                <label
                  className="label flex items-center gap-2"
                  htmlFor="industry"
                >
                  업종 선택
                  <StatusChip done={hasIndustry} />
                  <InfoPopover
                    title="업종 선택"
                    description="업종을 선택하면 답글에서 업종에 맞는 표현을 사용합니다. 기타(직접입력)를 선택하면 옆 입력칸에 업종명을 적어야 완료로 표시됩니다."
                    isOpen={openPopover === "industry"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "industry" ? null : "industry"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr,1fr]">
                <select
                  id="industry"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="">업종을 선택해주세요</option>
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {industry === "기타(직접입력)" ? (
                  <input
                    type="text"
                    placeholder="예: 키즈카페, 꽃집 등"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                  />
                ) : industry ? (
                  <div className="flex items-center text-sm text-slate-500">
                    선택된 업종:{" "}
                    <span className="ml-2 font-semibold text-slate-800">
                      {industry}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-slate-500">
                    업종을 선택해주세요.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label
                  className="label flex items-center gap-2"
                  htmlFor="storeName"
                >
                  (선택) 매장명
                </label>
                <InfoPopover
                  title="매장명"
                  description="머릿말에 자연스럽게 매장명을 넣어 인사합니다. 예: 저희 리뷰박사카페"
                  isOpen={openPopover === "storeName"}
                  onToggle={() =>
                    setOpenPopover((prev) =>
                      prev === "storeName" ? null : "storeName"
                    )
                  }
                  onClose={() => setOpenPopover(null)}
                />
              </div>
              <input
                id="storeName"
                maxLength={30}
                placeholder="예: 리뷰박사카페 홍대점"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                매장명이 있으면 머릿말에 한 번 자연스럽게 포함해요.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <label
                  className="label flex items-center gap-2"
                  htmlFor="services"
                >
                  (선택) 주요 상품/서비스
                </label>
                <InfoPopover
                  title="주요 상품/서비스"
                  description="대표 메뉴나 서비스 한 줄(20자 이내)을 남기면 업종 맥락에 맞춰 답변에 녹여줍니다."
                  isOpen={openPopover === "services"}
                  onToggle={() =>
                    setOpenPopover((prev) =>
                      prev === "services" ? null : "services"
                    )
                  }
                  onClose={() => setOpenPopover(null)}
                />
              </div>
              <textarea
                id="services"
                rows={1}
                maxLength={20}
                placeholder="예: 시그니처 메뉴/서비스"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                업종 내 대표 메뉴/서비스를 20자 이내로 적어주세요.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="label flex items-center gap-2"
                  htmlFor="reviews"
                >
                  리뷰 붙여넣기
                  <StatusChip done={hasReviews} />
                  <InfoPopover
                    title="리뷰 붙여넣기"
                    description="한 줄에 리뷰 하나씩 붙여넣으면 답변이 더 정확해요. 민감 정보나 개인정보는 제거해 주세요."
                    isOpen={openPopover === "reviews"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "reviews" ? null : "reviews"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </label>
              </div>
              <textarea
                id="reviews"
                rows={8}
                placeholder="한 줄에 리뷰 하나씩 붙여넣으면 좋습니다. 예)\n- 아이스라떼 맛있어요. 종종 테이크아웃 하러 와요\n- 포장 주문했는데 양이 적게 온 것 같아요..."
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-relaxed focus:border-slate-400 focus:outline-none"
                value={reviewsText}
                onChange={(e) => setReviewsText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="label flex items-center gap-2">
                  톤 선택
                  <StatusChip done={hasTone} />
                  <InfoPopover
                    title="톤 선택"
                    description="기본은 정중형입니다. 리뷰 내용에 따라 추천 뱃지가 붙어요. 원하는 톤으로 직접 바꿀 수도 있습니다."
                    isOpen={openPopover === "tone"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "tone" ? null : "tone"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {toneOptionsForPlan.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setAutoApply(false);
                      setTone(option.id);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                      tone === option.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {recommendedTone === option.id &&
                        reviewsText.trim().length > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-semibold text-amber-800">
                            추천
                          </span>
                        )}
                    </div>
                    <span
                      className={cn(
                        "text-xs",
                        tone === option.id
                          ? "text-slate-100/90"
                          : "text-slate-500"
                      )}
                    >
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="label flex items-center gap-2">
                  답글 유형 선택 (최소 1개, 최대 3개)
                  <StatusChip done={hasReplyTypes} />
                  <InfoPopover
                    title="답글 유형"
                    description="기본은 개인화 응대형 1개만 선택됩니다. 리뷰를 분석해 추천 뱃지를 붙여주며, 추가로 필요한 유형을 최대 3개까지 선택해 조합할 수 있습니다."
                    isOpen={openPopover === "replyTypes"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "replyTypes" ? null : "replyTypes"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {selectedReplyTypes.length} / 3 선택됨
                  </span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {replyTypeOptions.map((option) => {
                  const active = selectedReplyTypes.includes(option.id);
                  const recommended = recommendedTypes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        toggleReplyType(option.id);
                      }}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            {option.label}
                          </p>
                          {recommended && (
                            <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-semibold text-amber-800">
                              추천
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold",
                            active
                              ? "border-white bg-white text-slate-900"
                              : "border-slate-300 text-slate-500"
                          )}
                        >
                          {active ? "✓" : "+"}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1 text-xs leading-relaxed",
                          active ? "text-slate-100/90" : "text-slate-600"
                        )}
                      >
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="label" htmlFor="storeTone">
                  (선택) 기타 요청사항 (20자 이내)
                </label>
                <InfoPopover
                  title="기타 요청사항"
                  description="머릿말/꼬릿말 외에 꼭 반영할 한 줄을 적어주세요. 본문에 1문장 이상 반영됩니다."
                  isOpen={openPopover === "extra"}
                  onToggle={() =>
                    setOpenPopover((prev) =>
                      prev === "extra" ? null : "extra"
                    )
                  }
                  onClose={() => setOpenPopover(null)}
                />
              </div>
              <input
                id="storeTone"
                type="text"
                maxLength={20}
                placeholder='예: "쿠폰 언급 금지"'
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={storeTone}
                onChange={(e) => setStoreTone(e.target.value.slice(0, 20))}
                onBlur={handleExtraBlur}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="btn-ghost whitespace-nowrap px-3 py-1 text-xs"
                  onClick={() => openSnippetModal("extra")}
                >
                  불러오기
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="label" htmlFor="intro">
                    (선택) 머릿말
                  </label>
                  <InfoPopover
                    title="머릿말"
                    description="인사/환영 한 줄을 자동으로 생성합니다. 키워드를 적으면 참고해 자연스럽게 풀어줍니다."
                    isOpen={openPopover === "intro"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "intro" ? null : "intro"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </div>
                <input
                  id="intro"
                  type="text"
                  placeholder="머릿말 키워드 또는 문장"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  onBlur={handleIntroBlur}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost whitespace-nowrap px-3 py-1 text-xs"
                    onClick={() => openSnippetModal("intro")}
                  >
                    불러오기
                  </button>
                </div>
                {savedIntros.length > 0 && (
                  <p className="text-xs text-slate-500">
                    저장된 머릿말은 불러오기에서 확인하세요.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="label" htmlFor="outro">
                    (선택) 꼬릿말
                  </label>
                  <InfoPopover
                    title="꼬릿말"
                    description="재방문 유도나 마무리 한 줄을 자동으로 생성합니다. 키워드를 적으면 자연스럽게 섞습니다."
                    isOpen={openPopover === "outro"}
                    onToggle={() =>
                      setOpenPopover((prev) =>
                        prev === "outro" ? null : "outro"
                      )
                    }
                    onClose={() => setOpenPopover(null)}
                  />
                </div>
                <input
                  id="outro"
                  type="text"
                  placeholder="꼬릿말 키워드 또는 문장"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={outroText}
                  onChange={(e) => setOutroText(e.target.value)}
                  onBlur={handleOutroBlur}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost whitespace-nowrap px-3 py-1 text-xs"
                    onClick={() => openSnippetModal("outro")}
                  >
                    불러오기
                  </button>
                </div>
                {savedOutros.length > 0 && (
                  <p className="text-xs text-slate-500">
                    저장된 꼬릿말은 불러오기에서 확인하세요.
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-slate-500">
              업종과 톤을 반영한 답글을 만들어 드립니다. 과장/환불 약속은
              포함하지 않습니다.
            </p>
            {error && (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div
              className="card p-6 flex flex-col gap-3 relative lg:sticky lg:top-2"
              ref={resultRef}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    결과
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">답글</h2>
                  <p className="text-xs text-slate-500">
                    답글을 확인하고 복사하거나 필요한 부분을 수정할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-slate-600 hover:text-slate-900"
                  onClick={() => setRecentModalOpen(true)}
                >
                  <span>최근 생성 기록</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {!replies && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  여기서 생성 결과가 표시됩니다. 리뷰와 업종을 입력해 주세요.
                </div>
              )}
              {loading && (
                <div className="space-y-3">
                  <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-5 w-36 rounded bg-slate-200" />
                      </div>
                      <div className="h-8 w-16 rounded bg-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-slate-200" />
                      <div className="h-3 w-5/6 rounded bg-slate-200" />
                      <div className="h-3 w-3/4 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              )}
              {replies?.map((reply, index) => (
                <article
                  key={reply.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {tone}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {reply.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost whitespace-nowrap"
                      onClick={() => handleCopy(reply.text, index)}
                    >
                      {copiedIndex === index ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <AutoResizeTextarea
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 focus:border-slate-400 focus:outline-none"
                    minRows={4}
                    value={reply.text}
                    onChange={(val) => updateReplyText(index, val)}
                  />
                </article>
              ))}
              {replies && replies.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-ghost px-3 py-1 text-xs"
                      onClick={() => {
                        setTemplateName("");
                        setTemplateAddModal(true);
                      }}
                    >
                      지금 설정 템플릿으로 저장
                    </button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-900">
                        피드백 남기기
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">
                        선택
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="버그/개선 아이디어를 남겨주세요. (예: 톤이 딱딱해요, 특정 업종 표현 추가 등)"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                      value={feedback}
                      onChange={(e) =>
                        setFeedback(e.target.value.slice(0, 500))
                      }
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="btn-primary px-3 py-1 text-xs disabled:opacity-60"
                        disabled={feedbackSubmitting}
                        onClick={() => {
                          const msg = feedback.trim();
                          if (!msg) {
                            addToast({
                              type: "error",
                              message: "피드백을 입력해주세요.",
                            });
                            return;
                          }
                          setFeedbackSubmitting(true);
                          fetch("/api/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              message: msg,
                              path:
                                typeof window !== "undefined"
                                  ? window.location.pathname
                                  : "/",
                              userAgent:
                                typeof navigator !== "undefined"
                                  ? navigator.userAgent
                                  : "",
                              context: {
                                industry,
                                customIndustry,
                                storeName,
                                servicesText,
                                tone,
                                replyTypes: selectedReplyTypes,
                                storeTone,
                                introText,
                                outroText,
                                reviewsText,
                              },
                            }),
                          })
                            .then(async (res) => {
                              const data = await res.json();
                              if (!res.ok)
                                throw new Error(data?.error || "저장 실패");
                              addToast({
                                type: "success",
                                message: data?.stored
                                  ? "피드백이 저장되었습니다. 감사합니다!"
                                  : "피드백을 기록했습니다.",
                              });
                              setFeedback("");
                            })
                            .catch(() => {
                              addToast({
                                type: "error",
                                message:
                                  "피드백 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
                              });
                            })
                            .finally(() => setFeedbackSubmitting(false));
                        }}
                      >
                        {feedbackSubmitting ? "제출 중..." : "피드백 제출"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      {!templateDrawerOpen && (
        <button
          type="button"
          className="fixed right-2 top-1/2 z-50 -translate-y-1/2 px-5 py-14 text-slate-400 transition hover:text-slate-700"
          onClick={() => setTemplateDrawerOpen(true)}
          aria-label="템플릿 열기"
          ref={templateToggleRef}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <div
        className={cn(
          "fixed bottom-24 z-50 flex flex-col gap-2",
          templateDrawerOpen ? "right-[260px]" : "right-4"
        )}
      >
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-lg ring-1 ring-slate-200 hover:text-slate-900"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="맨 위로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-10 w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2 px-4 pb-6">
        <div className="w-full max-w-xl flex items-center justify-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-slate-900"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
          />
          <span className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1 shadow-sm backdrop-blur-sm">
            <span>자동 추천 적용</span>
            {autoApply && (
              <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] font-semibold text-amber-800">
                추천 톤/유형으로 바로 생성
              </span>
            )}
          </span>
        </div>
        <button
          className="btn-primary shadow-2xl w-full max-w-xl py-3 text-base rounded-full"
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
        >
          {loading && (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white align-middle" />
          )}
          {loading ? "생성 중..." : "답글 생성"}
        </button>
        <p className="text-xs text-slate-500">
          리뷰 붙여넣기와 옵션을 확인한 뒤 눌러주세요.
        </p>
      </div>
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-56 max-w-[240px] transform bg-white/50 transition-transform backdrop-blur-sm",
          templateDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
        onTransitionEnd={() => {
          if (!templateDrawerOpen) {
            // allow button to remain hidden when open
          }
        }}
      >
        <div className="h-full overflow-hidden rounded-l-2xl border border-transparent bg-transparent">
          {templateDrawerOpen && (
            <button
              type="button"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full px-5 py-14 text-3xl font-semibold text-slate-400 transition hover:text-slate-700"
              onClick={() => setTemplateDrawerOpen(false)}
              aria-label="템플릿 닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-10 w-10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2 border-b border-slate-200/50 bg-white/60 px-4 py-3 backdrop-blur">
            <span className="text-sm font-semibold text-slate-900">템플릿</span>
            <InfoPopover
              title="템플릿"
              description="업종/서비스/톤/유형/머릿말/꼬릿말/기타 요청을 저장하고 불러옵니다."
              isOpen={openPopover === "template"}
              onToggle={() =>
                setOpenPopover((prev) =>
                  prev === "template" ? null : "template"
                )
              }
              onClose={() => setOpenPopover(null)}
            />
          </div>
          <div className="h-full overflow-y-auto px-4 py-3 space-y-3 bg-transparent">
            <button
              type="button"
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-slate-400 hover:bg-white"
              onClick={() => {
                setTemplateName("");
                setTemplateAddModal(true);
              }}
            >
              <p className="text-3xl font-semibold text-slate-500">+</p>
            </button>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
              >
                <button
                  type="button"
                  aria-label="삭제"
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                  onClick={() => deleteTemplate(tpl.id)}
                >
                  ×
                </button>
                <div className="inline-flex items-center">
                  <p className="text-sm font-semibold text-slate-900">
                    {tpl.name}
                  </p>
                  <button
                    type="button"
                    className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500 hover:border-slate-400 hover:text-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTemplateInfo(tpl);
                    }}
                  >
                    i
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost flex-1 px-3 py-2 text-xs"
                    onClick={() => applyTemplate(tpl)}
                  >
                    적용
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {templateDrawerOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setTemplateDrawerOpen(false)}
        />
      )}
      {recentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                최근 생성 10건
              </h3>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                onClick={() => setRecentModalOpen(false)}
              >
                닫기
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              이 브라우저에서 최근 생성한 답글을 확인하고 복사할 수 있습니다.
            </p>
            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
              {recentReplies.length === 0 ? (
                <p className="text-sm text-slate-500">
                  아직 저장된 답글이 없습니다. 답글을 생성하면 자동으로
                  저장됩니다.
                </p>
              ) : (
                recentReplies.map((reply, idx) => (
                  <div
                    key={`${idx}-${reply.title}-${reply.text.slice(0, 20)}`}
                    className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
                  >
                    <button
                      type="button"
                      aria-label="삭제"
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                      onClick={() =>
                        removeRecent(
                          `${idx}-${reply.title}-${reply.text.slice(0, 8)}`
                        )
                      }
                    >
                      ×
                    </button>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-200 px-2 py-[2px] font-semibold text-slate-800">
                        {reply.title || "답글"}
                      </span>
                      {reply.createdAt && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {reply.text}
                    </p>
                    <div className="mt-3 flex justify-end">
                      {(() => {
                        const key = `${idx}-${reply.title}-${reply.text.slice(
                          0,
                          8
                        )}`;
                        return (
                          <button
                            type="button"
                            className={cn(
                              "btn-ghost px-3 py-1 text-xs",
                              copiedRecentKey === key &&
                                "bg-emerald-50 text-emerald-700"
                            )}
                            onClick={() => handleCopyRecent(reply.text, key)}
                          >
                            {copiedRecentKey === key ? "복사됨" : "복사"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {toasts.length > 0 && (
        <div className="fixed inset-x-0 top-4 z-[2147483647] flex flex-col items-center gap-2 px-4 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                "inline-flex max-w-xl items-center rounded-xl px-4 py-3 text-sm font-semibold shadow-2xl pointer-events-auto",
                toast.type === "success" && "bg-emerald-600 text-white",
                toast.type === "error" && "bg-red-600 text-white",
                toast.type === "info" && "bg-slate-800 text-white"
              )}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
      {openTemplateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {openTemplateInfo.name}
              </h3>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                onClick={() => setOpenTemplateInfo(null)}
              >
                닫기
              </button>
            </div>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p>업종: {openTemplateInfo.industry || "미선택"}</p>
              <p>매장명: {openTemplateInfo.storeName || "없음"}</p>
              <p>주요 서비스: {openTemplateInfo.servicesText || "미입력"}</p>
              <p>톤: {openTemplateInfo.tone}</p>
              <p>유형: {openTemplateInfo.replyTypes.join(", ") || "없음"}</p>
              <p>기타 요청사항: {openTemplateInfo.storeTone || "없음"}</p>
              <p>머릿말 힌트: {openTemplateInfo.introText || "없음"}</p>
              <p>꼬릿말 힌트: {openTemplateInfo.outroText || "없음"}</p>
            </div>
          </div>
        </div>
      )}
      {templateAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">템플릿 저장</h3>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                onClick={() => setTemplateAddModal(false)}
              >
                닫기
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              현재 설정을 템플릿으로 저장합니다. 이름을 입력해주세요.
            </p>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                maxLength={30}
                placeholder="템플릿 이름 (예: 강남점 기본)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary w-full py-2 text-sm"
                onClick={saveTemplateConfig}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {snippetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {snippetConfigs[snippetModal].label} 불러오기
              </h3>
              <button
                type="button"
                className="btn-ghost px-3 py-1 text-xs"
                onClick={closeSnippetModal}
              >
                닫기
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              저장해 둔 {snippetConfigs[snippetModal].label}을 선택해 적용하거나
              삭제할 수 있습니다.
            </p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {snippetConfigs[snippetModal].items.length === 0 ? (
                <p className="text-sm text-slate-500">
                  저장된 항목이 없습니다.
                </p>
              ) : (
                snippetConfigs[snippetModal].items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-800 whitespace-pre-wrap">
                      {item}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1 text-xs"
                        onClick={() => {
                          snippetConfigs[snippetModal].apply(item);
                          addToast({
                            type: "success",
                            message: `${snippetConfigs[snippetModal].label}을 적용했어요.`,
                          });
                          closeSnippetModal();
                        }}
                      >
                        적용
                      </button>
                      <button
                        type="button"
                        className="btn-ghost px-3 py-1 text-xs"
                        onClick={() => {
                          snippetConfigs[snippetModal].remove(item);
                          addToast({
                            type: "info",
                            message: `${snippetConfigs[snippetModal].label}을 삭제했어요.`,
                          });
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
