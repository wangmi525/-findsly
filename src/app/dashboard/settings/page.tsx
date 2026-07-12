"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";
import { Crown, Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter", price: "$29", planId: "starter",
    features: ["500 emails/mo", "50 WhatsApp msgs", "Unlimited Telegram", "50 AI generations", "5 automation sequences", "CSV import", "Email templates", "Email warmup", "Email tracking"],
  },
  {
    name: "Pro", price: "$79", planId: "pro", popular: true,
    features: ["2,500 emails/mo", "200 WhatsApp msgs", "Unlimited Telegram", "Unlimited AI", "20 automation sequences", "A/B testing", "Full CRM + Pipeline", "Advanced analytics", "Priority support"],
  },
  {
    name: "Growth", price: "$199", planId: "growth",
    features: ["10,000 emails/mo", "500 WhatsApp msgs", "Unlimited Telegram", "Unlimited AI", "Unlimited sequences", "Team (10 seats)", "API access", "Full pipeline & CRM", "Dedicated support"],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

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

  const checkout = async (planId: string) => {
    setLoading(true);
    try {
      const res = await authFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: planId, userId: user?.id, email: user?.email }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      alert("Checkout failed. Please try again.");
    }
    setLoading(false);
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
          <button onClick={saveProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Save</button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Plan</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"><Crown className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-lg font-bold text-gray-900 capitalize">{plan}</p><p className="text-sm text-gray-500">{used}/{limit} searches used this month</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((p, i) => {
            const isCurrent = plan === p.planId;
            return (
              <div key={i} className={`relative rounded-xl border p-4 ${isCurrent ? "border-blue-300 bg-blue-50" : p.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 hover:border-gray-300"}`}>
                {p.popular && !isCurrent && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold text-white">Most Popular</div>}
                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{p.price}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />{f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="mt-3 w-full rounded-lg bg-blue-50 py-2 text-center text-xs font-semibold text-blue-600">Current Plan</div>
                ) : (
                  <button onClick={() => checkout(p.planId)} disabled={loading} className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                    {loading ? "Loading..." : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
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
