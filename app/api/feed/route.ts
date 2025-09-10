// app/api/feed/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") || 20));
    const offset = (page - 1) * pageSize;

    // Only items from capsules that are unlocked and not private
    const [rows]: any = await pool.query(
      `SELECT i.id, i.capsule_id, i.content_type, i.text_content, i.media_url,
              i.mime_type, i.size_bytes, i.created_at,
              c.title AS capsule_title, c.visibility
         FROM items i
         JOIN capsules c ON c.id = i.capsule_id
        WHERE c.state = 'unlocked'
          AND c.visibility IN ('group','public')
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    // Total count (for pagination UI later)
    const [cnt]: any = await pool.query(
      `SELECT COUNT(*) AS cnt
         FROM items i
         JOIN capsules c ON c.id = i.capsule_id
        WHERE c.state = 'unlocked'
          AND c.visibility IN ('group','public')`
    );

    return NextResponse.json({ page, pageSize, total: cnt[0].cnt, items: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}