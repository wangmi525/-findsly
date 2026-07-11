"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, DollarSign, MoreHorizontal } from "lucide-react";

const STAGES = ["lead", "contacted", "replied", "negotiating", "won", "lost"];
const STAGE_LABELS: Record<string, string> = { lead: "Lead", contacted: "Contacted", replied: "Replied", negotiating: "Negotiating", won: "Won", lost: "Lost" };
const STAGE_COLORS: Record<string, string> = { lead: "bg-gray-100", contacted: "bg-blue-100", replied: "bg-amber-100", negotiating: "bg-purple-100", won: "bg-green-100", lost: "bg-red-100" };

export default function PipelinePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newDeal, setNewDeal] = useState({ name: "", value: 0, stage: "lead", contact_id: "" });
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => { loadDeals(); loadContacts(); }, []);

  async function loadDeals() {
    const res = await authFetch("/api/deals"); const d = await res.json();
    setDeals(d.data || []);
  }
  async function loadContacts() {
    const res = await authFetch("/api/contacts?limit=100"); const d = await res.json();
    setContacts(d.data || []);
  }

  async function updateStage(dealId: string, stage: string) {
    await fetch(`/api/deals/${dealId}`, { method: "PATCH", body: JSON.stringify({ stage }), headers: { "Content-Type": "application/json" } });
    setDeals(ds => ds.map(d => d.id === dealId ? { ...d, stage } : d));
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    const res = await authFetch("/api/deals", { method: "POST", body: JSON.stringify(newDeal), headers: { "Content-Type": "application/json" } });
    if (res.ok) { setShowNew(false); setNewDeal({ name: "", value: 0, stage: "lead", contact_id: "" }); loadDeals(); }
  }

  const totalValue = deals.filter(d => !["won", "lost"].includes(d.stage)).reduce((s: number, d: any) => s + Number(d.value), 0);
  const weightedValue = deals.filter(d => !["won", "lost"].includes(d.stage)).reduce((s: number, d: any) => s + Number(d.value) * (d.probability || 20) / 100, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500">{deals.length} deals · ${totalValue.toLocaleString()} total · ${weightedValue.toLocaleString()} weighted</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          <Plus className="h-4 w-4" /> New Deal
        </button>
      </div>

      {showNew && (
        <form onSubmit={createDeal} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">Create Deal</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <input placeholder="Deal name" value={newDeal.name} onChange={e => setNewDeal({ ...newDeal, name: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
            <input type="number" placeholder="Value ($)" value={newDeal.value || ""} onChange={e => setNewDeal({ ...newDeal, value: Number(e.target.value) })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <select value={newDeal.contact_id} onChange={e => setNewDeal({ ...newDeal, contact_id: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">No contact</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create</button>
              <button type="button" onClick={() => setShowNew(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          return (
            <div key={stage} className={`rounded-xl ${STAGE_COLORS[stage]} border border-gray-100 p-3`}>
              <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-700">
                {STAGE_LABELS[stage]}
                <span className="text-xs text-gray-400">{stageDeals.length}</span>
              </h3>
              <div className="space-y-2">
                {stageDeals.map(d => (
                  <div key={d.id} className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.contacts?.name || "—"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">${Number(d.value).toLocaleString()}</span>
                      <select value={d.stage} onChange={e => updateStage(d.id, e.target.value)} className="rounded border border-gray-200 text-xs px-1 py-0.5">
                        {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
