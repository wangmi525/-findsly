"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";
import { User, Shield, Users, Crown, CreditCard, LogOut, Zap } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "$29/mo", search: "500", channels: "3 (Email+WA+TG)" },
  { name: "Pro", price: "$79/mo", search: "2,500", channels: "3 (Email+WA+TG)" },
  { name: "Growth", price: "$199/mo", search: "10,000", channels: "3 (Email+WA+TG)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      const { data: p } = await supabase.from("user_profiles").select("*").eq("user_id", u.id).single();
      setProfile(p || { plan: "free" });
      setName(p?.full_name || "");
      setCompany(p?.company || "");
    }
    load();
  }, [router]);

  const saveProfile = async () => {
    const res = await authFetch("/api/profile", { method: "PATCH", body: JSON.stringify({ full_name: name, company }), headers: { "Content-Type": "application/json" } });
    if (res.ok) alert("Profile saved!");
  };

  const plan = profile?.plan || "free";
  const used = profile?.search_used || 0;
  const limit = profile?.search_limit || 50;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Profile</h3>
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Company</label><input value={company} onChange={e => setCompany(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input disabled value={user?.email || ""} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400" /></div>
          <button onClick={saveProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Plan</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"><Crown className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-lg font-bold text-gray-900 capitalize">{plan}</p><p className="text-sm text-gray-500">{used}/{limit} searches used this month</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {PLANS.map((p, i) => (
            <div key={i} className={`rounded-lg border p-3 text-center ${plan === p.name.toLowerCase() ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300 cursor-pointer"}`}
              onClick={() => plan !== p.name.toLowerCase() && alert("Redirecting to checkout...")}>
              <p className="text-sm font-bold text-gray-900">{p.name}</p>
              <p className="text-lg font-extrabold text-gray-900">{p.price}</p>
              <p className="text-xs text-gray-400">{p.search} searches · {p.channels} channels</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-red-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-red-600">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-3">Cancelling your subscription will remove access after 30 days. Your data will be permanently deleted after that period.</p>
        <button onClick={() => alert("To cancel, use Stripe customer portal or contact support.")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancel Subscription</button>
      </div>
    </div>
  );
}
