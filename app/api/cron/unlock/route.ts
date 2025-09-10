// app/api/cron/unlock/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

// Optional protection (set CRON_SECRET in env and in Vercel cron headers if you want)
function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret set → allow (hackathon simplicity)
  const header = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  return header === secret;
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Flip locked capsules to unlocked when their time has arrived
    const [res]: any = await pool.query(
      `UPDATE capsules
         SET state = 'unlocked'
       WHERE state = 'locked'
         AND unlock_at IS NOT NULL
         AND unlock_at <= CURRENT_TIMESTAMP`
    );

    return NextResponse.json({ ok: true, unlocked: res.affectedRows || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}