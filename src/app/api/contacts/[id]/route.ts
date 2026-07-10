import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function maskEmail(e: string) { if (!e) return ""; const [n, d] = e.split("@"); if (!d) return e; return n[0] + "***@" + d[0] + "***" + d.slice(-4); }
function maskPhone(p: string) { if (!p) return ""; return p.slice(0, 4) + "****" + p.slice(-4); }
function maskContact(c: any) { return { ...c, email: "", phone: "" }; }

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: contact, error } = await supabase.from("contacts").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: interactions } = await supabase.from("interactions").select("*").eq("contact_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ contact: maskContact(contact), interactions: interactions || [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await supabase.from("contacts").update(body).eq("id", id).eq("user_id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: maskContact(data) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabase.from("contacts").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
