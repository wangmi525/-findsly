import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const PLAN_SEARCH_LIMITS: Record<string, number> = { free: 50, starter: 600, pro: 2000, growth: 5000, scale: 15000 };

function maskEmail(e: string) { if (!e) return ""; const [n, d] = e.split("@"); if (!d) return e; return n[0] + "***@" + d[0] + "***" + d.slice(-4); }
function maskPhone(p: string) { if (!p) return ""; return p.slice(0, 3) + "***" + p.slice(-4); }

function generateMockResults(query: string, target: string, count: number): any[] {
  const sources = ["Google Maps", "LinkedIn", "Instagram", "YouTube", "Twitter/X", "Reddit", "TikTok", "Facebook"];
  const industries = [query, "Technology", "E-commerce", "Retail", "Marketing"];
  const results: any[] = [];
  for (let i = 0; i < count; i++) {
    const s = sources[i % sources.length];
    const idx = Math.floor(i / sources.length);
    results.push({
      name: `${query.charAt(0).toUpperCase() + query.slice(1)} Pro ${idx + 1}`,
      title: ["CEO", "Marketing Manager", "Owner", "Director", "Founder"][i % 5],
      company: `${query.charAt(0).toUpperCase() + query.slice(1)}Hub ${idx + 1}`,
      location: target || "United States",
      email: `contact${idx + 1}@${query.toLowerCase().replace(/\s/g, "")}.com`,
      phone: `+1${String(5550000000 + i).slice(0, 10)}`,
      website: `https://www.${query.toLowerCase().replace(/\s/g, "")}${idx + 1}.com`,
      source: s,
      score: Math.floor(40 + Math.random() * 60),
      channels: {
        email: true,
        instagram: i % 3 === 0,
        whatsapp: i % 2 === 0,
        linkedin: true,
      },
    });
  }
  return results;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { query, target, count: requestedCount = 50 } = body;

  const { data: profile } = await supabase.from("user_profiles").select("plan, search_used, search_limit").eq("user_id", user.id).single();
  const plan = profile?.plan || "free";
  const limit = profile?.search_limit || PLAN_SEARCH_LIMITS[plan] || 50;
  const used = profile?.search_used || 0;
  const remaining = limit - used;

  if (remaining <= 0) {
    return NextResponse.json({ error: "Search quota exceeded. Please upgrade your plan.", used, limit }, { status: 402 });
  }

  const actualCount = Math.min(requestedCount, remaining, 100);

  const cachedKey = `${query}_${target}`;
  const { data: cached } = await supabase.from("search_cache").select("*").eq("user_id", user.id).eq("query", cachedKey).gte("expires_at", new Date().toISOString()).single();

  let results;
  if (cached) {
    results = cached.results;
  } else {
    results = generateMockResults(query, target, actualCount);
    await supabase.from("search_cache").insert({ user_id: user.id, query: cachedKey, source: "multi", result_count: results.length, results });
  }

  const masked = results.map((r: any) => ({ ...r, email: maskEmail(r.email), phone: maskPhone(r.phone) }));

  const newUsed = used + actualCount;
  await supabase.from("user_profiles").update({ search_used: newUsed, updated_at: new Date().toISOString() }).eq("user_id", user.id);

  return NextResponse.json({ data: masked, total: masked.length, used: newUsed, limit, remaining: limit - newUsed });
}
