"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Send, Mail, Phone, MessageCircle, ExternalLink, Zap, Loader2 } from "lucide-react";

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail, format: "email" },
  { id: "whatsapp", label: "WhatsApp", icon: Phone, format: "link" },
  { id: "telegram", label: "Telegram", icon: Send, format: "link" },
  { id: "instagram", label: "Instagram", icon: ExternalLink, format: "link" },
  { id: "facebook", label: "Facebook", icon: MessageCircle, format: "link" },
  { id: "line", label: "LINE", icon: MessageCircle, format: "link" },
  { id: "twitter", label: "Twitter/X", icon: ExternalLink, format: "link" },
  { id: "discord", label: "Discord", icon: MessageCircle, format: "link" },
  { id: "phone", label: "Phone", icon: Phone, format: "link" },
  { id: "sms", label: "SMS", icon: Phone, format: "link" },
];

export default function OutreachPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => { authFetch("/api/collections").then(r => r.json()).then(d => setCollections(d.data || [])); }, []);

  async function loadCollectionContacts(collectionId: string) {
    setSelectedCollection(collectionId);
    setSelected([]);
    setMessage("");
    setSubject("");
    if (!collectionId) { setContacts([]); return; }
    const res = await authFetch("/api/contacts?collection_id=" + collectionId + "&limit=100");
    const d = await res.json();
    setContacts(d.data || []);
  }

  const toggleContact = (c: any) => {
    setSelected(s => s.find(x => x.id === c.id) ? s.filter(x => x.id !== c.id) : [...s, c]);
  };

  const generateAI = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    const c = selected[0];
    const res = await authFetch("/api/ai/generate", { method: "POST", body: JSON.stringify({ contactName: c.name, company: c.company, product: "our product/service", channel }), headers: { "Content-Type": "application/json" } });
    const d = await res.json();
    if (d.message) {
      if (channel === "email") {
        const lines = d.message.split("Subject:");
        if (lines.length > 1) { setSubject(lines[1].split("\n")[0].trim()); setMessage(lines.slice(1).join("\n").replace(lines[1].split("\n")[0], "").trim()); }
        else { setMessage(d.message); }
      } else { setMessage(d.message); }
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    for (const c of selected) {
      await authFetch("/api/send", { method: "POST", body: JSON.stringify({ channel, contact_id: c.id, subject, message, phone: c.phone, handle: c.instagram || c.telegram || c.facebook || c.twitter_handle }), headers: { "Content-Type": "application/json" } });
    }
    setResult(`已发送 ${selected.length} 条消息`);
    setLoading(false);
  };

  const isEmail = channel === "email";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">外展活动</h1>
        <p className="text-sm text-gray-500">通过任意渠道给联系人发消息</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {/* Step 1: Select Collection */}
          <h3 className="mb-3 font-semibold text-gray-900">1. 选择档案</h3>
          <select value={selectedCollection} onChange={e => loadCollectionContacts(e.target.value)} className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
            <option value="">选择档案查看联系人</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          {/* Step 2: Select Contacts */}
          <h3 className="mb-3 font-semibold text-gray-900">2. 选择联系人 ({selected.length})</h3>
          <div className="mb-3 max-h-60 overflow-y-auto space-y-1">
            {contacts.length === 0 && selectedCollection ? (
              <p className="py-4 text-center text-sm text-gray-400">该档案没有联系人</p>
            ) : contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">请先选择一个档案</p>
            ) : (
              contacts.map(c => (
                <button key={c.id} onClick={() => toggleContact(c)} className={`w-full rounded-lg p-2 text-left text-sm transition ${selected.find(x => x.id === c.id) ? "bg-blue-50 border border-blue-200" : "border border-transparent hover:bg-gray-50"}`}>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.company} · {c.title || ""}</p>
                </button>
              ))
            )}
          </div>

          {/* Step 3: Choose Channel */}
          <h3 className="mb-3 font-semibold text-gray-900">3. 选择渠道</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {CHANNELS.map(ch => (
              <button key={ch.id} onClick={() => setChannel(ch.id)} className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition ${channel === ch.id ? "bg-blue-50 border border-blue-200 text-blue-700" : "border border-gray-100 hover:bg-gray-50 text-gray-500"}`}>
                <ch.icon className="h-5 w-5" /> {ch.label}
              </button>
            ))}
          </div>

          {isEmail && (
            <div className="space-y-3">
              <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <textarea placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          )}
          {!isEmail && (
            <textarea placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={generateAI} disabled={loading || selected.length === 0} className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} AI 生成
            </button>
            <button onClick={sendMessage} disabled={loading || selected.length === 0 || (!isEmail && !message)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              <Send className="h-4 w-4" /> 发送
            </button>
          </div>
          {result && <p className="mt-3 text-sm text-green-600">{result}</p>}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">预览</h3>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            {selected.length === 0 ? (
              <p className="text-sm text-gray-400">选择联系人后预览消息</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-xs text-gray-400">收件人: {selected.map(c => c.name).join(", ")}</p>
                <p className="text-xs text-gray-400">渠道: {CHANNELS.find(ch => ch.id === channel)?.label}</p>
                {subject && <p className="font-semibold text-gray-900">{subject}</p>}
                <p className="whitespace-pre-wrap text-gray-700">{message || "(点击 AI 生成自动生成消息)"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
