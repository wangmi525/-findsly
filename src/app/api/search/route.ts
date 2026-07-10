import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("search_used, search_limit").eq("user_id", user.id).single();
  const used = profile?.search_used || 0;
  const limit = profile?.search_limit || 50;
  if (used >= limit) return NextResponse.json({ error: "Search quota exceeded. Free tier: 50/month. Upgrade for more." }, { status: 402 });

  const body = await req.json();
  const { query, target, count: reqCount = 30 } = body;
  const actualCount = Math.min(reqCount, limit - used, 30);

  const mockResults = Array.from({ length: actualCount }, (_, i) => ({
    name: `${query.charAt(0).toUpperCase() + query.slice(1)} Business ${i + 1}`,
    title: ["Owner", "Manager", "Director"][i % 3],
    company: `${query.charAt(0).toUpperCase() + query.slice(1)} Co ${i + 1}`,
    location: target || "United States",
    email: `info@${query.toLowerCase().replace(/\s/g, "")}${i + 1}.com`,
    phone: `+1${String(5550000000 + i).slice(0, 10)}`,
    website: `https://www.${query.toLowerCase().replace(/\s/g, "")}${i + 1}.com`,
    source: "Google Maps",
    score: Math.floor(40 + Math.random() * 60),
    channels: { email: true, instagram: i % 3 === 0, whatsapp: i % 2 === 0 },
  }));

  const masked = mockResults.map((r: any) => ({
    ...r,
    email: r.email ? r.email[0] + "***@" + r.email.split("@")[1] : "",
    phone: r.phone ? r.phone.slice(0, 4) + "****" + r.phone.slice(-4) : "",
  }));

  await supabase.from("user_profiles").update({ search_used: used + actualCount, updated_at: new Date().toISOString() }).eq("user_id", user.id);

  return NextResponse.json({ data: masked, total: masked.length, used: used + actualCount, limit, remaining: limit - used - actualCount });
}
