import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("revenue_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const total = (data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const thisMonth = (data || []).filter((r: any) => new Date(r.logged_at).getMonth() === new Date().getMonth()).reduce((s: number, r: any) => s + Number(r.amount), 0);
  return NextResponse.json({ data, total, thisMonth });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { data, error } = await supabase.from("revenue_logs").insert({ ...body, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
