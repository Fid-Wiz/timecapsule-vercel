// app/api/capsules/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type CreateBody = {
  title?: string;
  description?: string;
  unlock_at?: string | null; // ISO string e.g. "2025-09-20T10:00:00Z"
  visibility?: "private" | "group" | "public";
};

export async function POST(req: Request) {
  try {
    const body: CreateBody = await req.json();

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const description = body.description || null;
    const visibility = (body.visibility as any) || "group";
    const unlock_at = body.unlock_at || null;

    // Decide initial state
    // - if unlock_at in the future => "locked"
    // - if no unlock_at or past => "unlocked" (visible per visibility rules)
    let state: "open" | "locked" | "unlocked" = "unlocked";
    if (unlock_at) {
      const now = new Date();
      const unlockDate = new Date(unlock_at);
      if (unlockDate.getTime() > now.getTime()) {
        state = "locked";
      } else {
        state = "unlocked";
      }
    }

    const [res]: any = await pool.query(
      `INSERT INTO capsules (title, description, unlock_at, visibility, state)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, unlock_at, visibility, state]
    );

    return NextResponse.json({ ok: true, id: res.insertId, state });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
