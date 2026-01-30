import { NextResponse } from "next/server";
import OpenAI from "openai";

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

type RequestBody = {
  industry?: string;
  reviewsText?: string;
  tone?: Tone;
  storeTone?: string;
  services?: string;
  introText?: string;
  outroText?: string;
  replyTypes?: string[];
  generateIntro?: boolean;
  generateOutro?: boolean;
  storeName?: string;
};

const tonePhrases: Record<
  Tone,
  { thanks: string; sorry: string; closing: string }
> = {
    정중형: {
      thanks: "소중한 리뷰에 진심으로 감사드립니다.",
      sorry: "불편을 드려 대단히 죄송합니다.",
      closing: "앞으로도 더 나은 서비스로 보답하겠습니다.",
    },
    친근형: {
      thanks: "리뷰 남겨줘서 고마워요!",
      sorry: "불편하게 해서 미안해요.",
      closing: "다음엔 더 만족스럽게 준비해둘게요!",
    },
    담백형: {
      thanks: "리뷰 감사합니다.",
      sorry: "불편을 드려 죄송합니다.",
      closing: "개선하겠습니다.",
    },
    공감형: {
      thanks: "좋게 봐주셔서 감사해요.",
      sorry: "속상하셨을 것 같아요. 죄송합니다.",
      closing: "다음에는 더 만족하실 수 있도록 준비하겠습니다.",
    },
    단호형: {
      thanks: "리뷰 감사합니다.",
      sorry: "불편을 드려 죄송합니다.",
      closing: "관련 기준을 재정비해 동일 문제가 재발하지 않도록 하겠습니다.",
    },
    유머형: {
      thanks: "리뷰 감사합니다! 덕분에 힘이 나요.",
      sorry: "불편을 드려 죄송합니다. 다음엔 웃음까지 챙길게요.",
      closing: "다음 방문엔 기분 좋은 한 줄로 돌려드리겠습니다.",
    },
    논리형: {
      thanks: "리뷰 감사합니다.",
      sorry: "불편을 드려 죄송합니다.",
      closing: "1) 확인 2) 조치 3) 안내 순으로 개선하겠습니다.",
    },
    열정형: {
      thanks: "리뷰 감사합니다! 바로 반영하겠습니다.",
      sorry: "불편을 드려 죄송합니다. 곧바로 개선하겠습니다!",
      closing: "더 나은 모습으로 꼭 보답하겠습니다!",
    },
    차분형: {
      thanks: "리뷰 감사합니다.",
      sorry: "불편을 드려 죄송합니다.",
      closing: "차분히 점검해 개선하겠습니다.",
    },
    권위형: {
      thanks: "리뷰에 감사드립니다.",
      sorry: "불편을 드린 점 사과드립니다.",
      closing: "기준에 맞춰 절차를 정비하고 재발 방지를 약속드립니다.",
    },
  };

const replyTypeLines: Record<string, string[]> = {
  "개인화 응대형": ["말씀하신 포인트를 꼼꼼히 확인했습니다.", "다음 방문에 더 좋은 경험을 드리겠습니다."],
  "사과·공감형": ["불편을 드린 점 다시 한 번 사과드립니다.", "마음 상하셨을 상황에 공감합니다."],
  "사실 확인형": ["상황 확인을 위해 방문 시간이나 주문 정보를 알려주시면 빠르게 확인하겠습니다."],
  "해결 안내형": ["현재 가능한 조치와 절차를 안내드리겠습니다. 필요하시면 바로 도와드릴게요."],
  "재발 방지 약속형": ["내부 점검과 교육을 통해 같은 문제가 반복되지 않도록 하겠습니다."],
  "원인 설명형": ["확인 결과 해당 부분에서 처리가 지연되었습니다. 개선 중입니다."],
  "보상 대신 대안 제시형": ["보상 대신 다음 방문 시 더 나은 경험을 드릴 수 있도록 준비하겠습니다."],
  "감사·칭찬 수용형": ["좋게 봐주셔서 감사합니다. 강점을 더 살려 나가겠습니다."],
  "리뷰 유도형": ["만족하셨다면 다음에도 리뷰로 이야기 나눠주시면 큰 힘이 됩니다."],
  "재방문 유도형": ["다음 방문 때는 더 만족스러운 경험을 드리겠습니다."],
  "브랜드 톤 강화형": ["저희는 작은 디테일까지 챙기는 매장을 지향합니다."],
  "정정·오해 해소형": ["사실과 다른 부분이 있어 정중히 안내드립니다."],
  "정책 안내형": ["교환/환불 및 운영 정책을 기준에 맞춰 안내드리겠습니다."],
  "안전·위생 안심형": ["위생과 품질 관리는 매일 점검하고 있습니다."],
  "속도·지연 사과형": ["대기/지연으로 불편을 드려 죄송합니다. 동선을 개선하겠습니다."],
  "품질 점검형": ["맛/온도/포장 상태를 재점검하고 개선하겠습니다."],
  "진정·갈등 완화형": ["감정이 상하셨을 상황을 이해합니다. 차분히 해결하겠습니다."],
  "외부요인 분리형": ["외부 요인은 별도로 확인하고 내부 조치도 함께 진행하겠습니다."],
  "추가 채널 유도형": ["민감한 내용은 DM/전화로 알려주시면 자세히 안내드리겠습니다."],
  "요약·마무리형": ["핵심만 정리해 개선하겠습니다. 다음에는 더 나은 모습으로 맞이하겠습니다."],
};

const pickTone = (tone?: Tone): Tone => {
  if (!tone) return "정중형";
  if (tonePhrases[tone]) return tone;
  return "정중형";
};

const isNegativeReview = (text: string) => {
  const keywords = [
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
    "지연",
    "늦게",
    "대기",
    "오류",
    "문제",
  ];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
};

const buildSystemPrompt = () =>
  [
    "너는 매장 리뷰 답글 작성 도우미다.",
    "목표: 현실적이고 과장 없는 답글을, 선택된 톤과 유형에 맞춰 한국어로 작성한다.",
    "금지: 허위/과장/환불·보상 약속/법률·의료 조언/개인정보 추정.",
    "응답 형식: 반드시 JSON만 출력한다.",
  ].join("\n");

const buildUserPrompt = (body: RequestBody) => {
  const lines = [
    `업종: ${body.industry}`,
    `리뷰: ${body.reviewsText}`,
    `톤: ${body.tone ?? "정중형"}`,
    `답글유형: ${(body.replyTypes ?? []).join(", ")}`,
  ];
  if (body.storeName) lines.push(`매장명: ${body.storeName}`);
  if (body.services) lines.push(`대표 서비스: ${body.services}`);
  if (body.storeTone) lines.push(`추가 요청사항: ${body.storeTone}`);
  if (body.introText) lines.push(`머릿말 참고: ${body.introText}`);
  if (body.outroText) lines.push(`꼬릿말 참고: ${body.outroText}`);
  lines.push(
    'JSON 스키마: {"replies":[{"title":"string","text":"string"}]}'
  );
  return lines.join("\n");
};

const parseReplies = (text: string) => {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.replies)) return null;
    const replies = parsed.replies
      .filter((r: any) => typeof r?.text === "string")
      .map((r: any, idx: number) => ({
        title: typeof r?.title === "string" ? r.title : `답글 ${idx + 1}`,
        text: r.text.trim(),
      }))
      .filter((r: { text: string }) => r.text.length > 0);
    return replies.length > 0 ? replies : null;
  } catch {
    return null;
  }
};

const generateLocalReplies = (body: RequestBody) => {
  const tone = pickTone(body.tone);
  const phrases = tonePhrases[tone];
  const introParts: string[] = [];
  const outroParts: string[] = [];
  const storeName = body.storeName?.trim();
  const services = body.services?.trim();
  const storeTone = body.storeTone?.trim();
  const replyTypes = (body.replyTypes || []).map((item) => item.trim()).filter(Boolean);

  if (body.generateIntro !== false) {
    if (body.introText?.trim()) {
      introParts.push(body.introText.trim());
    } else if (storeName) {
      introParts.push(`안녕하세요, ${storeName}입니다.`);
    } else {
      introParts.push("안녕하세요.");
    }
  }

  if (services) {
    introParts.push(`저희 ${body.industry}의 대표 서비스는 ${services}입니다.`);
  }

  const negative = isNegativeReview(body.reviewsText ?? "");
  const baseLine = negative ? phrases.sorry : phrases.thanks;

  if (body.generateOutro !== false) {
    if (body.outroText?.trim()) {
      outroParts.push(body.outroText.trim());
    } else {
      outroParts.push(phrases.closing);
    }
  }

  if (storeTone) {
    outroParts.push(`요청 사항: ${storeTone}`);
  }

  return replyTypes.slice(0, 3).map((type, index) => {
    const lines =
      replyTypeLines[type] || ["말씀해주신 의견을 반영해 개선하겠습니다."];
    const bodyText = [baseLine, ...lines].join(" ");
    const text = [...introParts, bodyText, ...outroParts]
      .filter(Boolean)
      .join(" ");
    return {
      title: `${type} ${index + 1}`,
      text,
    };
  });
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const industry = body.industry?.trim();
  const reviewsText = body.reviewsText?.trim();
  const replyTypes = (body.replyTypes || []).map((item) => item.trim()).filter(Boolean);

  if (!industry || !reviewsText) {
    return NextResponse.json(
      { error: "업종과 리뷰 내용을 모두 입력해주세요." },
      { status: 400 }
    );
  }

  if (replyTypes.length === 0) {
    return NextResponse.json(
      { error: "생성할 답글 유형을 최소 1개 선택해주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (apiKey) {
    try {
      const client = new OpenAI({ apiKey });
      const completion = await client.chat.completions.create({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(body) },
        ],
        response_format: { type: "json_object" },
      });
      const content = completion.choices[0]?.message?.content ?? "";
      const parsed = parseReplies(content);
      if (parsed) {
        return NextResponse.json({ replies: parsed });
      }
    } catch (err) {
      console.error("OpenAI generate error", err);
    }
  }

  const replies = generateLocalReplies(body);
  return NextResponse.json({
    replies,
    note: apiKey ? "fallback-local" : "no-openai-key",
  });
}
