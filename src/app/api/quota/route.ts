import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();
  return NextResponse.json({ plan: profile?.plan || "free", search_used: profile?.search_used || 0, search_limit: 50, ai_messages_used: profile?.ai_messages_used || 0, ai_messages_limit: 10 });
}
