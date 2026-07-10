"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Send, Phone, MessageCircle, ExternalLink, Plus, Edit3, Trash2, Users } from "lucide-react";

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/contacts/${id}`);
        const d = await res.json();
        setContact(d.contact);
        setInteractions(d.interactions || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    router.push("/dashboard/contacts");
  };

  const handleStatus = async (newStatus: string) => {
    await fetch(`/api/contacts/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }), headers: { "Content-Type": "application/json" } });
    setContact((c: any) => ({ ...c, status: newStatus }));
  };

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;
  if (!contact) return <div className="py-12 text-center text-sm text-gray-400">Contact not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/contacts" className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{contact.name || "Unknown"}</h1>
          <p className="text-sm text-gray-500">{contact.title} at {contact.company}</p>
        </div>
        <div className="flex gap-2">
          <select value={contact.status} onChange={e => handleStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="new">New</option><option value="contacted">Contacted</option><option value="replied">Replied</option>
            <option value="negotiating">Negotiating</option><option value="won">Won</option><option value="lost">Lost</option>
          </select>
          <button onClick={handleDelete} className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          <Link href={`/dashboard/outreach?contact=${contact.id}`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Send Message</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Contact Details</h3>
            <dl className="space-y-3 text-sm">
              {["title", "company", "location", "source"].map(k => (
                contact[k] ? <div key={k}><dt className="text-xs text-gray-400 uppercase capitalize">{k}</dt><dd className="text-gray-900">{contact[k]}</dd></div> : null
              ))}
              <div><dt className="text-xs text-gray-400 uppercase">Score</dt><dd className={`font-bold ${contact.score >= 70 ? "text-green-600" : contact.score >= 40 ? "text-amber-600" : "text-gray-600"}`}>{contact.score}/100</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Channels</h3>
            <div className="space-y-2">
              {[
                { ch: "Email", icon: Mail, key: "email" },
                { ch: "WhatsApp", icon: Phone, key: "whatsapp" },
                { ch: "Telegram", icon: Send, key: "telegram" },
                { ch: "Instagram", icon: ExternalLink, key: "instagram" },
              ].filter(c => contact[c.key]).map(c => (
                <Link key={c.ch} href={`/dashboard/outreach?contact=${contact.id}&channel=${c.key}`} className="flex items-center gap-2 rounded-lg p-2 text-sm text-gray-700 hover:bg-gray-50">
                  <c.icon className="h-4 w-4" /> {c.ch}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Interactions</h3>
          {interactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No interactions yet.</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((i: any) => (
                <div key={i.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{i.channel} · {i.direction}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${i.status === "replied" ? "bg-green-100 text-green-700" : i.status === "opened" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{i.status}</span>
                  </div>
                  {i.subject && <p className="text-sm font-medium text-gray-900">{i.subject}</p>}
                  <p className="text-xs text-gray-500 mt-1">{new Date(i.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
