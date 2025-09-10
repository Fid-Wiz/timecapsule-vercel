// app/api/likes/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function ensureLikesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${process.env.TIDB_DATABASE}\`.\`likes\` (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      item_id BIGINT NOT NULL,
      user_handle VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_like (item_id, user_handle),
      INDEX idx_likes_item (item_id)
    )
  `);
}

// POST: like -> body: { item_id: number, user_handle: string }
export async function POST(req: Request) {
  try {
    await ensureLikesTable();

    const { item_id, user_handle } = await req.json();
    if (!item_id || !user_handle) {
      return NextResponse.json({ error: "item_id and user_handle required" }, { status: 400 });
    }

    await pool.query(
      `INSERT IGNORE INTO likes (item_id, user_handle) VALUES (?, ?)`,
      [Number(item_id), String(user_handle)]
    );

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) AS likes FROM likes WHERE item_id = ?`,
      [Number(item_id)]
    );

    return NextResponse.json({ ok: true, likes: countRows[0].likes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// DELETE: unlike -> /api/likes?item_id=123&user_handle=abc
export async function DELETE(req: Request) {
  try {
    await ensureLikesTable();

    const url = new URL(req.url);
    const item_id = Number(url.searchParams.get("item_id") || 0);
    const user_handle = url.searchParams.get("user_handle") || "";
    if (!item_id || !user_handle) {
      return NextResponse.json({ error: "item_id and user_handle required" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM likes WHERE item_id = ? AND user_handle = ?`,
      [item_id, user_handle]
    );

    const [countRows]: any = await pool.query(
      `SELECT COUNT(*) AS likes FROM likes WHERE item_id = ?`,
      [item_id]
    );

    return NextResponse.json({ ok: true, likes: countRows[0].likes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
