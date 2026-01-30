import { NextResponse } from "next/server";

type FeedbackBody = {
  message?: string;
  path?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as FeedbackBody;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
  }

  console.info("Feedback received", {
    message,
    path: body.path?.trim() || "/",
    userAgent: body.userAgent?.trim() || "",
    context: body.context ?? null,
  });

  return NextResponse.json({ ok: true, stored: false, note: "로컬 저장 모드" });
}
