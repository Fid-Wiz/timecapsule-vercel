// app/api/items/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedText } from "@/lib/embeddings";

export async function POST(req: Request) {
  try {
    const { capsule_id, kind, text_content, media_url, author } = await req.json();
    if (!capsule_id) {
      return NextResponse.json({ error: "capsule_id required" }, { status: 400 });
    }

    const textForEmbedding =
      (text_content && String(text_content)) ||
      (media_url && `image:${media_url}`) ||
      "";

    const embedding = await embedText(textForEmbedding); // returns "[...]" (384 numbers)

    const [res]: any = await pool.query(
      `INSERT INTO items (capsule_id, author, kind, text_content, media_url, embedding)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(capsule_id),
        author || "you",
        kind || "text",
        text_content || null,
        media_url || null,
        embedding,
      ]
    );

    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
