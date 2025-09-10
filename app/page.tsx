"use client";

import { useState } from "react";

export default function Home() {
  const [capsuleId, setCapsuleId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const [text, setText] = useState("");
  const [img, setImg] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createCapsule() {
    try {
      setBusy(true); setMsg(null);
      const res = await fetch("/api/capsules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCapsuleId(data.id);
      setMsg("Capsule created with id " + data.id);
      setTitle(""); setDesc("");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally { setBusy(false); }
  }

  async function addText() {
    if (!capsuleId) return setMsg("Create a capsule first");
    try {
      setBusy(true); setMsg(null);
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsule_id: capsuleId, kind: "text", text_content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Text saved! id " + data.id);
      setText("");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally { setBusy(false); }
  }

  async function addImage() {
    if (!capsuleId) return setMsg("Create a capsule first");
    try {
      setBusy(true); setMsg(null);
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsule_id: capsuleId, kind: "image", media_url: img }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Image URL saved! id " + data.id);
      setImg("");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally { setBusy(false); }
  }

  async function doSearch() {
    try {
      setBusy(true); setMsg(null);
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, capsule_id: capsuleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResults(data.results || []);
      if (!data.results?.length) setMsg("No results yet.");
    } catch (e: any) {
      setMsg("Error: " + e.message);
    } finally { setBusy(false); }
  }

  return (
    <main className="max-w-xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-2">Time Capsule Demo</h1>
      <p className="text-gray-600 mb-4">Create a capsule, add memories, and search.</p>

      {msg && <div className="p-2 bg-gray-100 rounded mb-4">{msg}</div>}

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Create Capsule</h2>
        <input className="border p-2 w-full mb-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea className="border p-2 w-full mb-2"
          placeholder="Description"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={busy}
          onClick={createCapsule}>
          Create
        </button>
        {capsuleId && <p className="mt-2">Current capsule_id: <b>{capsuleId}</b></p>}
      </section>

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Add Item</h2>
        <input className="border p-2 w-full mb-2"
          placeholder="Write a memory"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={busy}
          onClick={addText}>
          Add Text
        </button>
        <input className="border p-2 w-full mt-4 mb-2"
          placeholder="Image URL (optional)"
          value={img}
          onChange={e => setImg(e.target.value)}
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={busy}
          onClick={addImage}>
          Add Image
        </button>
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Semantic Search</h2>
        <input className="border p-2 w-full mb-2"
          placeholder='Search phrase (e.g. "graduation beach")'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={busy}
          onClick={doSearch}>
          Search
        </button>
        <ul className="mt-4 space-y-2">
          {results.map(r => (
            <li key={r.id} className="border p-2 rounded">
              <b>#{r.id}</b> score={Number(r.score).toFixed(4)} — {r.text_content || r.media_url}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
