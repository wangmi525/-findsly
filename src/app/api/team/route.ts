import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase.from("team_members").select("*, teams(*)").eq("user_id", user.id).single();
  if (team) {
    const { data: members } = await supabase.from("team_members").select("*, user_profiles(*)", { count: "exact" }).eq("team_id", team.team_id);
    return NextResponse.json({ team: team.teams, members, role: team.role });
  }
  return NextResponse.json({ team: null, members: [], role: null });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("plan").eq("user_id", user.id).single();
  if (!["growth", "scale", "enterprise"].includes(profile?.plan || "")) {
    return NextResponse.json({ error: "Team feature requires Growth plan or higher" }, { status: 402 });
  }

  const body = await req.json();
  const { data: team } = await supabase.from("teams").insert({ owner_id: user.id, name: body.name }).select().single();
  if (!team) return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "admin" });
  return NextResponse.json({ team });
}
