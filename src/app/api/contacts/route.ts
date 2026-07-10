import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function maskEmail(e: string) { if (!e) return ""; const [n, d] = e.split("@"); if (!d) return e; return n[0] + "***@" + d[0] + "***" + d.slice(-4); }
function maskPhone(p: string) { if (!p) return ""; return p.slice(0, 4) + "****" + p.slice(-4); }
function maskContact(c: any) { return { ...c, email: maskEmail(c.email), phone: maskPhone(c.phone) }; }

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const limit = 25;
  const offset = (page - 1) * limit;

  let q = supabase.from("contacts").select("*", { count: "exact" }).eq("user_id", user.id);
  if (status) q = q.eq("status", status);
  if (search) q = q.or(`name.ilike.%${search}%,company.ilike.%${search}%,title.ilike.%${search}%`);
  q = q.order("score", { ascending: false }).range(offset, offset + limit - 1);
  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data || []).map(maskContact), total: count || 0, page, limit });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase.from("contacts").insert({ ...body, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: maskContact(data) });
}
