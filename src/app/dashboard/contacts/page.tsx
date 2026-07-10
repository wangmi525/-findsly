"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Filter, ChevronDown, MessageCircle, Mail, Phone, ExternalLink } from "lucide-react";

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail, instagram: ExternalLink, whatsapp: Phone,
  telegram: MessageCircle,
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { loadContacts(); }, [page, status, search]);

  async function loadContacts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      setContacts(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {}
    setLoading(false);
  }

  const channels = (c: any) => {
    const ch: string[] = [];
    if (c.email) ch.push("email");
    if (c.instagram) ch.push("instagram");
    if (c.whatsapp) ch.push("whatsapp");
    if (c.telegram) ch.push("telegram");
    return ch;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">{total} total contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {/* open search modal */}} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            <Search className="h-4 w-4" /> Search Contacts
          </button>
          <Link href="/dashboard/contacts/new" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Plus className="h-4 w-4" /> Add
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input placeholder="Search contacts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="negotiating">Negotiating</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">No contacts yet. Start by searching for your ideal customers.</p>
            <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Search Contacts</button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Company</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Channels</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Last Contacted</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/dashboard/contacts/${c.id}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">{channels(c).map(ch => { const Icon = CHANNEL_ICONS[ch] || ExternalLink; return <Icon key={ch} className="h-4 w-4 text-gray-400" />; })}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.score >= 70 ? "bg-green-100 text-green-700" : c.score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{c.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${c.status === "won" ? "bg-green-100 text-green-700" : c.status === "lost" ? "bg-red-100 text-red-600" : c.status === "replied" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.last_contacted ? new Date(c.last_contacted).toLocaleDateString() : "—"}</td>
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
