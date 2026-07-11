"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, ToggleLeft, ToggleRight, ChevronDown, GitBranch, Clock, Mail, Phone, Send, Trash2 } from "lucide-react";

export default function SequencesPage() {
  const [sequences, setSequences] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newSeq, setNewSeq] = useState({ name: "", steps: [] as any[] });
  const [step, setStep] = useState({ delay: 3, channel: "email", message: "" });

  useEffect(() => { load(); }, []);
  async function load() {
    const res = await authFetch("/api/sequences"); const d = await res.json();
    setSequences(d.data || []);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Sequences</h1><p className="text-sm text-gray-500">Automated follow-up campaigns</p></div>
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
                <button onClick={() => toggle(s.id, s.enabled)}>{s.enabled ? <ToggleRight className="h-6 w-6 text-green-600" /> : <ToggleLeft className="h-6 w-6 text-gray-300" />}</button>
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
    </div>
  );
}
