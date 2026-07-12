"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Send, Loader2 } from "lucide-react";

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newSeq, setNewSeq] = useState({ name: "", steps: [] as any[] });
  const [step, setStep] = useState({ delay: 3, channel: "email", message: "" });
  const [enrollId, setEnrollId] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [selCol, setSelCol] = useState("");
  const [enrollContacts, setEnrollContacts] = useState<any[]>([]);
  const [selContacts, setSelContacts] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [sr, cr] = await Promise.all([authFetch("/api/sequences"), authFetch("/api/collections")]);
    const sd = await sr.json(); const cd = await cr.json();
    setSequences(sd.data || []); setCollections(cd.data || []);
  }

  async function loadContacts(colId: string) {
    setSelCol(colId); setSelContacts([]);
    if (!colId) { setEnrollContacts([]); return; }
    const r = await authFetch("/api/contacts?collection_id=" + colId + "&limit=100");
    const d = await r.json(); setEnrollContacts(d.data || []);
  }

  const addStep = () => { if (!step.message) return; setNewSeq({ ...newSeq, steps: [...newSeq.steps, { ...step }] }); setStep({ delay: 3, channel: "email", message: "" }); };
  const removeStep = (i: number) => setNewSeq({ ...newSeq, steps: newSeq.steps.filter((_: any, idx: number) => idx !== i) });

  const createSeq = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newSeq.name || !newSeq.steps.length) return;
    await authFetch("/api/sequences", { method: "POST", body: JSON.stringify({ ...newSeq, steps: JSON.stringify(newSeq.steps) }), headers: { "Content-Type": "application/json" } });
    setShowNew(false); setNewSeq({ name: "", steps: [] }); load();
  };

  const toggle = async (id: string, enabled: boolean) => { await authFetch("/api/sequences/" + id, { method: "PATCH", body: JSON.stringify({ enabled: !enabled }), headers: { "Content-Type": "application/json" } }); load(); };
  const del = async (id: string) => { if (!confirm("Delete this sequence?")) return; await authFetch("/api/sequences/" + id, { method: "DELETE" }); load(); };

  const enroll = async () => {
    if (!selContacts.length || !enrollId) return;
    setSending(true); let sent = 0, failed = 0;
    const seq = sequences.find((s: any) => s.id === enrollId);
    let steps: any[] = [];
    try { steps = typeof seq?.steps === "string" ? JSON.parse(seq.steps) : (seq?.steps || []); } catch {}
    const firstStep = steps[0];
    if (firstStep) {
      for (const cid of selContacts) {
        const c = enrollContacts.find((x: any) => x.id === cid); if (!c) continue;
        const msg = (firstStep.message || "").replace(/\{\{name\}\}/g, c.name || "").replace(/\{\{company\}\}/g, c.company || "").replace(/\{\{title\}\}/g, c.title || "");
        try { const r = await authFetch("/api/send", { method: "POST", body: JSON.stringify({ channel: firstStep.channel, contact_id: cid, subject: firstStep.channel === "email" ? seq?.name : undefined, message: msg, recipient_name: c.name, recipient_company: c.company }), headers: { "Content-Type": "application/json" } }); const d = await r.json(); if (d.error) failed++; else sent++; } catch { failed++; }
      }
    }
    setResult("Sent " + sent + " messages, failed " + failed); setSending(false); setEnrollId(null); setSelContacts([]); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Sequences</h1><p className="text-sm text-gray-500">Automated multi-step follow-up campaigns</p></div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus className="h-4 w-4" /> New Sequence</button>
      </div>
      {result && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{result}</div>}

      {showNew && (
        <form onSubmit={createSeq} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Create Sequence</h3>
          <input placeholder="Sequence name (e.g. Cold Outreach)" value={newSeq.name} onChange={(e: any) => setNewSeq({ ...newSeq, name: e.target.value })} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
          <div className="mb-3 flex gap-2 items-end">
            <div><label className="block text-xs text-gray-500 mb-1">Wait (days)</label><input type="number" min="0" value={step.delay} onChange={(e: any) => setStep({ ...step, delay: Number(e.target.value) })} className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Channel</label><select value={step.channel} onChange={(e: any) => setStep({ ...step, channel: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></div>
            <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Message template</label><textarea placeholder="Write your message here..." value={step.message} onChange={function(e) { setStep({ delay: step.delay, channel: step.channel, message: e.target.value }); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2}></textarea></div>
            <button type="button" onClick={addStep} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold whitespace-nowrap hover:bg-gray-200">+ Add</button>
          </div>
          {newSeq.steps.length > 0 && <div className="mb-3 space-y-1"><p className="text-xs font-semibold text-gray-600 mb-1">Steps ({newSeq.steps.length}):</p>{newSeq.steps.map((s: any, i: number) => <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs"><span className="font-bold text-blue-600">{i + 1}.</span><Clock className="h-3 w-3 text-gray-400" /><span className="font-medium text-gray-700">Wait {s.delay}d</span><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">{s.channel}</span><span className="text-gray-400 truncate flex-1">{s.message?.slice(0, 60)}...</span><button type="button" onClick={() => removeStep(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button></div>)}</div>}
          <div className="flex gap-2"><button type="submit" disabled={!newSeq.name || !newSeq.steps.length} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create</button><button type="button" onClick={() => { setShowNew(false); setNewSeq({ name: "", steps: [] }); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button></div>
        </form>
      )}

      {enrollId && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Enroll Contacts</h3>
            <button onClick={() => { setEnrollId(null); setSelContacts([]); setEnrollContacts([]); }} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <select value={selCol} onChange={(e: any) => loadContacts(e.target.value)} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">Select a collection</option>{collections.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
          {enrollContacts.length > 0 && (<>
            <div className="max-h-60 overflow-y-auto space-y-1 mb-3">
              {enrollContacts.map((c: any) => <label key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={selContacts.includes(c.id)} onChange={() => setSelContacts(prev => prev.includes(c.id) ? prev.filter((x: string) => x !== c.id) : [...prev, c.id])} className="rounded" /><span className="text-sm font-medium text-gray-900">{c.name}</span><span className="text-xs text-gray-400">{c.email || ""}</span></label>)}
            </div>
            <button onClick={enroll} disabled={sending || selContacts.length === 0} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send First Step to {selContacts.length} contacts</button>
          </>)}
        </div>
      )}

      <div className="space-y-3">
        {sequences.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(s.id, s.enabled)}>{s.enabled ? "ON" : "OFF"}</button>
                <div><p className="font-semibold text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{(() => { let p = []; try { p = typeof s.steps === "string" ? JSON.parse(s.steps) : (s.steps || []); } catch {} return p.length; })()} steps</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEnrollId(s.id); setSelCol(""); setEnrollContacts([]); }} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">Enroll</button>
                <button onClick={() => del(s.id)} className="rounded-lg p-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {(() => { let parsed = []; try { parsed = typeof s.steps === "string" ? JSON.parse(s.steps) : s.steps; } catch {} if (!Array.isArray(parsed)) parsed = []; return parsed.map((st: any, i: number) => <div key={i} className="flex items-center gap-3 py-2 border-t border-gray-50 text-sm"><span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold">{i + 1}</span><Clock className="h-3 w-3 text-gray-400" /><span className="text-gray-500">{st.delay} days</span><span className="text-xs text-gray-600 uppercase">{st.channel}</span><span className="text-gray-400 truncate">{st.message?.slice(0, 80)}</span></div>); })()}
          </div>
        ))}
        {sequences.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No sequences yet. Create your first automated campaign.</p>}
      </div>
    </div>
  );
}
