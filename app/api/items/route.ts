// app/api/items/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { embedText } from "@/lib/embeddings";
import { put } from "@vercel/blob";

export const runtime = "nodejs"; // required for Blob uploads

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Handle JSON (text or external URL case)
    if (contentType.includes("application/json")) {
      const { capsule_id, kind, text_content, media_url, contributor_id, author } =
        await req.json();

      if (!capsule_id) {
        return NextResponse.json({ error: "capsule_id required" }, { status: 400 });
      }

      const textForEmbedding =
        (text_content && String(text_content)) ||
        (media_url && `media:${media_url}`) ||
        "";

      const embedding = await embedText(textForEmbedding);

      const [res]: any = await pool.query(
        `INSERT INTO items (capsule_id, contributor_id, author, content_type, text_content, media_url, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(capsule_id),
          contributor_id || null,
          author || "anonymous",
          kind || "text",
          text_content || null,
          media_url || null,
          embedding,
        ]
      );

      return NextResponse.json({ ok: true, id: res.insertId });
    }

    // Handle multipart/form-data (file upload case)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const capsule_id = Number(form.get("capsule_id"));
      const file = form.get("file") as File | null;
      const contributor_id = form.get("contributor_id") || null;
      const author = form.get("author") || "anonymous";

      if (!capsule_id) {
        return NextResponse.json({ error: "capsule_id required" }, { status: 400 });
      }
      if (!file) {
        return NextResponse.json({ error: "file required" }, { status: 400 });
      }

      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
      });

      // Embedding based on filename
      const embedding = await embedText(`file:${file.name}`);

      const [res]: any = await pool.query(
        `INSERT INTO items (capsule_id, contributor_id, author, content_type, text_content, media_url, mime_type, size_bytes, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          capsule_id,
          contributor_id,
          author,
          file.type.startsWith("audio") ? "audio" : "image",
          null,
          blob.url,
          file.type,
          file.size,
          embedding,
        ]
      );

      return NextResponse.json({ ok: true, id: res.insertId, url: blob.url });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
