// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function ensureCommentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${process.env.TIDB_DATABASE}\`.\`comments\` (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      item_id BIGINT NOT NULL,
      user_handle VARCHAR(100) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comments_item (item_id)
    )
  `);
}

// POST: create comment -> body: { item_id: number, user_handle: string, text: string }
export async function POST(req: Request) {
  try {
    await ensureCommentsTable();

    const { item_id, user_handle, text } = await req.json();
    if (!item_id || !user_handle || !text || !String(text).trim()) {
      return NextResponse.json({ error: "item_id, user_handle, text required" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO comments (item_id, user_handle, text) VALUES (?, ?, ?)`,
      [Number(item_id), String(user_handle), String(text)]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// GET: list comments -> /api/comments?item_id=123&page=1&pageSize=20
export async function GET(req: Request) {
  try {
    await ensureCommentsTable();

    const url = new URL(req.url);
    const item_id = Number(url.searchParams.get("item_id") || 0);
    if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") || 20));
    const offset = (page - 1) * pageSize;

    const [rows]: any = await pool.query(
      `SELECT id, user_handle, text, created_at
         FROM comments
        WHERE item_id = ?
        ORDER BY id ASC
        LIMIT ? OFFSET ?`,
      [item_id, pageSize, offset]
    );

    const [cnt]: any = await pool.query(
      `SELECT COUNT(*) AS cnt FROM comments WHERE item_id = ?`,
      [item_id]
    );

    return NextResponse.json({ page, pageSize, total: cnt[0].cnt, comments: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
