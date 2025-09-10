// app/api/search/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedText } from "@/lib/embeddings";

export async function POST(req: Request) {
  try {
    const { query, capsule_id } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const qvec = await embedText(query);

    // Stage 1: Get nearest candidates (uses vector index when available)
    const [rows]: any = await pool.query(
      `SELECT id, capsule_id, text_content, media_url,
              VEC_COSINE_DISTANCE(embedding, ?) AS score
       FROM items
       ORDER BY VEC_COSINE_DISTANCE(embedding, ?)
       LIMIT 50`,
      [qvec, qvec]
    );

    // Stage 2: optional filter by capsule, then top 10
    const filtered = (rows as any[])
      .filter(r => (capsule_id ? Number(r.capsule_id) === Number(capsule_id) : true))
      .sort((a, b) => a.score - b.score)
      .slice(0, 10);

    return NextResponse.json({ results: filtered });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
