"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Play, Square, Trash2 } from "lucide-react";

export default function ABTestingPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", subject_a: "", body_a: "", subject_b: "", body_b: "", split_percentage: 50 });

  useEffect(() => { load(); }, []);
  async function load() { const r = await authFetch("/api/ab-test"); const d = await r.json(); setTests(d.data || []); }

  async function createTest(e: React.FormEvent) {
    e.preventDefault();
    await authFetch("/api/ab-test", { method: "POST", body: JSON.stringify(form), headers: { "Content-Type": "application/json" } });
    setShowNew(false); setForm({ name: "", subject_a: "", body_a: "", subject_b: "", body_b: "", split_percentage: 50 }); load();
  }

  async function toggleTest(id: string, action: string) {
    await authFetch("/api/ab-test", { method: "PATCH", body: JSON.stringify({ id, action }), headers: { "Content-Type": "application/json" } }); load();
  }

  async function deleteTest(id: string) {
    if (!confirm("Delete?")) return;
    await authFetch("/api/ab-test?id=" + id, { method: "DELETE" }); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1><p className="text-sm text-gray-500">Test different email versions to optimize conversions</p></div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus className="h-4 w-4" /> New Test</button>
      </div>

      {showNew && (
        <form onSubmit={createTest} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Create A/B Test</h3>
          <input placeholder="Test name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div><p className="mb-1 text-xs font-semibold text-gray-700">Version A</p><input placeholder="Subject" value={form.subject_a} onChange={e => setForm({ ...form, subject_a: e.target.value })} className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required /><textarea placeholder="Body" value={form.body_a} onChange={e => setForm({ ...form, body_a: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={4} required /></div>
            <div><p className="mb-1 text-xs font-semibold text-gray-700">Version B</p><input placeholder="Subject" value={form.subject_b} onChange={e => setForm({ ...form, subject_b: e.target.value })} className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" required /><textarea placeholder="Body" value={form.body_b} onChange={e => setForm({ ...form, body_b: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={4} required /></div>
          </div>
          <div className="flex items-center gap-4 mb-3"><label className="text-sm text-gray-700">Split: {form.split_percentage}% A / {100 - form.split_percentage}% B</label><input type="range" min="10" max="90" value={form.split_percentage} onChange={e => setForm({ ...form, split_percentage: Number(e.target.value) })} className="flex-1" /></div>
          <div className="flex gap-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create</button><button type="button" onClick={() => setShowNew(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button></div>
        </form>
      )}

      <div className="space-y-3">
        {tests.map(t => {
          const rateA = t.sent_a > 0 ? Math.round((t.opened_a / t.sent_a) * 100) : 0;
          const rateB = t.sent_b > 0 ? Math.round((t.opened_b / t.sent_b) * 100) : 0;
          const winner = rateA > rateB ? "A" : rateB > rateA ? "B" : "Tie";
          return (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div><p className="font-semibold text-gray-900">{t.name}</p><p className="text-xs text-gray-400">Status: {t.status} {t.status === "completed" && winner !== "Tie" && <span className="ml-2 text-green-600">Winner: {winner}</span>}</p></div>
                <div className="flex items-center gap-2">
                  {t.status === "draft" && <button onClick={() => toggleTest(t.id, "start")} className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100"><Play className="h-4 w-4" /></button>}
                  {t.status === "running" && <button onClick={() => toggleTest(t.id, "stop")} className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100"><Square className="h-4 w-4" /></button>}
                  <button onClick={() => deleteTest(t.id)} className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-700 mb-1">Version A ({t.split_percentage}%)</p><p className="text-sm text-gray-700 mb-1">Subject: {t.subject_a}</p><p className="text-xs text-gray-500 truncate">{t.body_a}</p><div className="mt-2 flex gap-3 text-xs text-gray-500"><span>Sent: {t.sent_a}</span><span>Opened: {t.opened_a} ({rateA}%)</span><span>Clicked: {t.clicked_a}</span></div></div>
                <div className="rounded-lg bg-green-50 p-3"><p className="text-xs font-semibold text-green-700 mb-1">Version B ({100 - t.split_percentage}%)</p><p className="text-sm text-gray-700 mb-1">Subject: {t.subject_b}</p><p className="text-xs text-gray-500 truncate">{t.body_b}</p><div className="mt-2 flex gap-3 text-xs text-gray-500"><span>Sent: {t.sent_b}</span><span>Opened: {t.opened_b} ({rateB}%)</span><span>Clicked: {t.clicked_b}</span></div></div>
              </div>
            </div>
          );
        })}
        {tests.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No A/B tests yet. Create your first test to optimize email performance.</p>}
      </div>
    </div>
  );
}
