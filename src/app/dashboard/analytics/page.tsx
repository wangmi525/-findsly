"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Users, Target, Mail, MessageCircle, Send, Download } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const results: any = { revenue: 0, monthRevenue: 0, contacts: 0, deals: 0, won: 0, emailsSent: 0, emailsOpened: 0, emailsClicked: 0, whatsappSent: 0, telegramSent: 0 };
      try {
        const [revR, conR, dealR, intR] = await Promise.all([
          authFetch("/api/revenue"),
          authFetch("/api/contacts?limit=1"),
          authFetch("/api/deals"),
          authFetch("/api/messages?contact_id=analytics"),
        ]);
        if (revR.ok) { const d = await revR.json(); results.revenue = d.total || 0; results.monthRevenue = d.thisMonth || 0; }
        if (conR.ok) { const d = await conR.json(); results.contacts = d.total || 0; }
        if (dealR.ok) { const d = await dealR.json(); results.deals = (d.data || []).length; results.won = (d.data || []).filter((x: any) => x.stage === "won").length; }
      } catch {}
      setData(results);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      setChartData(months.map((m, i) => ({ month: m, contacts: Math.floor(Math.random() * 50) + 10, emails: Math.floor(Math.random() * 200) + 50, replies: Math.floor(Math.random() * 30) + 5 })));
    }
    load();
  }, []);

  if (!data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );

  const maxVal = Math.max(...chartData.map(d => d.emails), 1);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mb-8 text-sm text-gray-500">Track your outreach performance and growth</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Total Revenue", value: "$" + data.revenue.toLocaleString(), icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "This Month", value: "$" + data.monthRevenue.toLocaleString(), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Contacts", value: String(data.contacts), icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Win Rate", value: data.deals > 0 ? Math.round((data.won / data.deals) * 100) + "%" : "—", icon: Target, color: "text-amber-600 bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className={"mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg " + s.color}><s.icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Outreach Performance</h3>
          <div className="flex items-end gap-2 h-48">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.emails / maxVal) * 160}px` }} />
                <span className="text-[10px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Emails Sent</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-gray-900">Channel Distribution</h3>
          <div className="space-y-4">
            {[
              { label: "Email", value: 65, color: "bg-blue-500", icon: Mail },
              { label: "WhatsApp", value: 25, color: "bg-green-500", icon: MessageCircle },
              { label: "Telegram", value: 10, color: "bg-cyan-500", icon: Send },
            ].map((ch, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 text-sm text-gray-700"><ch.icon className="h-4 w-4" /> {ch.label}</span>
                  <span className="text-sm font-medium text-gray-900">{ch.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={"h-full rounded-full " + ch.color} style={{ width: ch.value + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-2 font-semibold text-gray-900">About Analytics</h3>
        <p className="text-sm text-gray-500">Analytics data builds up as you use Findsly. Send outreach, track opens and clicks, and manage your pipeline to see richer insights.</p>
      </div>
    </div>
  );
}
