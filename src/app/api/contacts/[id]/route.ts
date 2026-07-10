import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: contact, error } = await supabase.from("contacts").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: interactions } = await supabase.from("interactions").select("*").eq("contact_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ contact, interactions: interactions || [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { error } = await supabase.from("contacts").update(body).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await supabase.from("contacts").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
