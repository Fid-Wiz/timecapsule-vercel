// app/api/invites/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST: create invites
// body: { capsule_id: number, invitees: Array<{ email?: string, username?: string }> }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const capsule_id = Number(body.capsule_id);
    const invitees = Array.isArray(body.invitees) ? body.invitees : [];

    if (!capsule_id) {
      return NextResponse.json({ error: "capsule_id required" }, { status: 400 });
    }
    if (!invitees.length) {
      return NextResponse.json({ error: "invitees[] required" }, { status: 400 });
    }

    const values: any[] = [];
    for (const inv of invitees) {
      const email = inv?.email?.trim() || null;
      const username = inv?.username?.trim() || null;
      if (!email && !username) continue;
      values.push([capsule_id, email, username]);
    }
    if (!values.length) {
      return NextResponse.json({ error: "at least one invitee needs email or username" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO invites (capsule_id, invitee_email, invitee_username)
       VALUES ${values.map(() => "(?, ?, ?)").join(", ")}`,
      values.flat()
    );

    return NextResponse.json({ ok: true, created: values.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// GET: list invites by capsule_id  -> /api/invites?capsule_id=123
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const capsule_id = Number(url.searchParams.get("capsule_id") || 0);
    if (!capsule_id) {
      return NextResponse.json({ error: "capsule_id required" }, { status: 400 });
    }
    const [rows]: any = await pool.query(
      `SELECT id, invitee_email, invitee_username, status, created_at
       FROM invites
       WHERE capsule_id = ?
       ORDER BY id DESC`,
      [capsule_id]
    );
    return NextResponse.json({ capsule_id, invites: rows });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
