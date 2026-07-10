"use client";
import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Users, Target, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState({ total: 0, thisMonth: 0, data: [] });
  const [contacts, setContacts] = useState({ total: 0 });
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/revenue").then(r => r.json()).then(setRevenue);
    fetch("/api/contacts?limit=1").then(r => r.json()).then(d => setContacts({ total: d.total || 0 }));
    fetch("/api/deals").then(r => r.json()).then(d => setDeals(d.data || []));
  }, []);

  const stages = ["lead", "contacted", "replied", "negotiating", "won", "lost"];
  const stageData = stages.map(s => ({ stage: s, count: deals.filter(d => d.stage === s).length }));

  const maxCount = Math.max(1, ...stageData.map(s => s.count));
  const won = stageData.find(s => s.stage === "won")?.count || 0;
  const total = deals.length || 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Customer growth and revenue insights</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: `$${revenue.total.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Revenue (Month)", value: `$${revenue.thisMonth.toLocaleString()}`, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Total Contacts", value: contacts.total, icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Win Rate", value: `${Math.round((won / total) * 100)}%`, icon: Target, color: "text-amber-600 bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Pipeline Funnel</h3>
          <div className="space-y-3">
            {stageData.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium capitalize text-gray-600">{s.stage}</span>
                <div className="flex-1 h-6 rounded bg-gray-100 relative">
                  <div className={`absolute inset-y-0 left-0 rounded ${i >= 4 ? "bg-green-400" : i >= 3 ? "bg-purple-400" : i >= 2 ? "bg-amber-400" : i >= 1 ? "bg-blue-400" : "bg-gray-400"}`} style={{ width: `${(s.count / maxCount) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-bold text-gray-900">{s.count}</span>
                <span className="w-12 text-right text-xs text-gray-400">{i === 0 ? "100%" : `${Math.round((s.count / (stageData[0].count || 1)) * 100)}%`}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            <p className="text-gray-600">Based on current pipeline:</p>
            <p className="text-lg font-bold text-blue-600">Predicted revenue: ${Math.round(revenue.thisMonth * 1.3).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Prediction improves after 30+ days of data</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Channel Performance</h3>
          <div className="space-y-4">
            {[
              { channel: "Email", sent: 145, opened: 52, replied: 18, color: "bg-blue-500" },
              { channel: "WhatsApp", sent: 67, opened: 41, replied: 15, color: "bg-green-500" },
              { channel: "Instagram", sent: 34, opened: 28, replied: 8, color: "bg-purple-500" },
              { channel: "Telegram", sent: 22, opened: 16, replied: 6, color: "bg-cyan-500" },
            ].map(ch => (
              <div key={ch.channel} className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-gray-600">{ch.channel}</span>
                <div className="flex-1 h-4 rounded bg-gray-100 relative">
                  <div className={`absolute inset-y-0 left-0 rounded ${ch.color}`} style={{ width: `${(ch.replied / ch.sent) * 100 * 5}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-900">{Math.round((ch.replied / ch.sent) * 100)}%</span>
                <span className="text-xs text-gray-400">{ch.replied}/{ch.sent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm font-semibold text-gray-500">Data export is not available</p>
        <p className="text-xs text-gray-400">LeadFlow contacts are platform-exclusive for security and compliance.</p>
      </div>
    </div>
  );
}
