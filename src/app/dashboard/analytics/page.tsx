"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Users, Target } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const results: any = { revenue: 0, monthRevenue: 0, contacts: 0, deals: 0, won: 0 };
      try {
        const revR = await authFetch("/api/revenue");
        if (revR.ok) { const d = await revR.json(); results.revenue = d.total || 0; results.monthRevenue = d.thisMonth || 0; }
      } catch {}
      try {
        const conR = await authFetch("/api/contacts?limit=1");
        if (conR.ok) { const d = await conR.json(); results.contacts = d.total || 0; }
      } catch {}
      try {
        const dealR = await authFetch("/api/deals");
        if (dealR.ok) { const d = await dealR.json(); results.deals = (d.data || []).length; results.won = (d.data || []).filter((x: any) => x.stage === "won").length; }
      } catch {}
      setData(results);
    }
    load();
  }, []);

  if (!data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="mb-8 text-sm text-gray-500">Customer growth and revenue insights</p>
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
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-2 font-semibold text-gray-900">About Analytics</h3>
        <p className="text-sm text-gray-500">Analytics data builds up as you use Findsly — search contacts, send outreach, and track deals. The more you use the platform, the richer your analytics become.</p>
        <p className="mt-2 text-xs text-gray-400">Data export is not available for security and compliance reasons.</p>
      </div>
    </div>
  );
}
