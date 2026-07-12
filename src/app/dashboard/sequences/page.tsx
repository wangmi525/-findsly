"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Send, Loader2 } from "lucide-react";
export default function SequencesPage() {
  const [seqs, setSeqs] = useState<any[]>([]);
  const [ns, setNs] = useState({ name: "", steps: [] as any[] });
  const [st, setSt] = useState({ delay: 3, channel: "email", message: "" });
  const [cols, setCols] = useState<any[]>([]);
  const [selCol, setSelCol] = useState("");
  const [ctcs, setCtcs] = useState<any[]>([]);
  const [selC, setSelC] = useState<string[]>([]);
  const [aSeq, setASeq] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { load(); }, []);
  async function load() {
    const [sr, cr] = await Promise.all([authFetch("/api/sequences"), authFetch("/api/collections")]);
    setSeqs((await sr.json()).data || []);
    setCols((await cr.json()).data || []);
  }
  async function loadC(cId: string) {
    setSelCol(cId); setSelC([]);
    if (!cId) { setCtcs([]); return; }
    const r = await authFetch("/api/contacts?collection_id=" + cId + "&limit=100");
    setCtcs((await r.json()).data || []);
  }
  const addS = () => { if (!st.message.trim()) { alert("Write a message first"); return; } setNs({ ...ns, steps: [...ns.steps, { ...st }] }); setSt({ delay: 3, channel: "email", message: "" }); };
  const remS = (i: number) => setNs({ ...ns, steps: ns.steps.filter((_: any, idx: number) => idx !== i) });
  const create = async (e: React.FormEvent) => { e.preventDefault(); if (!ns.name || !ns.steps.length) return; await authFetch("/api/sequences", { method: "POST", body: JSON.stringify({ ...ns, steps: JSON.stringify(ns.steps) }), headers: { "Content-Type": "application/json" } }); setNs({ name: "", steps: [] }); load(); };
  const tog = async (id: string, en: boolean) => { await authFetch("/api/sequences/" + id, { method: "PATCH", body: JSON.stringify({ enabled: !en }), headers: { "Content-Type": "application/json" } }); load(); };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await authFetch("/api/sequences/" + id, { method: "DELETE" }); load(); };
  const send = async () => {
    if (!aSeq || selC.length === 0) { alert("Select a sequence and contacts first"); return; }
    const seq = seqs.find((s: any) => s.id === aSeq);
    let steps: any[] = []; try { steps = typeof seq?.steps === "string" ? JSON.parse(seq.steps) : (seq?.steps || []); } catch {}
    const first = steps[0]; if (!first) return;
    setSending(true); let sent = 0, failed = 0;
    for (const cid of selC) { const c = ctcs.find((x: any) => x.id === cid); if (!c) continue;
      const txt = (first.message || "").replace(/\[name\]/g, c.name || "").replace(/\[company\]/g, c.company || "").replace(/\[title\]/g, c.title || "");
      try { const r = await authFetch("/api/send", { method: "POST", body: JSON.stringify({ channel: first.channel, contact_id: cid, subject: first.channel === "email" ? seq?.name : undefined, message: txt, recipient_name: c.name, recipient_company: c.company }), headers: { "Content-Type": "application/json" } }); const d = await r.json(); if (d.error) failed++; else sent++; } catch { failed++; }
    }
    setMsg("Sent " + sent + ", failed " + failed); setSending(false); load();
  };


  return (<div>
    <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Sequences</h1><p className="text-sm text-gray-500">Create campaigns, select contacts, send first step</p></div>
    {msg && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex justify-between"><span>{msg}</span><button onClick={() => setMsg(null)} className="font-bold">X</button></div>}
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Create Sequence</h3>
          <form onSubmit={create} className="space-y-3">
            <input placeholder="Sequence name (e.g. Cold Outreach)" value={ns.name} onChange={(e: any) => setNs({ ...ns, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
            <div className="flex gap-2 items-end">
              <div><label className="block text-xs text-gray-500 mb-1">Wait days</label><input type="number" min="0" value={st.delay} onChange={(e: any) => setSt({ ...st, delay: Number(e.target.value) })} className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Channel</label><select value={st.channel} onChange={(e: any) => setSt({ ...st, channel: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></select></div>
              <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Message (use [name] [company] [title])</label><textarea placeholder="Write message..." value={st.message} onChange={(e: any) => setSt({ ...st, message: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={2}></textarea></div>
              <button type="button" onClick={addS} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold whitespace-nowrap">+ Add</button>
            </div>
            {ns.steps.length > 0 && <div className="space-y-1"><p className="text-xs font-semibold text-gray-600">Steps ({ns.steps.length}):</p>{ns.steps.map((s: any, i: number) => <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-xs"><span className="font-bold text-blue-600">{i+1}.</span><Clock className="h-3 w-3 text-gray-400" /><span className="font-medium">Wait {s.delay}d</span><span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">{s.channel}</span><span className="text-gray-400 truncate flex-1">{s.message?.slice(0,50)}...</span><button type="button" onClick={() => remS(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button></div>)}</div>}
            <button type="submit" disabled={!ns.name || !ns.steps.length} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save Sequence</button>
          </form>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">My Sequences</h3>
          {seqs.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">No sequences yet</p> : seqs.map((s: any) => <div key={s.id} className={"rounded-lg border p-3 mb-2 cursor-pointer " + (aSeq === s.id ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:border-gray-200")} onClick={() => setASeq(s.id)}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><button onClick={(e: any) => { e.stopPropagation(); tog(s.id, s.enabled); }} className={"text-xs font-bold px-2 py-0.5 rounded " + (s.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{s.enabled ? "ON" : "OFF"}</button><div><p className="font-semibold text-gray-900 text-sm">{s.name}</p><p className="text-xs text-gray-400">{(() => { let p = []; try { p = typeof s.steps === "string" ? JSON.parse(s.steps) : (s.steps || []); } catch {} return p.length; })()} steps</p></div></div><button onClick={(e: any) => { e.stopPropagation(); del(s.id); }} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div></div>)}
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-4">
          <h3 className="mb-3 font-semibold text-gray-900">Select Contacts</h3>
          <select value={selCol} onChange={(e: any) => loadC(e.target.value)} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="">Select a collection</option>{cols.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
          {aSeq ? <p className="mb-2 text-xs text-blue-600 font-semibold">Active: {seqs.find((s: any) => s.id === aSeq)?.name}</p> : <p className="mb-2 text-xs text-gray-400">Click a sequence on the left</p>}
          {ctcs.length > 0 && <div className="mb-2"><label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer"><input type="checkbox" checked={selC.length === ctcs.length} onChange={() => setSelC(selC.length === ctcs.length ? [] : ctcs.map((c: any) => c.id))} className="rounded" /> Select all ({ctcs.length})</label></div>}
          <div className="max-h-80 overflow-y-auto space-y-1 mb-4">{ctcs.map((c: any) => <label key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={selC.includes(c.id)} onChange={() => setSelC(selC.includes(c.id) ? selC.filter((x: string) => x !== c.id) : [...selC, c.id])} className="rounded" /><span className="text-sm font-medium text-gray-900">{c.name}</span><span className="text-xs text-gray-400">{c.email || ""}</span></label>)}</div>
          <button onClick={send} disabled={sending || selC.length === 0 || !aSeq} className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-500">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send First Step ({selC.length})</button>
        </div>
      </div>
    </div>
  </div>);
}
