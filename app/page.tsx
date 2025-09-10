"use client";

import { useEffect, useState } from "react";

type Capsule = { id: number; title: string; description?: string | null; state: string; unlock_at?: string | null; visibility: string };

export default function Home() {
  const [title, setTitle] = useState("");
  const [desc, setDesc]   = useState("");
  const [unlock, setUnlock] = useState(""); // ISO: 2025-09-16T10:30
  const [visibility, setVisibility] = useState<"private"|"group"|"public">("public");
  const [capsuleId, setCapsuleId] = useState<number | null>(null);
  const [invites, setInvites] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  // Last created capsule (fetch details)
  const [capsule, setCapsule] = useState<Capsule | null>(null);

  useEffect(() => {
    if (!capsuleId) return;
    (async () => {
      const r = await fetch(`/api/capsules/${capsuleId}`);
      if (r.ok) setCapsule(await r.json());
    })();
  }, [capsuleId]);

  async function createCapsule() {
    setMsg(null);
    const unlock_at = unlock ? new Date(unlock).toISOString() : null;
    const r = await fetch("/api/capsules", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title, description: desc, unlock_at, visibility })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Failed");
    setCapsuleId(j.id);
    setMsg(`Created capsule #${j.id} (state=${j.state})`);
    setTitle(""); setDesc("");
  }

  async function sendInvites() {
    if (!capsuleId) return setMsg("Create a capsule first");
    const entries = invites.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const invitees = entries.map(v => v.includes("@") ? { email:v } : { username:v });
    const r = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ capsule_id: capsuleId, invitees })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Failed");
    setMsg(`Invites created: ${j.created}`);
    setInvites("");
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-yellow-400" />
        <h1 className="text-2xl font-bold">PastPort — Your passport back to memories</h1>
      </header>

      {msg && <div className="p-2 bg-gray-100 rounded">{msg}</div>}

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Create Capsule</h2>
        <input className="border p-2 w-full" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="border p-2 w-full" placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600">Unlock date/time</label>
            <input className="border p-2 w-full" type="datetime-local" value={unlock} onChange={e=>setUnlock(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600">Visibility</label>
            <select className="border p-2 w-full" value={visibility} onChange={e=>setVisibility(e.target.value as any)}>
              <option value="private">private</option>
              <option value="group">group</option>
              <option value="public">public</option>
            </select>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={createCapsule}>Create</button>

        {capsuleId && (
          <p className="text-sm">Created: <a className="text-blue-600 underline" href={`/capsule/${capsuleId}`}>/capsule/{capsuleId}</a></p>
        )}
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Invite Friends</h2>
        <p className="text-sm text-gray-600">Enter emails or usernames separated by comma or new line.</p>
        <textarea className="border p-2 w-full h-24" placeholder={`friend1@example.com, friend2\ncoolbuddy`} value={invites} onChange={e=>setInvites(e.target.value)} />
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={sendInvites}>Send Invites</button>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-semibold">Explore Public Feed</h2>
        <a className="text-blue-600 underline" href="/feed">Open /feed</a>
      </section>

      {capsule && (
        <section className="border rounded p-4">
          <h2 className="font-semibold">Last Capsule</h2>
          <div className="text-sm">#{capsule.id} — <b>{capsule.title}</b></div>
          <div className="text-sm">State: <b>{capsule.state}</b> {capsule.unlock_at && <>• unlock_at: {new Date(capsule.unlock_at).toLocaleString()}</>}</div>
          <a className="text-blue-600 underline" href={`/capsule/${capsule.id}`}>Go to capsule</a>
        </section>
      )}
    </main>
  );
}
