"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-client";
import { Users, DollarSign, Send, TrendingUp, Search, Plus, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({ contacts: 0, deals: 0, revenue: 0, rate: 0 });
  const [profile, setProfile] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
      setProfile(p);
      const { count: cc } = await supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { data: deals } = await supabase.from("deals").select("value,stage").eq("user_id", user.id);
      const { data: revenue } = await supabase.from("revenue_logs").select("amount").eq("user_id", user.id);
      const { count: intCount } = await supabase.from("interactions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "replied");
      const { count: totalSent } = await supabase.from("interactions").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { data: recentData } = await supabase.from("contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);

      const totalRev = (revenue || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      const activeDeals = (deals || []).filter((d: any) => !["won", "lost"].includes(d.stage)).length;
      const replyRate = totalSent && totalSent > 0 ? Math.round((intCount || 0) / totalSent * 100) : 0;
      setStats({ contacts: cc || 0, deals: activeDeals, revenue: totalRev, rate: replyRate });
      setRecent(recentData || []);
    }
    load();
  }, []);

  const used = profile?.search_used || 0;
  const limit = profile?.search_limit || 50;
  const pct = Math.round((used / limit) * 100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back! Here&apos;s your customer growth overview.</p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800"><TrendingUp className="h-4 w-4" /> AI Recommendation</div>
        <p className="text-amber-700">
          {stats.contacts === 0
            ? "Start by searching for your ideal customers. Click 'Search Contacts' to begin."
            : `You have ${stats.contacts} contacts. ${recent.filter((r: any) => r.status === "new").length} haven't been contacted yet. Start your first outreach campaign!`}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Contacts", value: stats.contacts, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Active Deals", value: stats.deals, icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Revenue (Month)", value: `$${stats.revenue.toLocaleString()}`, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
          { label: "Reply Rate", value: `${stats.rate}%`, icon: Send, color: "text-amber-600 bg-amber-50" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Monthly Search Quota</span>
          <span className="text-sm text-gray-500">{used}/{limit} used</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} /></div>
        {used >= limit && <p className="mt-2 text-xs text-red-500">Quota exhausted. <Link href="/dashboard/settings" className="underline">Upgrade plan</Link></p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/contacts" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Search className="h-5 w-5 text-blue-600" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-900">Search New Contacts</p><p className="text-xs text-gray-500">Find customers across 8 sources</p></div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Link>
            <Link href="/dashboard/outreach" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50"><Send className="h-5 w-5 text-green-600" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-900">Send Outreach</p><p className="text-xs text-gray-500">Reach contacts on 10 channels</p></div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Link>
            <Link href="/dashboard/pipeline" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-gray-900">View Pipeline</p><p className="text-xs text-gray-500">Track deals and revenue</p></div>
              <ArrowRight className="h-4 w-4 text-gray-300" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Contacts</h3>
            <Link href="/dashboard/contacts" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No contacts yet. Start by searching for customers.</p>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 5).map((c: any) => (
                <Link key={c.id} href={`/dashboard/contacts/${c.id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name || "Unknown"}</p>
                    <p className="text-xs text-gray-400">{c.company || "—"} · {c.source || "Manual"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${c.score >= 70 ? "bg-green-100 text-green-700" : c.score >= 40 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{c.score}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
