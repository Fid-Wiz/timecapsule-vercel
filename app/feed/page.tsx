"use client";
import { useEffect, useState } from "react";

type FeedItem = {
  id: number;
  capsule_id: number;
  content_type: "text" | "image" | "audio";
  text_content?: string | null;
  media_url?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at: string;
  capsule_title: string;
  visibility: "group" | "public" | "private";
};

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [handle, setHandle] = useState("Fid-Wiz");
  const [commentBox, setCommentBox] = useState<Record<number, string>>({});

  async function load() {
    try {
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setItems(data.items || []);
      if (!data.items?.length) setMsg("No public items yet.");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function likeItem(id: number) {
    const r = await fetch("/api/likes", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ item_id: id, user_handle: handle })
    });
    if (!r.ok) setMsg("Like failed");
  }

  async function addComment(id: number) {
    const text = commentBox[id]?.trim();
    if (!text) return;
    const r = await fetch("/api/comments", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ item_id: id, user_handle: handle, text })
    });
    if (!r.ok) setMsg("Comment failed");
    setCommentBox({ ...commentBox, [id]: "" });
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <a className="text-blue-600 underline text-sm" href="/">← Back</a>
        <h1 className="text-2xl font-bold">Public Feed</h1>
      </div>

      <div className="flex items-center gap-2 text-sm mb-4">
        <span>Your handle:</span>
        <input className="border p-1" value={handle} onChange={e=>setHandle(e.target.value)} />
      </div>

      {msg && <div className="p-2 bg-gray-100 rounded mb-4">{msg}</div>}

      <div className="space-y-4">
        {items.map(it => (
          <div key={it.id} className="border rounded p-3">
            <div className="text-xs text-gray-600">
              Capsule: <a className="text-blue-600 underline" href={`/capsule/${it.capsule_id}`}>{it.capsule_title}</a> • {new Date(it.created_at).toLocaleString()}
            </div>

            {it.content_type === "text" && <p className="mt-2">{it.text_content}</p>}
            {it.content_type === "image" && it.media_url && <img src={it.media_url} className="mt-2 max-h-80 object-contain" alt="" />}
            {it.content_type === "audio" && it.media_url && <audio className="mt-2 w-full" src={it.media_url} controls />}

            <div className="flex items-center gap-2 mt-3">
              <button className="text-sm bg-purple-600 text-white px-2 py-1 rounded" onClick={()=>likeItem(it.id)}>❤️ Like</button>
              <input
                className="border p-1 flex-1 text-sm"
                placeholder="Write a comment"
                value={commentBox[it.id] || ""}
                onChange={e=>setCommentBox({...commentBox, [it.id]: e.target.value})}
              />
              <button className="text-sm bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>addComment(it.id)}>Comment</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
