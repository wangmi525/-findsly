"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Send, Mail, MessageCircle, Zap, Loader2, Settings, Reply } from "lucide-react";

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail, desc: "通过 Resend API 发送", hasChannel: (c: any) => !!c.email },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "通过 WhatsApp API 发送", hasChannel: (c: any) => !!c.phone },
  { id: "telegram", label: "Telegram", icon: Send, desc: "通过 Telegram Bot 发送", hasChannel: (c: any) => !!c.telegram_handle },
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OutreachPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ whatsapp_token: "", whatsapp_phone: "", telegram_bot_token: "" });

  // Conversation state
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    authFetch("/api/collections").then(r => r.json()).then(d => setCollections(d.data || []));
    authFetch("/api/profile").then(r => r.json()).then(d => {
      if (d) setConfig({ whatsapp_token: d.whatsapp_token || "", whatsapp_phone: d.whatsapp_phone || "", telegram_bot_token: d.telegram_bot_token || "" });
    });
  }, []);

  async function loadCollectionContacts(collectionId: string) {
    setSelectedCollection(collectionId);
    setSelected([]);
    setConversation(null);
    setMessages([]);
    setMessage(""); setSubject("");
    if (!collectionId) { setAllContacts([]); return; }
    const res = await authFetch("/api/contacts?collection_id=" + collectionId + "&limit=100");
    const d = await res.json();
    const cl = d.data || [];
    for (const c of cl) {
      try {
        const ir = await authFetch("/api/contacts/" + c.id);
        const id = await ir.json();
        c._channels_used = (id.interactions || []).map((x: any) => x.channel);
      } catch { c._channels_used = []; }
    }
    setAllContacts(cl);
  }

  const contacts = allContacts.filter(c => {
    const ch = CHANNELS.find(x => x.id === channel);
    return ch ? ch.hasChannel(c) : true;
  });

  async function loadMessages(contact: any) {
    if (!contact) { setConversation(null); setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const res = await authFetch("/api/messages?contact_id=" + contact.id);
      const d = await res.json();
      setConversation(d.contact);
      setMessages(d.messages || []);
    } finally {
      setLoadingMessages(false);
    }
  }

  function selectContact(c: any) {
    const exists = selected.find(x => x.id === c.id);
    let next: any[];
    if (exists) {
      next = selected.filter(x => x.id !== c.id);
    } else {
      next = [...selected, c];
    }
    setSelected(next);
    loadMessages(next[0] || null);
  }

  async function saveConfig() {
    await authFetch("/api/profile", { method: "PATCH", body: JSON.stringify(config) });
    setShowConfig(false);
  }

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
    if (channel !== "email" && !((config as any)[channel + "_token"])) { setShowConfig(true); return; }
    setLoading(true);
    let sent = 0, failed = 0;
    for (const c of selected) {
      try {
        const res = await authFetch("/api/send", { method: "POST", body: JSON.stringify({ channel, contact_id: c.id, subject, message, phone: c.phone, handle: c.telegram_handle || "", recipient_name: c.name, recipient_company: c.company }), headers: { "Content-Type": "application/json" } });
        const d = await res.json();
        if (d.error) { failed++; } else { sent++; }
      } catch { failed++; }
    }
    setResult(`已发送 ${sent} 条${failed > 0 ? `，${failed} 条失败` : ""}`);
    await loadCollectionContacts(selectedCollection);
    if (selected.length > 0) await loadMessages(selected[0]);
    setLoading(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !conversation) return;
    setReplyLoading(true);
    try {
      const parent = replyingTo || messages[messages.length - 1];
      const res = await authFetch("/api/send", {
        method: "POST",
        body: JSON.stringify({
          channel: parent?.channel || "email",
          contact_id: conversation.id,
          message: replyText,
          parent_interaction_id: parent?.id,
          recipient_name: conversation.name,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const d = await res.json();
      if (d.error) {
        setResult(`回复失败：${d.error}`);
      } else {
        setReplyText("");
        setReplyingTo(null);
        await loadMessages(conversation);
      }
    } finally {
      setReplyLoading(false);
    }
  };

  const isEmail = channel === "email";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">外展活动</h1>
          <p className="text-sm text-gray-500">通过平台内渠道发送消息，客户联系方式完全保密</p>
        </div>
        {(channel === "whatsapp" || channel === "telegram") && (
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Settings className="h-4 w-4" /> 配置 {CHANNELS.find(c => c.id === channel)?.label}
          </button>
        )}
      </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfig(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{channel === "whatsapp" ? "配置 WhatsApp Business API" : "配置 Telegram Bot"}</h2>
            {channel === "whatsapp" ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-1">绑定步骤：</p>
                  <p>1. 去 <a href="https://business.facebook.com" target="_blank" className="underline">Meta Business</a> 注册企业账号</p>
                  <p>2. 创建 WhatsApp Business App → 获取 API Token</p>
                  <p>3. 绑定电话号码（需验证）</p>
                  <p>4. 将 Token 粘贴到下方</p>
                  <p className="mt-1 font-semibold">费用：前 1000 条/月免费，超出 ~$0.02/条</p>
                </div>
                <input placeholder="WhatsApp Business API Token" value={config.whatsapp_token} onChange={e => setConfig({ ...config, whatsapp_token: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input placeholder="你的发送号码（如 +86138xxxx）" value={config.whatsapp_phone} onChange={e => setConfig({ ...config, whatsapp_phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                  <p className="font-semibold mb-1">绑定步骤：</p>
                  <p>1. 打开 Telegram → 搜索 <b>@BotFather</b></p>
                  <p>2. 发送 <b>/newbot</b> → 给 Bot 取名</p>
                  <p>3. 复制 Bot Token 粘贴到下方</p>
                  <p className="mt-1 font-semibold">费用：完全免费，无限制</p>
                </div>
                <input placeholder="Telegram Bot Token" value={config.telegram_bot_token} onChange={e => setConfig({ ...config, telegram_bot_token: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={saveConfig} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">保存</button>
              <button onClick={() => setShowConfig(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">1. 选择档案</h3>
          <select value={selectedCollection} onChange={e => loadCollectionContacts(e.target.value)} className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
            <option value="">选择档案查看联系人</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <h3 className="mb-3 font-semibold text-gray-900">2. 选择联系人 ({selected.length}/{contacts.length} 可选)</h3>
          <div className="mb-3 max-h-60 overflow-y-auto space-y-1">
            {contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">{selectedCollection ? `该档案中没有${CHANNELS.find(c => c.id === channel)?.label}渠道的联系人` : "请先选择一个档案"}</p>
            ) : contacts.map(c => {
              const usedChannels = c._channels_used || [];
              return (
                <button key={c.id} onClick={() => selectContact(c)} className={`w-full rounded-lg p-2 text-left text-sm transition ${selected.find(x => x.id === c.id) ? "bg-blue-50 border border-blue-200" : "border border-transparent hover:bg-gray-50"}`}>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.company || ""} {c.title ? "· " + c.title : ""}</p>
                  <div className="mt-1 flex gap-1">
                    {usedChannels.includes("email") && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">已发Email</span>}
                    {usedChannels.includes("whatsapp") && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">已发WhatsApp</span>}
                    {usedChannels.includes("telegram") && <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] text-cyan-700">已发Telegram</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="mb-3 font-semibold text-gray-900">3. 选择渠道</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {CHANNELS.map(ch => {
              const availableCount = allContacts.filter(c => ch.hasChannel(c)).length;
              return (
                <button key={ch.id} onClick={() => setChannel(ch.id)} className={`flex flex-col items-center gap-1 rounded-lg p-3 text-xs transition ${channel === ch.id ? "bg-blue-50 border border-blue-200 text-blue-700" : "border border-gray-100 hover:bg-gray-50 text-gray-500"}`}>
                  <ch.icon className="h-5 w-5" />
                  <span className="font-medium">{ch.label}</span>
                  <span className="text-[10px] text-gray-400">{availableCount} 人可用</span>
                </button>
              );
            })}
          </div>

          {isEmail ? (
            <div className="space-y-3">
              <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <textarea placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          ) : (
            <textarea placeholder="Message..." value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
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

        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col h-[600px]">
          <h3 className="mb-3 font-semibold text-gray-900">对话记录</h3>
          {!conversation ? (
            <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-4 flex items-center justify-center">
              <p className="text-sm text-gray-400">选择一个联系人查看对话</p>
            </div>
          ) : (
            <>
              <div className="mb-3 border-b border-gray-100 pb-3">
                <p className="font-semibold text-gray-900">{conversation.name}</p>
                <p className="text-xs text-gray-400">{conversation.company || ""} {conversation.title ? "· " + conversation.title : ""}</p>
                <p className="text-xs mt-1">
                  {conversation.status === "replied" ? <span className="text-green-600">● 已回复</span> : <span className="text-gray-400">○ {conversation.status}</span>}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">暂无消息</p>
                ) : messages.map((m: any) => {
                  const isOutbound = m.direction === "outbound";
                  return (
                    <div key={m.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${isOutbound ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"}`}>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] opacity-80">
                          <span className="uppercase">{m.channel}</span>
                          <span>·</span>
                          <span>{formatTime(m.created_at)}</span>
                        </div>
                        {m.subject ? <p className={`font-semibold mb-1 ${isOutbound ? "text-blue-100" : "text-gray-600"}`}>{m.subject}</p> : null}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        {!isOutbound && (
                          <button onClick={() => setReplyingTo(m)} className="mt-1.5 flex items-center gap-1 text-[10px] opacity-80 hover:opacity-100">
                            <Reply className="h-3 w-3" /> 回复
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {conversation && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {replyingTo && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                      <Reply className="h-3 w-3" />
                      回复 {replyingTo.channel} 消息
                      <button onClick={() => setReplyingTo(null)} className="text-red-500 hover:underline">取消</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="输入回复..."
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={sendReply}
                      disabled={replyLoading || !replyText.trim()}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {replyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
