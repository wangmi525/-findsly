import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { channel, contact_id, subject, message } = body;

  let status = "sent";
  let link = "";

  switch (channel) {
    case "email":
      status = "sent";
      break;
    case "whatsapp":
      status = "sent";
      link = `https://wa.me/${body.phone || ""}?text=${encodeURIComponent(message || "")}`;
      break;
    case "telegram":
      link = `https://t.me/${body.handle || ""}`;
      break;
    case "instagram":
      link = `https://ig.me/m/${body.handle || ""}`;
      break;
    case "facebook":
      link = `https://m.me/${body.handle || ""}`;
      break;
    case "line":
      link = `https://line.me/R/ti/p/@${body.handle || ""}`;
      break;
    case "twitter":
      link = `https://x.com/messages/${body.handle || ""}`;
      break;
    case "discord":
      link = `https://discord.com/users/${body.handle || ""}`;
      break;
    case "phone":
      link = `tel:${body.phone || ""}`;
      break;
    case "sms":
      link = `sms:${body.phone || ""}`;
      break;
  }

  if (contact_id) {
    await supabase.from("interactions").insert({
      contact_id,
      user_id: user.id,
      channel,
      direction: "outbound",
      subject: subject || "",
      body: message || "",
      status,
    });
    await supabase.from("contacts").update({ last_contacted: new Date().toISOString(), status: "contacted", updated_at: new Date().toISOString() }).eq("id", contact_id);
  }

  return NextResponse.json({ success: true, status, link, channel });
}
