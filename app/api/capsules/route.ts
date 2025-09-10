// app/api/capsules/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const [res]: any = await pool.query(
      "INSERT INTO capsules (title, description) VALUES (?, ?)",
      [title.trim(), description || null]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
