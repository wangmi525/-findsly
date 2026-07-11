"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase-client";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  async function getToken() {
    try {
      const sb = getSupabase();
      const { data } = await sb.auth.getSession();
      return data?.session?.access_token || "";
    } catch { return ""; }
  }

  async function loadContacts() {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/contacts?limit=25&page=" + page + (statusFilter ? "&status=" + statusFilter : ""), {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      const d = await res.json();
      setContacts(d.data || []);
      setTotal(d.total || 0);
    } catch {}
  }

  useEffect(() => { loadContacts(); }, [page, statusFilter]);

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const token = await getToken();
      if (!token) { alert("Not logged in"); setSearching(false); return; }
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ query, target: target || "United States", count: 20 }),
      });
      const d = await res.json();
      if (res.ok && d.data) {
        setResults(d.data);
      } else {
        alert(d.error || "Search failed. Status: " + res.status);
      }
    } catch (e) { alert("Search error: " + (e as any).message); }
    setSearching(false);
  }

  async function addContact(c: any) {
    try {
      const token = await getToken();
      await fetch("/api/contacts", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ name: c.name, company: c.company, title: c.title, email: c.email, phone: c.phone, website: c.website, source: c.source, score: c.score }),
      });
      setResults(rs => rs.filter((_, i) => i !== results.indexOf(c)));
      loadContacts();
    } catch {}
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete?")) return;
    try {
      const token = await getToken();
      await fetch("/api/contacts/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      loadContacts();
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{total} contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            <Search className="h-4 w-4" /> Search Contacts
          </button>
          <Link href="/dashboard/contacts/new" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">+ Add</Link>
        </div>
      </div>

      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSearch(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Find Customers</h2>
              <button onClick={() => { setShowSearch(false); setResults([]); }} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <input placeholder="e.g. yoga studio California" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" autoFocus />
              <input placeholder="Target market (optional)" value={target} onChange={e => setTarget(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" />
            </div>
            <button onClick={runSearch} disabled={searching || !query.trim()} className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</> : <><Search className="h-4 w-4" /> Search</>}
            </button>
            {results.length > 0 && (
              <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                <p className="text-xs text-gray-500">{results.length} results found. Click Add to save.</p>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name} — {r.title || ""}</p>
                      <p className="text-xs text-gray-400 truncate">{r.company || ""} | {r.email || "No email"} | {r.source || ""}</p>
                    </div>
                    <button onClick={() => addContact(r)} className="ml-3 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="won">Won</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 mb-4">No contacts yet.</p>
            <button onClick={() => setShowSearch(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Search for Customers</button>
          </div>
        ) : (
          <>
              <p className="px-4 pt-4 text-xs text-gray-400">评分说明：🟢 80+ 高优先 · 🟡 50-79 中优先 · ⚪ &lt;50 低优先（分数越高=数据越完整=越值得联系）</p>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">名称</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">公司</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">评分</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">状态</th>
                    <th className="px-4 py-3 font-semibold text-gray-600"></th>
                  </tr>
                </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><Link href={"/dashboard/contacts/" + c.id} className="font-medium text-gray-900 hover:text-blue-600">{c.name || "—"}</Link></td>
                  <td className="px-4 py-3 text-gray-500">{c.company || "—"}</td>
                  <td className="px-4 py-3"><span className={"rounded-full px-2 py-0.5 text-xs " + (c.score >= 70 ? "bg-green-100 text-green-700" : c.score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600")}>{c.score}</span></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">{c.status}</span></td>
                  <td className="px-4 py-3"><button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td>
                </tr>
              ))}
            </tbody>
           </table>
          </>
        )}
      </div>

      {total > 25 && (
        <div className="mt-4 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
