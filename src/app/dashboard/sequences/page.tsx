"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Send, Loader2 } from "lucide-react";

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [selCol, setSelCol] = useState("");
  const [enrollContacts, setEnrollContacts] = useState<any[]>([]);
  const [selContacts, setSelContacts] = useState<string[]>([]);
  const [activeSeq, setActiveSeq] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [newSeq, setNewSeq] = useState({ name: "", steps: [] as any[] });
  const [step, setStep] = useState({ delay: 3, channel: "email", message: "" });

  useEffect(() => { load(); }, []);
  async function load() {
    const [sr, cr] = await Promise.all([authFetch("/api/sequences"), authFetch("/api/collections")]);
    setSequences((await sr.json()).data || []);
    setCollections((await cr.json()).data || []);
  }
  async function loadContacts(colId: string) {
    setSelCol(colId); setSelContacts([]);
    if (!colId) { setEnrollContacts([]); return; }
    const r = await authFetch("/api/contacts?collection_id=" + colId + "&limit=100");
    setEnrollContacts((await r.json()).data || []);
  }

  const addStep = () => {
    if (!step.message) return;
    setNewSeq({ ...newSeq, steps: [...newSeq.steps, { ...step }] });
    setStep({ delay: 3, channel: "email", message: "" });
  };

  const createSeq = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch("/api/sequences", { method: "POST", body: JSON.stringify({ ...newSeq, steps: JSON.stringify(newSeq.steps) }), headers: { "Content-Type": "application/json" } });
    setShowNew(false); setNewSeq({ name: "", steps: [] }); load();
  };

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/sequences/${id}`, { method: "PATCH", body: JSON.stringify({ enabled: !enabled }), headers: { "Content-Type": "application/json" } });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this sequence?")) return;
    await fetch(`/api/sequences/${id}`, { method: "DELETE" });
    load();
  };

  const sendFirstStep = async () => {
    if (!activeSeq || selContacts.length === 0) { alert("Select a sequence and contacts first"); return; }
    const seq = sequences.find((s: any) => s.id === activeSeq);
    let steps: any[] = [];
    try { steps = typeof seq?.steps === "string" ? JSON.parse(seq.steps) : (seq?.steps || []); } catch {}
    const first = steps[0]; if (!first) return;
    setSending(true); let sent = 0, failed = 0;
    for (const cid of selContacts) {
      const c = enrollContacts.find((x: any) => x.id === cid); if (!c) continue;
      const msg = (first.message || "").replace(/\[name\]/g, c.name || "").replace(/\[company\]/g, c.company || "").replace(/\[title\]/g, c.title || "");
      try {
        const r = await authFetch("/api/send", { method: "POST", body: JSON.stringify({ channel: first.channel, contact_id: cid, subject: first.channel === "email" ? seq?.name : undefined, message: msg, recipient_name: c.name, recipient_company: c.company }), headers: { "Content-Type": "application/json" } });
        const d = await r.json(); if (d.error) failed++; else sent++;
      } catch { failed++; }
    }
    setResult("Sent " + sent + " messages, failed " + failed); setSending(false); load();
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Sequences</h1><p className="text-sm text-gray-500">Create campaigns, select contacts, send first step</p></div>
      {result && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex justify-between"><span>{result}</span><button onClick={() => setResult(null)} className="font-bold">X</button></div>}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus className="h-4 w-4" /> New Sequence</button>
      </div>

      {showNew && (
        <form onSubmit={createSeq} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Create Sequence</h3>
          <input placeholder="Sequence name" value={newSeq.name} onChange={e => setNewSeq({ ...newSeq, name: e.target.value })} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
          <div className="mb-3 flex gap-2">
            <input type="number" placeholder="Delay (days)" value={step.delay} onChange={e => setStep({ ...step, delay: Number(e.target.value) })} className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <select value={step.channel} onChange={e => setStep({ ...step, channel: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option>
            </select>
            <textarea placeholder="Message template..." value={step.message} onChange={e => setStep({ ...step, message: e.target.value })} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2} />
            <button type="button" onClick={addStep} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">Add Step</button>
          </div>
          {newSeq.steps.length > 0 && (
            <div className="mb-3 space-y-1">
              <p className="text-xs text-gray-500 mb-1">Steps:</p>
              {newSeq.steps.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-1.5 text-xs"><span className="font-bold">{i + 1}.</span> Wait {s.delay}d → {s.channel}</div>
              ))}
            </div>
          )}
          <div className="flex gap-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create</button><button type="button" onClick={() => setShowNew(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button></div>
        </form>
      )}

      <div className="space-y-3">
        {sequences.map(s => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(s.id, s.enabled)}>{s.enabled ? "ON" : "OFF"}</button>
                <div><p className="font-semibold text-gray-900">{s.name}</p><p className="text-xs text-gray-400">Created {new Date(s.created_at).toLocaleDateString()}</p></div>
              </div>
              <button onClick={() => del(s.id)} className="rounded-lg p-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
            {(() => {
              let parsed = [];
              try { parsed = typeof s.steps === "string" ? JSON.parse(s.steps) : s.steps; } catch (e) {}
              if (!Array.isArray(parsed)) parsed = [];
              return parsed.map((st: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-t border-gray-50 text-sm">
                  <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold">{i + 1}</span>
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">{st.delay} days</span>
                  <span className="text-xs text-gray-600 uppercase">{st.channel}</span>
                  <span className="text-gray-400 truncate">{st.message?.slice(0, 50)}</span>
                </div>
              ));
            })()}
          </div>
        ))}
        {sequences.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No sequences yet. Create your first automated campaign.</p>}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-4">
            <h3 className="mb-3 font-semibold text-gray-900">Select Contacts</h3>
            <select value={selCol} onChange={(e: any) => loadContacts(e.target.value)} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">Select a collection</option>{collections.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
            {activeSeq ? <p className="mb-2 text-xs text-blue-600 font-semibold">Active: {sequences.find((s: any) => s.id === activeSeq)?.name}</p> : <p className="mb-2 text-xs text-gray-400">Click a sequence on the left</p>}
            {enrollContacts.length > 0 && <div className="mb-2"><label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer"><input type="checkbox" checked={selContacts.length === enrollContacts.length} onChange={() => setSelContacts(selContacts.length === enrollContacts.length ? [] : enrollContacts.map((c: any) => c.id))} className="rounded" /> Select all ({enrollContacts.length})</label></div>}
            <div className="max-h-80 overflow-y-auto space-y-1 mb-4">
              {enrollContacts.map((c: any) => <label key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={selContacts.includes(c.id)} onChange={() => setSelContacts(selContacts.includes(c.id) ? selContacts.filter((x: string) => x !== c.id) : [...selContacts, c.id])} className="rounded" /><span className="text-sm font-medium text-gray-900">{c.name}</span><span className="text-xs text-gray-400">{c.email || ""}</span></label>)}
            </div>
            <button onClick={sendFirstStep} disabled={sending || selContacts.length === 0 || !activeSeq} className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-500">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send First Step ({selContacts.length})</button>
          </div>
        </div>
      </div>
    </div>
  );
}
