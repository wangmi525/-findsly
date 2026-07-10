import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
  if (!profile) {
    await supabase.from("user_profiles").insert({ user_id: user.id, plan: "free", search_limit: 50, email_limit: 50 });
    return NextResponse.json({ plan: "free", search_used: 0, search_limit: 50, email_sent: 0, email_limit: 50 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { data, error } = await supabase.from("user_profiles").update(body).eq("user_id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
