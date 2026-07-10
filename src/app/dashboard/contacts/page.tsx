"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, ExternalLink, Loader2, X } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Search modal
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => { loadContacts(); }, [page, status, search]);

  async function loadContacts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch("/api/contacts?" + params);
      if (res.ok) {
        const d = await res.json();
        setContacts(d.data || []);
        setTotal(d.total || 0);
      }
    } catch {}
    setLoading(false);
  }

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ query, target: target || "United States", count: 20 }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const d = await res.json();
        setResults(d.data || []);
      } else {
        const d = await res.json();
        alert(d.error || "Search failed");
      }
    } catch { alert("Search error"); }
    setSearching(false);
  }

  async function addContact(c: any) {
    await fetch("/api/contacts", {
      method: "POST",
      body: JSON.stringify({ ...c, status: "new" }),
      headers: { "Content-Type": "application/json" },
    });
    setResults(rs => rs.filter(r => r.id !== c.id));
    loadContacts();
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch("/api/contacts/" + id, { method: "DELETE" });
    loadContacts();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{total} contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            <Search className="h-4 w-4" /> Search Contacts
          </button>
          <Link href="/dashboard/contacts/new" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            + Add
          </Link>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSearch(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Find Customers</h2>
              <button onClick={() => setShowSearch(false)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              <input placeholder='e.g. "yoga studio California"' value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" autoFocus />
              <input placeholder="Target market (optional)" value={target} onChange={e => setTarget(e.target.value)} onKeyDown={e => e.key === "Enter" && runSearch()} className="rounded-lg border border-gray-200 px-4 py-3 text-sm" />
            </div>
            <button onClick={runSearch} disabled={searching || !query.trim()} className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {searching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</> : <><Search className="h-4 w-4" /> Search</>}
            </button>

            {results.length > 0 && (
              <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                <p className="text-xs text-gray-500">Found {results.length} contacts. Click Add to save.</p>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name} — {r.title}</p>
                      <p className="text-xs text-gray-400 truncate">{r.company} | {r.email || "No email"} | {r.source}</p>
                    </div>
                    <button onClick={() => addContact(r)} className="ml-3 shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input placeholder="Search contacts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none">
          <option value="">All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="won">Won</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 mb-4">No contacts yet.</p>
            <button onClick={() => setShowSearch(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Search for Customers</button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Company</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={"/dashboard/contacts/" + c.id} className="font-medium text-gray-900 hover:text-blue-600">{c.name || "—"}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (c.score >= 70 ? "bg-green-100 text-green-700" : c.score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600")}>{c.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 25 && (
        <div className="mt-4 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 25)}</span>
          <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
