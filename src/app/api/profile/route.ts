import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
  if (!profile) {
    const { data: p } = await supabase.from("user_profiles").insert({ user_id: user.id, plan: "free", search_limit: 50, email_limit: 50 }).select().single();
    profile = p || { plan: "free", search_used: 0, search_limit: 50, email_sent: 0, email_limit: 50, ai_messages_used: 0, ai_messages_limit: 10 };
  }
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await supabase.from("user_profiles").update(body).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
