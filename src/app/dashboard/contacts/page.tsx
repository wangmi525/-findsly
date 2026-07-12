"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, X, Trash2, Check, FolderPlus, FolderOpen, ArrowRight, ChevronRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase-client";

const TAGS = [
  { value: "vip", label: "VIP", color: "bg-purple-100 text-purple-700" },
  { value: "potential", label: "Potential", color: "bg-blue-100 text-blue-700" },
  { value: "followup", label: "Follow up", color: "bg-amber-100 text-amber-700" },
  { value: "won", label: "已成交", color: "bg-green-100 text-green-700" },
  { value: "cold", label: "Cold", color: "bg-gray-100 text-gray-600" },
];

const ICONS = ["📁", "🎯", "🔥", "⭐", "💼", "📋", "🏷️", "📊", "🤝", "🚀"];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [taggingId, setTaggingId] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollName, setNewCollName] = useState("");
  const [newCollIcon, setNewCollIcon] = useState("📁");
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const getToken = useCallback(async () => {
    try { const sb = getSupabase(); const { data } = await sb.auth.getSession(); return data?.session?.access_token || ""; } catch { return ""; }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      let url = "/api/contacts?limit=50&page=" + page;
      if (statusFilter) url += "&status=" + statusFilter;
      if (activeCollection) url += "&collection_id=" + activeCollection;
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" } });
      if (!res.ok) return;
      const d = await res.json();
      setContacts(d.data || []);
      setTotal(d.total || 0);
    } catch {}
  }, [page, statusFilter, activeCollection, getToken]);

  const loadCollections = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/collections", { headers: { Authorization: "Bearer " + token } });
      if (!res.ok) return;
      const d = await res.json();
      setCollections(d.data || []);
      const counts: Record<string, number> = {};
      for (const c of d.data || []) {
        const cr = await fetch("/api/contacts?collection_id=" + c.id + "&limit=1", { headers: { Authorization: "Bearer " + token } });
        if (cr.ok) { const cd = await cr.json(); counts[c.id] = cd.total || 0; }
      }
      setCollectionCounts(counts);
    } catch {}
  }, [getToken]);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadCollections(); }, [loadCollections]);

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const token = await getToken();
      if (!token) { setSearching(false); return; }
      const res = await fetch("/api/search", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ query, target: target || "United States", count: 20 }) });
      const d = await res.json();
      setResults(res.ok && d.data ? d.data : []);
      if (!res.ok && d.error) alert(d.error);
    } catch { alert("Search error"); }
    setSearching(false);
  }

  async function addContact(c: any) {
    try {
      const token = await getToken();
      await fetch("/api/contacts", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ name: c.name, company: c.company, title: c.title, email: c.email, phone: c.phone, website: c.website, source: c.source, score: c.score, tags: [], collection_id: activeCollection }) });
      setResults(rs => rs.filter((_, i) => i !== results.indexOf(c)));
      loadContacts();
    } catch {}
  }

  async function deleteOne(id: string) {
    if (!confirm("Confirm delete?")) return;
    try { const token = await getToken(); await fetch("/api/contacts/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } }); loadContacts(); } catch {}
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm("Delete " + selected.size + "  contacts？")) return;
    try {
      const token = await getToken();
      for (const id of selected) await fetch("/api/contacts/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      setSelected(new Set());
      loadContacts();
    } catch {}
  }

  async function saveName(id: string, name: string) {
    try { const token = await getToken(); await fetch("/api/contacts/" + id, { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); setEditingId(null); loadContacts(); } catch {}
  }

  async function saveTag(id: string, tag: string) {
    try { const token = await getToken(); await fetch("/api/contacts/" + id, { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ tags: tag ? [tag] : [] }) }); setTaggingId(null); loadContacts(); } catch {}
  }

  async function createCollection() {
    if (!newCollName.trim()) return;
    try {
      const token = await getToken();
      await fetch("/api/collections", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ name: newCollName, icon: newCollIcon }) });
      setShowNewCollection(false);
      setNewCollName("");
      loadCollections();
    } catch {}
  }

  async function renameCollection(id: string, name: string) {
    try { const token = await getToken(); await fetch("/api/collections/" + id, { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ name }) }); setRenamingId(null); loadCollections(); } catch {}
  }

  async function deleteCollection(id: string) {
    if (!confirm("Delete this collection? Contacts will be kept.")) return;
    try {
      const token = await getToken();
      await fetch("/api/collections/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      if (activeCollection === id) setActiveCollection(null);
      loadCollections();
      loadContacts();
    } catch {}
  }

  async function moveToCollection(contactIds: string[], collectionId: string) {
    try {
      const token = await getToken();
      await fetch("/api/contacts/move", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ contact_ids: contactIds, collection_id: collectionId || null }) });
      setSelected(new Set());
      setMovingTo(null);
      loadContacts();
      loadCollections();
    } catch {}
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === contacts.length) { setSelected(new Set()); } else { setSelected(new Set(contacts.map(c => c.id))); }
  }

  const totalInCollections = Object.values(collectionCounts).reduce((s, n) => s + n, 0);

  return (
    <div className="flex gap-6">
      {/* Left Sidebar: Collections */}
      <div className="w-64 shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">My Collections</h2>
          <button onClick={() => setShowNewCollection(true)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><FolderPlus className="h-4 w-4" /></button>
        </div>

        <div className="space-y-1">
          <button onClick={() => { setActiveCollection(null); setPage(1); }} className={"flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition " + (activeCollection === null ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50")}>
            <span className="flex items-center gap-2"><FolderOpen className="h-4 w-4" /> All Contacts</span>
            <span className="text-xs text-gray-400">{total}</span>
          </button>

          {collections.map(c => (
            <div key={c.id}>
              {renamingId === c.id ? (
                <div className="flex items-center gap-1 px-3 py-1">
                  <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") renameCollection(c.id, renameValue); if (e.key === "Escape") setRenamingId(null); }} className="w-full rounded border border-blue-300 px-2 py-1 text-sm outline-none" />
                  <button onClick={() => renameCollection(c.id, renameValue)} className="text-green-600"><Check className="h-3 w-3" /></button>
                </div>
              ) : (
                <button onClick={() => { setActiveCollection(c.id); setPage(1); }} onDoubleClick={() => { setRenamingId(c.id); setRenameValue(c.name); }} className={"flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition " + (activeCollection === c.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50")}>
                  <span className="flex items-center gap-2 truncate"><span>{c.icon || "📁"}</span> <span className="truncate">{c.name}</span></span>
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{collectionCounts[c.id] || 0}</span>
                    <button onClick={e => { e.stopPropagation(); deleteCollection(c.id); }} className="text-gray-300 hover:text-red-500 ml-1">×</button>
                  </span>
                </button>
              )}
            </div>
          ))}

          {collections.length === 0 && (
            <p className="px-3 py-2 text-xs text-gray-400">No collections yet<br />Click + to create</p>
          )}
        </div>

        {selected.size > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-800 mb-2">Selected {selected.size}  contacts</p>
            <div className="space-y-1">
              <button onClick={() => moveToCollection(Array.from(selected), "")} className="w-full rounded bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 text-left">Remove from collection</button>
              {collections.map(c => (
                <button key={c.id} onClick={() => moveToCollection(Array.from(selected), c.id)} className="w-full rounded bg-white border border-gray-200 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 text-left flex items-center gap-1">
                  {c.icon} 移入「{c.name}」
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Contacts Table */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500">{activeCollection ? collections.find(c => c.id === activeCollection)?.name + " · " : ""}{total}  contacts {selected.size > 0 && `· Selected ${selected.size}`}</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button onClick={deleteSelected} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500">
                <Trash2 className="h-4 w-4" /> Bulk delete ({selected.size})
              </button>
            )}
            <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
              <Search className="h-4 w-4" /> Search new contacts
            </button>
          </div>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSearch(false)}>
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Find contacts</h2>
                <button onClick={() => { setShowSearch(false); setResults([]); }} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <input placeholder="例如: yoga studio California" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" autoFocus />
                <input placeholder="目标市场（可选）" value={target} onChange={e => setTarget(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" />
              </div>
              <button onClick={runSearch} disabled={searching || !query.trim()} className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</> : <><Search className="h-4 w-4" /> Search</>}
              </button>
              {results.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                  <p className="text-xs text-gray-500">Found {results.length}  results</p>
                  {results.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.name} — {r.title || ""}</p>
                        <p className="text-xs text-gray-400 truncate">{r.company || ""} | {r.email || "No email"} | {r.source}</p>
                      </div>
                      <button onClick={() => addContact(r)} className="ml-3 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">添加</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Collection Modal */}
        {showNewCollection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewCollection(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">New Collection</h2>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Choose icon</label>
                <div className="flex gap-2">{ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewCollIcon(icon)} className={"text-xl rounded-lg p-2 border " + (newCollIcon === icon ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50")}>{icon}</button>
                ))}</div>
              </div>
              <input autoFocus placeholder="Collection name, e.g. July 2026 Yoga Clients" value={newCollName} onChange={e => setNewCollName(e.target.value)} onKeyDown={e => e.key === "Enter" && createCollection()} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm mb-4" />
              <div className="flex gap-2">
                <button onClick={createCollection} disabled={!newCollName.trim()} className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">Create</button>
                <button onClick={() => setShowNewCollection(false)} className="rounded-lg border border-gray-200 px-4 py-3 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none">
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">已联系</option>
            <option value="replied">Replied</option>
            <option value="won">已成交</option>
          </select>
        </div>

        {/* Contacts Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500 mb-4">No contacts yet</p>
              <button onClick={() => setShowSearch(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Find contacts</button>
            </div>
          ) : (
            <>
              <div className="px-4 pt-3 text-xs text-gray-400">评分说明：🟢 80+ 高优先 · 🟡 50-79 中优先 · ⚪ &lt;50 低优先</div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">公司</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">评分</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">标签</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">状态</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c: any) => {
                    const tagInfo = TAGS.find(t => t.value === (c.tags || [])[0]);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" /></td>
                        <td className="px-4 py-3">
                          {editingId === c.id ? (
                            <div className="flex items-center gap-1">
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveName(c.id, editValue); if (e.key === "Escape") setEditingId(null); }} className="w-full rounded border border-blue-300 px-2 py-1 text-sm outline-none" />
                              <button onClick={() => saveName(c.id, editValue)} className="text-green-600"><Check className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <span className="cursor-pointer text-gray-900 hover:text-blue-600" onClick={() => { setEditingId(c.id); setEditValue(c.name || ""); }}>{c.name || "—"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{c.company || "—"}</td>
                        <td className="px-4 py-3"><span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (c.score >= 70 ? "bg-green-100 text-green-700" : c.score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600")}>{c.score}</span></td>
                        <td className="px-4 py-3">
                          {taggingId === c.id ? (
                            <div className="flex flex-wrap gap-1">
                              {TAGS.map(t => (
                                <button key={t.value} onClick={() => saveTag(c.id, t.value)} className={"rounded-full px-2 py-0.5 text-xs " + t.color + " hover:opacity-80"}>{t.label}</button>
                              ))}
                              <button onClick={() => saveTag(c.id, "")} className="text-xs text-gray-400 hover:text-red-500 ml-1">清除</button>
                            </div>
                          ) : (
                            <button onClick={() => setTaggingId(c.id)} className={"rounded-full px-2 py-0.5 text-xs cursor-pointer hover:opacity-80 " + (tagInfo ? tagInfo.color : "bg-gray-100 text-gray-500")}>
                              {tagInfo ? tagInfo.label : "+ 标签"}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{c.status}</span></td>
                        <td className="px-4 py-3"><button onClick={() => deleteOne(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {total > 50 && (
          <div className="mt-4 flex items-center justify-between">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">上一页</button>
            <span className="text-sm text-gray-500">第 {page} 页</span>
            <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">下一页</button>
          </div>
        )}
      </div>
    </div>
  );
}
