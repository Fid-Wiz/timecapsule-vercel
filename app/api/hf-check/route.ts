import { NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";

export async function GET() {
  try {
    const s = await embedText("hello world");
    const arr = JSON.parse(s);
    return NextResponse.json({ ok: true, dim: arr.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
