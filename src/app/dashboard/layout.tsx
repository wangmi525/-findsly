"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";
import { LayoutDashboard, Users, Kanban, Send, GitBranch, UsersRound, Settings, BarChart3, LogOut, X, Zap, ChevronRight } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/dashboard/outreach", label: "Outreach", icon: Send },
  { href: "/dashboard/sequences", label: "Sequences", icon: GitBranch },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: UsersRound, plan: ["growth", "scale", "enterprise"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = getSupabase();
    let unsubscribe: (() => void) | null = null;

    async function loadProfile(u: any) {
      setUser(u);
      const { data: p } = await supabase.from("user_profiles").select("*").eq("user_id", u.id).single();
      setProfile(p || { plan: "free", search_used: 0, search_limit: 50 });
    }

    async function init() {
      // Check existing session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user);
        return;
      }

      // Wait for auth state to settle (handles redirect from OAuth callback)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (newSession?.user) {
          unsubscribe?.();
          await loadProfile(newSession.user);
        }
      });
      unsubscribe = subscription.unsubscribe.bind(subscription);

      // Fallback: if still no session after 2s, redirect to login
      setTimeout(async () => {
        unsubscribe?.();
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (!finalSession?.user) {
          router.push("/auth");
        }
      }, 2000);
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, [router]);

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
    router.push("/auth");
  };

  const plan = profile?.plan || "free";
  const used = profile?.search_used || 0;
  const limit = profile?.search_limit || 50;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900"><div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center"><Zap className="h-4 w-4 text-white" /></div>Findsly</Link>
          <button className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            if (item.plan && !item.plan.includes(plan)) return null;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Search quota</span><span>{used}/{limit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} /></div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.email?.split("@")[0] || "User"}</p>
              <p className="text-xs capitalize text-gray-400">{plan}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <div className="md:hidden flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-gray-100"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
          <span className="font-bold text-gray-900">Findsly</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
