import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();

  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (payload?.level === "error") {
    console.error("[monitoring]", JSON.stringify(entry));
  } else {
    console.info("[monitoring]", JSON.stringify(entry));
  }

  return NextResponse.json({ ok: true });
}
