"use client";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: number;
  content_type: "text" | "image" | "audio";
  text_content?: string | null;
  media_url?: string | null;
  created_at: string;
};
type Capsule = {
  id: number;
  title: string;
  description?: string | null;
  state: "open"|"locked"|"unlocked";
  unlock_at?: string | null;
  visibility: "private"|"group"|"public";
};

export default function CapsulePage({ params }: { params: { id: string } }) {
  const cid = Number(params.id);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [handle, setHandle] = useState("Fid-Wiz"); // mock user handle for likes/comments
  const [commentBox, setCommentBox] = useState<Record<number, string>>({});

  const lockedUntil = useMemo(() => {
    if (!capsule?.unlock_at) return null;
    const t = new Date(capsule.unlock_at).getTime() - Date.now();
    return t > 0 ? t : 0;
  }, [capsule?.unlock_at]);

  async function loadCapsule() {
    const r = await fetch(`/api/capsules/${cid}`);
    if (r.ok) setCapsule(await r.json());
  }
  async function loadItems(p = 1) {
    const r = await fetch(`/api/capsules/${cid}/items?page=${p}&pageSize=20`);
    const j = await r.json();
    if (r.ok) {
      setItems(j.items); setPage(j.page); setTotal(j.total);
    } else {
      setMsg(j.error || "Failed to load items");
    }
  }

  useEffect(() => { loadCapsule(); loadItems(1); }, [cid]);

  async function addText() {
    if (!text.trim()) return;
    const r = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ capsule_id: cid, kind:"text", text_content: text, author: handle })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Failed");
    setText(""); loadItems(page);
  }

  async function uploadFile() {
    if (!file) return;
    const f = new FormData();
    f.append("capsule_id", String(cid));
    f.append("file", file);
    f.append("author", handle);
    const r = await fetch("/api/items", { method:"POST", body: f });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Failed");
    setFile(null); (document.getElementById("file") as HTMLInputElement).value = "";
    loadItems(page);
  }

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

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <a className="text-blue-600 underline text-sm" href="/">← Back</a>
      <h1 className="text-2xl font-bold">Capsule #{cid}</h1>
      {capsule && (
        <div className="p-3 border rounded">
          <div className="font-semibold">{capsule.title}</div>
          <div className="text-sm text-gray-600">{capsule.description}</div>
          <div className="text-sm mt-1">
            State: <b>{capsule.state}</b> {capsule.unlock_at && <>• unlock at: {new Date(capsule.unlock_at).toLocaleString()}</>}
          </div>
          {capsule.state === "locked" && lockedUntil !== null && (
            <div className="text-xs text-gray-500">🔒 Locked — unlocks in ~{Math.ceil(lockedUntil/1000/60)} min</div>
          )}
        </div>
      )}

      {msg && <div className="p-2 bg-gray-100 rounded">{msg}</div>}

      {/* Add content */}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">Add Content</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Your handle</label>
          <input className="border p-1" value={handle} onChange={e=>setHandle(e.target.value)} />
        </div>

        <div>
          <input className="border p-2 w-full" placeholder="Write a memory (text)" value={text} onChange={e=>setText(e.target.value)} />
          <button className="bg-green-600 text-white px-4 py-2 rounded mt-2" onClick={addText}>Add Text</button>
        </div>

        <div>
          <input id="file" type="file" className="border p-2 w-full" onChange={e=>setFile(e.target.files?.[0] || null)} />
          <button className="bg-green-600 text-white px-4 py-2 rounded mt-2" onClick={uploadFile}>Upload File (image/audio)</button>
        </div>
        <p className="text-xs text-gray-500">Files go to Vercel Blob (needs BLOB_READ_WRITE_TOKEN in env).</p>
      </section>

      {/* Items */}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-semibold">Items</h2>
        {!items.length && <div className="text-sm text-gray-500">No items yet.</div>}
        <div className="space-y-4">
          {items.map(it => (
            <div key={it.id} className="border rounded p-3">
              <div className="text-xs text-gray-600">{new Date(it.created_at).toLocaleString()}</div>
              {it.content_type === "text" && <p className="mt-2">{it.text_content}</p>}
              {it.content_type === "image" && it.media_url && (
                <img src={it.media_url} className="mt-2 max-h-80 object-contain" alt="" />
              )}
              {it.content_type === "audio" && it.media_url && (
                <audio className="mt-2 w-full" src={it.media_url} controls />
              )}
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

        {totalPages > 1 && (
          <div className="flex items-center gap-2 mt-2">
            <button className="border px-2 py-1 rounded" disabled={page<=1} onClick={()=>{ const p = page-1; setPage(p); loadItems(p); }}>Prev</button>
            <div className="text-sm">Page {page} / {totalPages}</div>
            <button className="border px-2 py-1 rounded" disabled={page>=totalPages} onClick={()=>{ const p = page+1; setPage(p); loadItems(p); }}>Next</button>
          </div>
        )}
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-semibold">Public Feed</h2>
        <a className="text-blue-600 underline" href="/feed">Go to /feed</a>
      </section>
    </main>
  );
}
