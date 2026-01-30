"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Category = {
  id: string;
  title: string;
  description: string;
  questions: string[];
};

type Competitor = {
  id: string;
  name: string;
  scores: Record<string, (number | null)[]>;
};

type OpsCategory = {
  id: string;
  title: string;
  description: string;
  statements: string[];
  actions: string[];
  tools: { label: string; href: string }[];
};

type View =
  | "home"
  | "marketIntro"
  | "marketTest"
  | "marketResult"
  | "marketCompetitors"
  | "opsIntro"
  | "opsTest"
  | "opsResult";

const MARKET_CATEGORIES: Category[] = [
  {
    id: "basic",
    title: "A. 기본정보·신뢰도",
    description: "공개 정보 + 관찰 + 리뷰 근거",
    questions: [
      "매장 기본 정보(주소/연락처/영업시간/휴무)가 쉽게 찾을 수 있고 최신이다.",
      "임시 휴무/변경 사항이 고객이 보기 전에 공지된다.",
      "이용 규칙(예약/대기/환불/교환 등)이 고객 입장에서 명확하다.",
      "가격/추가 비용(옵션/포장비/추가요금 등)이 사전에 드러난다.",
      "매장 사진(외관/내부/상품)이 실제와 크게 다르지 않다.",
      "대표 이미지/소개 문구가 과장 없이 일관된 톤을 유지한다.",
      "위치/주차/찾아오는 길 안내가 고객이 이해하기 쉽게 제공된다(해당 시).",
      "고객 문의 채널(전화/톡/DM 등)과 응답 방식이 안내돼 있다.",
      "고객이 불안해할 요소(품절/대기/지연 등)에 대한 안내가 있다.",
      "“이 매장은 기본이 된다”는 신뢰감을 주는 요소가 보인다.",
    ],
  },
  {
    id: "product",
    title: "B. 상품·가격 명확성",
    description: "대표/가격/옵션 정보의 명확성",
    questions: [
      "대표 상품/서비스가 한눈에 무엇인지 알 수 있다.",
      "가격표가 최신이며, 주요 항목이 빠짐없이 공개돼 있다.",
      "옵션/추가요금/구성 차이가 고객 입장에서 헷갈리지 않게 설명돼 있다.",
      "상품/서비스 설명(특징/차이/주의사항)이 최소한 제공된다.",
      "처음 이용하는 고객이 “뭘 고르면 될지” 가이드가 있다(추천/베스트).",
      "사진/설명이 실제 제공 내용과 크게 어긋나지 않는다.",
      "품절/재고/가능 여부가 고객이 헛걸음하지 않게 관리된다(해당 시).",
      "결제 방법/추가 비용/수수료 관련 안내가 명확하다(해당 시).",
      "고객이 자주 묻는 가격/구성 질문이 줄어들게 정보가 정리돼 있다.",
      "가격에 대한 불만/혼선이 리뷰에서 반복적으로 보이지 않는다.",
    ],
  },
  {
    id: "experience",
    title: "C. 현장 경험 품질",
    description: "대기·동선·청결·응대",
    questions: [
      "입장/주문/이용 방법이 현장에서 쉽게 이해된다(표지/안내).",
      "대기/순서/예약 시스템이 혼란을 줄이도록 운영된다(해당 시).",
      "고객 동선(주문→수령/이용)이 막히지 않게 구성되어 있다.",
      "매장/공간(또는 제공 환경)이 전반적으로 청결해 보인다.",
      "직원 응대가 기본적으로 친절하고 안정적이다(인사/설명/태도).",
      "바쁜 상황에서도 고객이 방치된 느낌을 덜 받게 안내가 있다.",
      "제공 속도/처리 시간이 고객 기대와 크게 어긋나지 않는다.",
      "문제가 생겼을 때(지연/누락/불만) 대응이 매끄럽다는 인상이 있다.",
      "이용 후 불편이 남는 포인트(소음/혼잡/불친절)가 반복적으로 보이지 않는다.",
      "“다시 와도 되겠다”는 경험 요소가 분명히 있다.",
    ],
  },
  {
    id: "review",
    title: "D. 리뷰·평판 관리",
    description: "리뷰 응대 및 평판 안정성",
    questions: [
      "리뷰 수(또는 피드백)가 일정 수준 이상 꾸준히 쌓인다.",
      "리뷰 내용에서 강점 키워드가 반복된다(예: 친절/품질/가성비 등).",
      "부정 리뷰가 특정 문제로 반복되는 경향이 크지 않다.",
      "부정 리뷰가 반복된다면, 최근에는 개선된 흔적이 보인다.",
      "사장/매장 측 답글이 일정 비율로 달려 있다(해당 시).",
      "답글의 톤이 감정적이지 않고, 해결 의지가 보인다.",
      "답글이 복붙처럼 보이기보다 상황에 맞게 대응한다.",
      "별점과 실제 리뷰 내용의 괴리가 크게 느껴지지 않는다.",
      "리뷰에서 “정보 부족/설명 없음” 류의 불만이 많지 않다.",
      "전반적으로 평판이 안정적이며, 신뢰를 해치지 않는다.",
    ],
  },
  {
    id: "branding",
    title: "E. 브랜딩·차별점",
    description: "콘셉트와 차별성",
    questions: [
      "이 매장이 어떤 고객에게 맞는지(분위기/스타일/가격대)가 느껴진다.",
      "경쟁과 비교해 “여기만의 포인트”가 한 가지 이상 보인다.",
      "사진/문구/응대 톤이 서로 충돌하지 않고 통일감이 있다.",
      "매장(또는 서비스)의 콘셉트가 고객에게 이해 가능한 수준이다.",
      "고객이 기대하는 경험(빠름/조용함/프리미엄 등)과 실제가 유사하다.",
      "과장된 홍보보다 “꾸준함/성실함”이 느껴진다.",
      "단골이 생길 만한 이유(정성/일관성/혜택/관계)가 보인다.",
      "상품/서비스가 “왜 이 가격인지” 납득 가능한 힌트가 있다.",
      "브랜드가 고객에게 약속하는 가치가 명확하다.",
      "한 번 방문 후 기억에 남을 요소가 있다.",
    ],
  },
  {
    id: "channel",
    title: "F. 채널 운영 완성도",
    description: "플레이스/앱/SNS/홈페이지",
    questions: [
      "주요 채널에서 정보가 서로 일치한다.",
      "채널의 사진/메뉴/가격이 오래 방치되지 않는다.",
      "공지/이벤트/운영 변경이 채널에 반영된다.",
      "문의/예약/주문 동선이 막히지 않는다.",
      "고객이 원하는 정보(위치/시간/방법)가 한 번에 모인다.",
      "리뷰/댓글/문의 반응이 지나치게 느리지 않다.",
      "콘텐츠가 광고뿐 아니라 실제 이용 정보도 담는다.",
      "채널별 역할이 대략 분리되어 운영되는 느낌이 있다.",
      "최근 활동이 유지되어 “살아있는 매장”처럼 보인다.",
      "채널을 보고 방문해도 실망하지 않을 수준의 관리가 된다.",
    ],
  },
];

const OPERATIONS_CATEGORIES: OpsCategory[] = [
  {
    id: "profit",
    title: "A. 수익 구조·원가·가격 관리",
    description: "원가/마진/손익 구조 점검",
    statements: [
      "핵심 상품/서비스 5개는 원가(또는 제공 비용)가 정리되어 있다.",
      "원가에는 재료/소모품뿐 아니라 포장/수수료/폐기(로스)까지 반영한다.",
      "단가(재료비/매입가)가 바뀌면 원가표를 갱신하는 기준(주기)이 있다.",
      "할인/쿠폰/프로모션을 하면 손익(남는 금액)을 계산해본다.",
      "채널별(매장/예약/배달/출장 등)로 실수령 차이를 고려한다.",
      "가격은 “느낌”보다 목표 마진/시장/원가 근거로 결정한다.",
      "손익분기점(최소 매출)을 계산하고 목표로 활용한다.",
      "인기/회전과 수익성이 다른 상품을 구분해 운영한다.",
      "매달 1회 이상 메뉴/상품별 수익성 점검을 한다.",
      "매출이 올라도 “남는 돈”이 줄어드는 원인을 설명할 수 있다.",
    ],
    actions: [
      "핵심 5개 상품 원가표를 먼저 정리한다.",
      "채널별 수수료/실수령 차이를 표로 만든다.",
      "손익분기점을 계산해 월 목표를 설정한다.",
    ],
    tools: [{ label: "원가·가격 계산기", href: "/tools/cost" }],
  },
  {
    id: "labor",
    title: "B. 인건비·근무·교육 시스템",
    description: "역할·근무·교육·급여 체계",
    statements: [
      "직원별 역할과 책임(담당 업무)이 문서/메모로 정리돼 있다.",
      "근무표는 최소 1주 이상 미리 공유되고 변경 기준이 있다.",
      "교대/대타 요청을 처리하는 규칙(기한/승인/대체)이 있다.",
      "지각/결근/노쇼에 대한 기준과 처리 방식이 공유돼 있다.",
      "신규 직원 온보딩(첫날/첫주 체크리스트)이 있다.",
      "핵심 업무는 단계별로 나뉘어 교육되고 체크된다.",
      "주휴/연장/야간/휴일 등 수당이 발생하는 조건을 이해하고 있다.",
      "급여 산정(시급/수당/휴게/공제)의 근거를 설명할 수 있다.",
      "인수인계가 말이 아니라 기록(체크/메모)으로 남는다.",
      "특정 1~2명 부재에도 운영이 가능하도록 교차 교육이 되어 있다.",
    ],
    actions: [
      "역할/담당을 문서화하고 교차 교육 체크리스트를 만든다.",
      "근무표/대타 규칙을 정리해 팀에 공유한다.",
      "급여 산정 기준(수당/휴게/공제)을 한 장으로 정리한다.",
    ],
    tools: [
      { label: "인건비 계산기", href: "/tools/labor" },
      { label: "근무표 생성기", href: "/tools/schedule" },
    ],
  },
  {
    id: "operations",
    title: "C. 운영 루틴·품질 표준·재고/발주",
    description: "운영 루틴, 품질 표준, 재고 관리",
    statements: [
      "오픈/마감 체크리스트가 있고 실제로 사용한다.",
      "바쁜 날에도 반드시 지키는 핵심 루틴 3개가 정해져 있다.",
      "서비스/제공 품질 기준(레시피/시술/검수/응대)이 문서화되어 있다.",
      "품질 편차(사람/시간대/요일)가 생기는 원인과 대책이 있다.",
      "재고는 “떨어진 뒤”가 아니라 떨어지기 전에 파악한다.",
      "핵심 품목은 안전재고/발주 기준(수량·주기)이 정해져 있다.",
      "로스(폐기/불량/분실)를 기록하거나 최소한 원인을 파악한다.",
      "장비 고장/정전/납품 지연 등 비상 상황 대응이 정리돼 있다.",
      "클레임 처리 절차(사과/보상/기록/재발방지)가 정리돼 있다.",
      "운영 이슈를 “기록 → 개선 실행 → 재점검”으로 연결한다.",
    ],
    actions: [
      "오픈/마감 체크리스트를 만들어 현장에서 사용한다.",
      "품질 기준을 문서화하고 교육 체크리스트에 넣는다.",
      "재고/발주 기준을 수량·주기 기준으로 정리한다.",
    ],
    tools: [{ label: "근무표 생성기", href: "/tools/schedule" }],
  },
  {
    id: "finance",
    title: "D. 정산·세금·증빙·현금흐름",
    description: "정산/세금/증빙/현금흐름",
    statements: [
      "카드/플랫폼/배달 등 정산 주기와 입금일을 알고 있다.",
      "매출이 “잡히는 시점”과 “입금되는 시점”의 차이를 관리한다.",
      "고정비(임대료/리스/구독/이자 등)가 월 단위로 정리돼 있다.",
      "세금/신고/납부 일정이 캘린더로 관리된다.",
      "영수증/세금계산서/거래명세서 등 증빙 누락을 막는 루틴이 있다.",
      "통장/현금/카드 매출 등 돈 흐름이 섞이지 않게 관리한다.",
      "월별 손익을 “대략”이라도 추적한다(매출·비용·남는 돈).",
      "현금이 부족해지는 시점(위험 구간)을 미리 예측해본다.",
      "환불/부분환불/쿠폰 처리 등이 정산에서 누락되지 않게 관리한다.",
      "세무/회계 담당(또는 본인)이 필요한 자료를 빠르게 찾을 수 있다.",
    ],
    actions: [
      "정산 주기/입금일을 캘린더로 정리한다.",
      "고정비와 손익을 월별로 간단히 정리한다.",
      "증빙 누락을 막는 루틴을 만든다.",
    ],
    tools: [{ label: "세금·부가세 계산기", href: "/tools/tax" }],
  },
  {
    id: "review",
    title: "E. 고객 문제·리뷰 개선 프로세스",
    description: "불만 대응과 개선 루틴",
    statements: [
      "리뷰/문의/불만을 주기적으로 확인하는 담당/시간이 정해져 있다.",
      "불만을 “감정 대응”이 아니라 유형 분류(배송/품질/응대 등)로 정리한다.",
      "반복되는 불만은 원인(프로세스/교육/안내)을 내부에서 찾아본다.",
      "개선 조치(공지/교육/표준 수정)를 실행하고 기록한다.",
      "사과/보상 기준이 상황별로 대략 정해져 있다.",
      "고객에게 안내해야 할 내용(대기/품절/환불)을 선제적으로 고지한다.",
      "문제 발생 시 “누가, 언제, 어떻게” 보고/결정하는지 정해져 있다.",
      "좋은 리뷰/칭찬 포인트를 내부에 공유하고 유지한다.",
      "리뷰 답글 톤/금지어/기본 문구가 정리돼 있다.",
      "리뷰 대응이 실제 운영 개선으로 연결되는 구조가 있다.",
    ],
    actions: [
      "불만 유형 분류표를 만들어 원인을 기록한다.",
      "사과/보상 기준을 상황별로 문서화한다.",
      "리뷰 답글 톤/금지어/기본 문구를 합의한다.",
    ],
    tools: [{ label: "리뷰 답글 생성기", href: "/tools/review-reply" }],
  },
  {
    id: "system",
    title: "F. 시스템화·권한·보안·지속 개선",
    description: "권한/보안/지표/지속 개선",
    statements: [
      "자주 쓰는 문서/표(가격표/체크리스트/교육자료)가 한 곳에 정리돼 있다.",
      "계정/권한(배달앱/포스/네이버/광고 등) 접근이 정리돼 있다.",
      "직원 퇴사/교체 시 인수인계 체크(계정/키/물품)가 있다.",
      "중요한 비밀번호/접근 정보는 분실·유출 위험이 적게 관리한다.",
      "업무가 특정 사람 머릿속이 아니라 문서/체크로 남아 있다.",
      "매장 운영 지표 1~3개(객수/재방문/클레임 등)를 정해 추적한다.",
      "“이번 주 개선 1개” 같은 작은 개선 루틴이 있다.",
      "문제가 생겼을 때 원인(사람/프로세스/정책)을 분리해서 본다.",
      "새 직원이 와도 동일 품질이 나오도록 시스템이 작동한다.",
      "바빠질수록 더 안정적으로 돌아가게 만드는 방향(자동화/표준화)을 추구한다.",
    ],
    actions: [
      "문서/권한 목록을 한 곳에 정리한다.",
      "운영 지표 1~3개를 정하고 주간 체크를 만든다.",
      "주간 개선 1개 루틴을 정해 실행한다.",
    ],
    tools: [{ label: "고객 리텐션 플랜", href: "/tools/retention" }],
  },
];

const RatingButtons = ({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number) => void;
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    {[
      { score: 1, label: "매우 아니다" },
      { score: 2, label: "아니다" },
      { score: 3, label: "보통이다" },
      { score: 4, label: "그렇다" },
      { score: 5, label: "매우 그렇다" },
    ].map(({ score, label }) => (
      <button
        key={score}
        type="button"
        onClick={() => onChange(score)}
        className={`h-10 flex-1 rounded-full border px-2 text-[11px] font-semibold transition sm:text-xs ${
          value === score
            ? "border-black bg-black text-white"
            : "border-black/10 bg-white text-black/60 hover:border-black/30"
        }`}
        aria-pressed={value === score}
      >
        {label}
      </button>
    ))}
  </div>
);

const createCompetitor = (index: number): Competitor => ({
  id: `comp-${Date.now()}-${index}`,
  name: index === 0 ? "우리 매장" : `경쟁점 ${index}`,
  scores: MARKET_CATEGORIES.reduce((acc, item) => {
    acc[item.id] = item.questions.map(() => null);
    return acc;
  }, {} as Record<string, (number | null)[]>),
});

export default function StoreDiagnosisPage() {
  const [view, setView] = useState<View>("home");
  const [storeName, setStoreName] = useState("");
  const [marketStep, setMarketStep] = useState(0);
  const [opsStep, setOpsStep] = useState(0);
  const marketQuestionRefs = useRef<Record<string, (HTMLLabelElement | null)[]>>({});
  const marketNavRef = useRef<HTMLDivElement | null>(null);
  const prevMarketStep = useRef(0);
  const opsQuestionRefs = useRef<Record<string, (HTMLLabelElement | null)[]>>({});
  const opsNavRef = useRef<HTMLDivElement | null>(null);
  const prevOpsStep = useRef(0);
  const [selfScores, setSelfScores] = useState<Record<string, (number | null)[]>>(
    MARKET_CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = cat.questions.map(() => null);
      return acc;
    }, {} as Record<string, (number | null)[]>)
  );
  const [competitors, setCompetitors] = useState<Competitor[]>([
    createCompetitor(0),
    createCompetitor(1),
  ]);
  const [opsScores, setOpsScores] = useState<Record<string, (number | null)[]>>(
    OPERATIONS_CATEGORIES.reduce((acc, cat) => {
      acc[cat.id] = cat.statements.map(() => null);
      return acc;
    }, {} as Record<string, (number | null)[]>)
  );

  const currentCategory = MARKET_CATEGORIES[marketStep];
  const stepCount = MARKET_CATEGORIES.length;
  const stepProgress = ((marketStep + 1) / stepCount) * 100;
  const isCategoryComplete =
    (selfScores[currentCategory.id]?.length ?? 0) ===
      currentCategory.questions.length &&
    (selfScores[currentCategory.id] ?? []).every(
      (value) => typeof value === "number"
    );

  const currentOpsCategory = OPERATIONS_CATEGORIES[opsStep];
  const opsStepCount = OPERATIONS_CATEGORIES.length;
  const opsStepProgress = ((opsStep + 1) / opsStepCount) * 100;
  const isOpsCategoryComplete =
    (opsScores[currentOpsCategory.id]?.length ?? 0) ===
      currentOpsCategory.statements.length &&
    (opsScores[currentOpsCategory.id] ?? []).every(
      (value) => typeof value === "number"
    );

  const calcCategoryScore = (values: (number | null)[]) => {
    const answered = values.filter((val): val is number => typeof val === "number");
    if (answered.length === 0) return 0;
    const sum = answered.reduce((acc, val) => acc + val, 0);
    return (sum / (answered.length * 5)) * 100;
  };

  const selfCategoryScores = useMemo(() => {
    return MARKET_CATEGORIES.map((cat) => ({
      id: cat.id,
      title: cat.title,
      score: calcCategoryScore(selfScores[cat.id] || []),
    }));
  }, [selfScores]);

  const totalScore = useMemo(() => {
    if (selfCategoryScores.length === 0) return 0;
    return (
      selfCategoryScores.reduce((sum, item) => sum + item.score, 0) /
      selfCategoryScores.length
    );
  }, [selfCategoryScores]);

  const competitorScores = useMemo(() => {
    return competitors.map((comp) => ({
      ...comp,
      categoryScores: MARKET_CATEGORIES.map((cat) => ({
        id: cat.id,
        score: calcCategoryScore(comp.scores[cat.id] || []),
      })),
    }));
  }, [competitors]);

  const gapTop3 = useMemo(() => {
    const gaps = MARKET_CATEGORIES.map((cat) => {
      const ours = selfCategoryScores.find((item) => item.id === cat.id)?.score || 0;
      const best = competitorScores
        .slice(1)
        .reduce(
          (max, comp) =>
            Math.max(
              max,
              comp.categoryScores.find((item) => item.id === cat.id)?.score || 0
            ),
          0
        );
      return { title: cat.title, gap: best - ours };
    })
      .filter((item) => item.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
    return gaps;
  }, [selfCategoryScores, competitorScores]);

  const improvementTop2 = useMemo(() => {
    return [...selfCategoryScores]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);
  }, [selfCategoryScores]);

  const updateSelfScore = (catId: string, idx: number, value: number) => {
    setSelfScores((prev) => {
      const next = { ...prev };
      const arr = [...(next[catId] || [])];
      arr[idx] = value;
      next[catId] = arr;
      return next;
    });
  };

  const updateCompetitorScore = (
    id: string,
    catId: string,
    idx: number,
    value: number
  ) => {
    setCompetitors((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextScores = { ...item.scores };
        const arr = [...(nextScores[catId] || [])];
        arr[idx] = value;
        nextScores[catId] = arr;
        return { ...item, scores: nextScores };
      })
    );
  };

  const updateCompetitor = (id: string, name: string) => {
    setCompetitors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const addCompetitor = () => {
    setCompetitors((prev) => [...prev, createCompetitor(prev.length)]);
  };

  const removeCompetitor = (id: string) => {
    if (competitors.length <= 2) return;
    setCompetitors((prev) => prev.filter((item) => item.id !== id));
  };

  const updateOpsScore = (dimId: string, idx: number, value: number) => {
    setOpsScores((prev) => {
      const next = { ...prev };
      const arr = [...(next[dimId] || [])];
      arr[idx] = value;
      next[dimId] = arr;
      return next;
    });
  };

  const opsProfile = useMemo(() => {
    return OPERATIONS_CATEGORIES.map((cat) => ({
      ...cat,
      score: calcCategoryScore(opsScores[cat.id] || []),
    }));
  }, [opsScores]);

  const opsTotalScore = useMemo(() => {
    if (opsProfile.length === 0) return 0;
    return opsProfile.reduce((sum, item) => sum + item.score, 0) / opsProfile.length;
  }, [opsProfile]);

  const opsLowest2 = useMemo(() => {
    return [...opsProfile].sort((a, b) => a.score - b.score).slice(0, 2);
  }, [opsProfile]);

  const resetAll = () => {
    setMarketStep(0);
    setOpsStep(0);
    setSelfScores(
      MARKET_CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = cat.questions.map(() => null);
        return acc;
      }, {} as Record<string, (number | null)[]>)
    );
    setCompetitors([createCompetitor(0), createCompetitor(1)]);
    setOpsScores(
      OPERATIONS_CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = cat.statements.map(() => null);
        return acc;
      }, {} as Record<string, (number | null)[]>)
    );
  };

  useEffect(() => {
    if (view !== "marketTest") {
      prevMarketStep.current = marketStep;
      return;
    }
    const shouldScrollTop = marketStep > prevMarketStep.current;
    prevMarketStep.current = marketStep;
    if (!shouldScrollTop) return;
    requestAnimationFrame(() => {
      if (typeof window === "undefined") return;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [view, marketStep]);

  useEffect(() => {
    if (view !== "opsTest") {
      prevOpsStep.current = opsStep;
      return;
    }
    const shouldScrollTop = opsStep > prevOpsStep.current;
    prevOpsStep.current = opsStep;
    if (!shouldScrollTop) return;
    requestAnimationFrame(() => {
      if (typeof window === "undefined") return;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [view, opsStep]);

  const buildShareText = () => {
    const name = storeName.trim() || "우리 매장";
    const gapText =
      gapTop3.length > 0
        ? gapTop3.map((item) => `${item.title}(${item.gap.toFixed(1)}점)`).join(", ")
        : "격차 없음";
    const improveText =
      improvementTop2.length > 0
        ? improvementTop2.map((item) => item.title).join(", ")
        : "없음";
    return [
      `${name} 매장 외부진단 결과`,
      `총점: ${totalScore.toFixed(1)}점`,
      `격차 TOP3: ${gapText}`,
      `개선 우선순위 TOP2: ${improveText}`,
    ].join("\n");
  };

  const handleShare = async () => {
    const text = buildShareText();
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "매장 외부진단 결과" });
        return;
      }
    } catch {
      // fall back to clipboard
    }
    await navigator.clipboard.writeText(text);
    window.alert("결과를 복사했어요.");
  };

  return (
    <div className="flex flex-col gap-10">
      {view === "home" && (
        <>
          <section className="rounded-[28px] border border-black/5 bg-white/80 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
              Store Diagnosis
            </p>
            <h1 className="font-display mt-4 text-4xl">매장 진단하기</h1>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              매장 외부진단과 내부 운영 진단을 분리해 점검합니다. 먼저 매장평가를
              진행한 뒤 운영 원인을 확인하세요.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
              <h2 className="font-display text-2xl">매장평가</h2>
              <p className="mt-2 text-sm text-black/60">
                공개 정보와 관찰 가능한 기준으로 외부 신뢰도를 점검하고 경쟁점과
                비교합니다.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-black/60">
                <li>· 6개 카테고리, 60문항</li>
                <li>· 격차 TOP3, 개선 우선순위 제공</li>
                <li>· 결과 공유 및 저장</li>
              </ul>
              <button
                type="button"
                onClick={() => setView("marketIntro")}
                className="mt-6 w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
              >
                매장평가 시작
              </button>
            </div>

            <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
              <h2 className="font-display text-2xl">내부운영진단</h2>
              <p className="mt-2 text-sm text-black/60">
                표준화/인력/재고/고객응대 등 운영 성숙도를 점검합니다.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-black/60">
                <li>· 4개 영역, 핵심 체크 문항</li>
                <li>· 개선 포인트 빠른 확인</li>
                <li>· 운영 메모 기반 정리</li>
              </ul>
              <button
                type="button"
                onClick={() => setView("opsIntro")}
                className="mt-6 w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
              >
                내부운영진단 시작
              </button>
            </div>
          </section>
        </>
      )}

      {view === "marketIntro" && (
        <section className="rounded-3xl border border-black/5 bg-white/80 p-8">
          <h2 className="font-display text-3xl">매장평가 온보딩</h2>
          <p className="mt-3 text-sm text-black/60">
            이 테스트는 공개 정보와 관찰 가능한 기준을 바탕으로 매장 외부 신뢰도를
            점검합니다. 테스트 결과는 개선 방향을 정리하는 데 활용하세요.
          </p>
          <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
              매장 이름
            </p>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="예: 자영업카페 홍대점"
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base"
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView("home")}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/60"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => setView("marketTest")}
              className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
            >
              시작하기
            </button>
          </div>
        </section>
      )}

      {view === "marketTest" && (
        <>
          <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                  STEP {marketStep + 1}/{stepCount}
                </p>
                <h2 className="font-display mt-2 text-2xl">{currentCategory.title}</h2>
                <p className="text-xs text-black/40">{currentCategory.description}</p>
                <p className="mt-3 text-xs text-black/50">
                  체크 기준: 공개 정보(플레이스/앱/SNS/홈페이지) + 방문/이용 시 관찰 가능한 것 +
                  리뷰에서 반복 확인 가능한 것
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-black/5">
              <div
                className="h-2 rounded-full bg-black/60 transition-all"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-1">
            <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
              <h2 className="font-display text-xl">우리 매장 점수</h2>
              <p className="mt-2 text-sm text-black/50">
                문항마다 1~5점으로 평가하세요. (1 전혀 아니다 · 5 매우 그렇다)
              </p>
              <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black/70">
                      {currentCategory.title}
                    </p>
                    <p className="text-xs text-black/40">
                      {currentCategory.description}
                    </p>
                  </div>
                  <span className="text-xs text-black/50">
                    {selfCategoryScores
                      .find((item) => item.id === currentCategory.id)
                      ?.score.toFixed(1)}점
                  </span>
                </div>
                <div className="mt-4 grid gap-8">
                  {currentCategory.questions.map((question, idx) => (
                    <label
                      key={`${currentCategory.id}-${idx}`}
                      className="flex w-full flex-col gap-4 text-sm text-black/70"
                      ref={(el) => {
                        if (!marketQuestionRefs.current[currentCategory.id]) {
                          marketQuestionRefs.current[currentCategory.id] = [];
                        }
                        marketQuestionRefs.current[currentCategory.id][idx] = el;
                      }}
                    >
                      <span>
                        {idx + 1}. {question}
                      </span>
                      <RatingButtons
                        value={selfScores[currentCategory.id]?.[idx] ?? null}
                        onChange={(value) => {
                          updateSelfScore(currentCategory.id, idx, value);
                          requestAnimationFrame(() => {
                            const nextIdx = idx + 1;
                            const nextEl =
                              marketQuestionRefs.current[currentCategory.id]?.[nextIdx];
                            if (nextEl) {
                              nextEl.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            } else {
                              marketNavRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div
                  ref={marketNavRef}
                  className="mt-8 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setMarketStep((prev) => Math.max(0, prev - 1))}
                    disabled={marketStep === 0}
                    className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                  >
                    이전
                  </button>
                  {marketStep === stepCount - 1 ? (
                    <button
                      type="button"
                      onClick={() => setView("marketResult")}
                      disabled={!isCategoryComplete}
                      className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                    >
                      끝내기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setMarketStep((prev) => Math.min(stepCount - 1, prev + 1))
                      }
                      disabled={!isCategoryComplete}
                      className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                    >
                      다음
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {view === "marketResult" && (
        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
            <h2 className="font-display text-2xl">
              {storeName.trim() ? `${storeName} 결과 요약` : "결과 요약"}
            </h2>
            <div className="mt-6 grid gap-4 text-sm text-black/70">
              <div className="flex items-center justify-between">
                <span>총점(6개 평균)</span>
                <span className="font-semibold text-black">
                  {totalScore.toFixed(1)}점
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>개선 우선순위 TOP2</span>
                <span className="text-xs text-black/60">
                  {improvementTop2.map((item) => item.title).join(", ") || "-"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/60">
              <p className="font-semibold text-black/70">격차 TOP3</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {gapTop3.length === 0 ? (
                  <span className="text-xs text-black/40">격차 없음</span>
                ) : (
                  gapTop3.map((item) => (
                    <span
                      key={item.title}
                      className="rounded-full border border-black/10 px-3 py-1"
                    >
                      {item.title} · {item.gap.toFixed(1)}점
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                결과 공유/복사
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setView("home");
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
              >
                다시하기
              </button>
            </div>
          </div>

          <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
            <h2 className="font-display text-2xl">다음 단계</h2>
            <p className="mt-3 text-sm text-black/60">
              점수가 낮은 항목은 내부 운영 진단에서 원인을 찾아보세요. 경쟁점 비교는
              필요할 때만 추가로 진행할 수 있습니다.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setView("opsIntro")}
                className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
              >
                내부 운영 진단 시작하기
              </button>
              <button
                type="button"
                onClick={() => setView("marketCompetitors")}
                className="w-full rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
              >
                경쟁점 비교 추가하기
              </button>
            </div>
          </div>
        </section>
      )}

      {view === "marketCompetitors" && (
        <section className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">경쟁점 비교</h2>
              <p className="mt-2 text-sm text-black/60">
                필요할 때만 추가로 경쟁점을 평가하세요. 카테고리별 문항을 동일 기준으로 점검합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={addCompetitor}
              className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
            >
              경쟁점 추가
            </button>
          </div>
          <div className="mt-6 grid gap-6">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="rounded-3xl border border-black/10 bg-white/80 p-5"
              >
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold"
                    value={competitor.name}
                    onChange={(e) => updateCompetitor(competitor.id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCompetitor(competitor.id)}
                    className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                    disabled={competitors.length <= 2}
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-4 grid gap-4">
                  {MARKET_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="rounded-2xl border border-black/10 p-3">
                      <p className="text-sm font-semibold text-black/70">{cat.title}</p>
                      <div className="mt-2 grid gap-8">
                        {cat.questions.map((question, idx) => (
                          <label
                            key={`${cat.id}-${idx}-${competitor.id}`}
                            className="flex flex-col gap-4 text-sm text-black/70"
                          >
                            <span>
                              {idx + 1}. {question}
                            </span>
                            <RatingButtons
                              value={competitor.scores[cat.id]?.[idx] ?? null}
                              onChange={(value) =>
                                updateCompetitorScore(
                                  competitor.id,
                                  cat.id,
                                  idx,
                                  value
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView("marketResult")}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
            >
              결과 요약으로 돌아가기
            </button>
            <button
              type="button"
              onClick={() => setView("home")}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
            >
              홈으로
            </button>
          </div>
        </section>
      )}

      {view === "opsIntro" && (
        <section className="rounded-3xl border border-black/5 bg-white/80 p-8">
          <h2 className="font-display text-3xl">내부 운영 진단 온보딩</h2>
          <p className="mt-3 text-sm text-black/60">
            내부 운영 진단은 프로세스 성숙도를 확인해 개선 포인트를 찾는 테스트입니다.
          </p>
          <p className="mt-2 text-xs text-black/50">
            소요시간 약 8~12분 · 6개 카테고리 60문항 · 사장/직원/예비창업자 모두 사용 가능
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView("home")}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black/60"
            >
              이전
            </button>
            <button
              type="button"
              onClick={() => {
                setOpsStep(0);
                setView("opsTest");
              }}
              className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-black/60"
            >
              시작하기
            </button>
          </div>
        </section>
      )}

      {view === "opsTest" && (
        <>
          <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                  STEP {opsStep + 1}/{opsStepCount}
                </p>
                <h2 className="font-display mt-2 text-2xl">
                  {currentOpsCategory.title}
                </h2>
                <p className="text-xs text-black/40">
                  {currentOpsCategory.description}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-black/5">
              <div
                className="h-2 rounded-full bg-black/60 transition-all"
                style={{ width: `${opsStepProgress}%` }}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-1">
            <div className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
              <h2 className="font-display text-xl">내부 운영 점수</h2>
              <p className="mt-2 text-sm text-black/50">
                문항마다 1~5점으로 평가하세요. (1 전혀 아니다 · 5 매우 그렇다)
              </p>
              <div className="mt-6 rounded-2xl border border-black/10 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-black/70">
                      {currentOpsCategory.title}
                    </p>
                    <p className="text-xs text-black/40">
                      {currentOpsCategory.description}
                    </p>
                  </div>
                  <span className="text-xs text-black/50">
                    {opsProfile
                      .find((item) => item.id === currentOpsCategory.id)
                      ?.score.toFixed(1)}점
                  </span>
                </div>
                <div className="mt-4 grid gap-8">
                  {currentOpsCategory.statements.map((statement, idx) => (
                    <label
                      key={`${currentOpsCategory.id}-${idx}`}
                      className="flex w-full flex-col gap-4 text-sm text-black/70"
                      ref={(el) => {
                        if (!opsQuestionRefs.current[currentOpsCategory.id]) {
                          opsQuestionRefs.current[currentOpsCategory.id] = [];
                        }
                        opsQuestionRefs.current[currentOpsCategory.id][idx] = el;
                      }}
                    >
                      <span>
                        {idx + 1}. {statement}
                      </span>
                      <RatingButtons
                        value={opsScores[currentOpsCategory.id]?.[idx] ?? null}
                        onChange={(value) => {
                          updateOpsScore(currentOpsCategory.id, idx, value);
                          requestAnimationFrame(() => {
                            const nextIdx = idx + 1;
                            const nextEl =
                              opsQuestionRefs.current[currentOpsCategory.id]?.[nextIdx];
                            if (nextEl) {
                              nextEl.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            } else {
                              opsNavRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
                <div
                  ref={opsNavRef}
                  className="mt-8 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setOpsStep((prev) => Math.max(0, prev - 1))}
                    disabled={opsStep === 0}
                    className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                  >
                    이전
                  </button>
                  {opsStep === opsStepCount - 1 ? (
                    <button
                      type="button"
                      onClick={() => setView("opsResult")}
                      disabled={!isOpsCategoryComplete}
                      className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                    >
                      끝내기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOpsStep((prev) => Math.min(opsStepCount - 1, prev + 1))
                      }
                      disabled={!isOpsCategoryComplete}
                      className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold text-black/60 disabled:opacity-40"
                    >
                      다음
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {view === "opsResult" && (
        <section className="card-shadow rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="font-display text-2xl">내부 운영 진단 결과</h2>
          <div className="mt-4 text-sm text-black/60">
            총점(6개 평균) <span className="font-semibold text-black">{opsTotalScore.toFixed(1)}점</span>
          </div>

          <div className="mt-6 grid gap-4">
            <h3 className="text-sm font-semibold text-black/70">최저점 카테고리 2개</h3>
            {opsLowest2.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-black/70">{cat.title}</p>
                    <p className="text-xs text-black/40">{cat.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-black">
                    {cat.score.toFixed(1)}점
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-black/70">즉시 액션 3개</p>
                  <ul className="mt-2 grid gap-2 text-xs text-black/60">
                    {cat.actions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-black/70">올인원툴 바로가기</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cat.tools.length === 0 ? (
                      <span className="text-xs text-black/40">관련 툴 준비중</span>
                    ) : (
                      cat.tools.map((tool) => (
                        <a
                          key={tool.href}
                          href={tool.href}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
                        >
                          {tool.label}
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                resetAll();
                setView("home");
              }}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
            >
              다시하기
            </button>
            <button
              type="button"
              onClick={() => setView("home")}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/60"
            >
              홈으로
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
