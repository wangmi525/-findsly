"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Trash2, Check, Edit3 } from "lucide-react";

const STAGES = ["lead", "contacted", "replied", "negotiating", "won", "lost"];
const STAGE_LABELS: Record<string, string> = { lead: "线索", contacted: "已联系", replied: "已回复", negotiating: "谈判中", won: "成交", lost: "流失" };
const STAGE_COLORS: Record<string, string> = { lead: "bg-gray-100", contacted: "bg-blue-100", replied: "bg-amber-100", negotiating: "bg-purple-100", won: "bg-green-100", lost: "bg-red-100" };

export default function PipelinePage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newDeal, setNewDeal] = useState({ name: "", value: "", stage: "lead", contact_id: "", contact_name: "" });
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [collectionContacts, setCollectionContacts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");

  useEffect(() => { loadDeals(); loadCollections(); }, []);

  async function loadDeals() { const res = await authFetch("/api/deals"); const d = await res.json(); setDeals(d.data || []); }
  async function loadCollections() { const res = await authFetch("/api/collections"); const d = await res.json(); setCollections(d.data || []); }

  async function loadCollectionContacts(collectionId: string) {
    setSelectedCollection(collectionId);
    if (!collectionId) { setCollectionContacts([]); return; }
    const res = await authFetch("/api/contacts?collection_id=" + collectionId + "&limit=100");
    const d = await res.json();
    setCollectionContacts(d.data || []);
  }

  async function updateStage(dealId: string, stage: string) {
    await authFetch("/api/deals/" + dealId, { method: "PATCH", body: JSON.stringify({ stage }) });
    setDeals(ds => ds.map(d => d.id === dealId ? { ...d, stage } : d));
  }

  async function deleteDeal(id: string) {
    if (!confirm("删除此交易？")) return;
    await authFetch("/api/deals/" + id, { method: "DELETE" });
    setDeals(ds => ds.filter(d => d.id !== id));
  }

  async function saveEdit(id: string) {
    await authFetch("/api/deals/" + id, { method: "PATCH", body: JSON.stringify({ name: editName, value: Number(editValue) }) });
    setEditingId(null);
    loadDeals();
  }

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    const res = await authFetch("/api/deals", { method: "POST", body: JSON.stringify({ ...newDeal, value: Number(newDeal.value) }) });
    if (res.ok) { setShowNew(false); setNewDeal({ name: "", value: "", stage: "lead", contact_id: "", contact_name: "" }); setSelectedCollection(""); setCollectionContacts([]); loadDeals(); }
  }

  const activeDeals = deals.filter(d => !["won", "lost"].includes(d.stage));
  const totalValue = activeDeals.reduce((s, d) => s + Number(d.value), 0);
  const weightedValue = activeDeals.reduce((s, d) => s + Number(d.value) * (d.probability || 20) / 100, 0);
  const wonDeals = deals.filter(d => d.stage === "won");
  const wonTotal = wonDeals.reduce((s, d) => s + Number(d.value), 0);
  const totalDeals = deals.length;
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管道</h1>
          <p className="text-sm text-gray-500">{totalDeals} 笔交易 · ${totalValue.toLocaleString()} 进行中 · ${wonTotal.toLocaleString()} 已成交 · 赢率 {winRate}%</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          <Plus className="h-4 w-4" /> 新建交易
        </button>
      </div>

      {/* 数据统计 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "总交易数", value: String(totalDeals), color: "text-gray-900" },
          { label: "进行中", value: "$" + totalValue.toLocaleString(), color: "text-blue-600" },
          { label: "加权预测", value: "$" + Math.round(weightedValue).toLocaleString(), color: "text-purple-600" },
          { label: "已成交", value: "$" + wonTotal.toLocaleString(), color: "text-green-600" },
          { label: "赢率", value: winRate + "%", color: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={"text-xl font-bold " + s.color}>{s.value}</p>
          </div>
        ))}
      </div>

      {showNew && (
        <form onSubmit={createDeal} className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">新建交易</h3>
          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <input placeholder="交易名称" value={newDeal.name} onChange={e => setNewDeal({ ...newDeal, name: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
            <input type="number" placeholder="金额 ($)" value={newDeal.value} onChange={e => setNewDeal({ ...newDeal, value: e.target.value })} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <select value={selectedCollection} onChange={e => loadCollectionContacts(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">选择档案</option>
              {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {selectedCollection && (
            <div className="mb-3">
              <select value={newDeal.contact_id} onChange={e => { const c = collectionContacts.find(x => x.id === e.target.value); setNewDeal({ ...newDeal, contact_id: e.target.value, contact_name: c?.name || "" }); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">选择客户</option>
                {collectionContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">创建</button>
            <button type="button" onClick={() => { setShowNew(false); setSelectedCollection(""); setCollectionContacts([]); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">取消</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageTotal = stageDeals.reduce((s, d) => s + Number(d.value), 0);
          return (
            <div key={stage} className={`rounded-xl ${STAGE_COLORS[stage]} border border-gray-100 p-3 min-h-[200px]`}>
              <h3 className="mb-1 flex items-center justify-between text-sm font-semibold text-gray-700">
                <span>{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-gray-400">{stageDeals.length}</span>
              </h3>
              {stageTotal > 0 && <p className="text-xs text-gray-500 mb-2">${stageTotal.toLocaleString()}</p>}
              <div className="space-y-2">
                {stageDeals.map(d => (
                  <div key={d.id} className="rounded-lg bg-white p-3 shadow-sm">
                    {editingId === d.id ? (
                      <div className="space-y-2">
                        <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded border border-blue-300 px-2 py-1 text-sm outline-none" placeholder="名称" />
                        <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full rounded border border-blue-300 px-2 py-1 text-sm outline-none" placeholder="金额" />
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(d.id)} className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700"><Check className="h-3 w-3 inline" /> 保存</button>
                          <button onClick={() => setEditingId(null)} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">取消</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900">{d.name}</p>
                        {d.contacts?.name && <p className="text-xs text-gray-500">{d.contacts.name}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">${Number(d.value).toLocaleString()}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingId(d.id); setEditName(d.name); setEditValue(String(d.value)); }} className="text-gray-400 hover:text-blue-600"><Edit3 className="h-3 w-3" /></button>
                            <button onClick={() => deleteDeal(d.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <select value={d.stage} onChange={e => updateStage(d.id, e.target.value)} className="mt-1 w-full rounded border border-gray-200 text-xs px-1 py-0.5">
                          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && <p className="py-4 text-center text-xs text-gray-400">空</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
