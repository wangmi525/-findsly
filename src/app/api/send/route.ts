import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email-sender";

function replyEmailAddress(contactId: string, domain?: string) {
  return `reply+${contactId}@${domain || process.env.EMAIL_FROM_DOMAIN || "findsly.app"}`;
}

function buildTrackingPixel(interactionId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://findsly.vercel.app";
  return `<img src="${appUrl}/api/track?id=${interactionId}&type=open" width="1" height="1" style="display:none" />`;
}

function buildUnsubscribeLink(email: string, domain?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://findsly.vercel.app";
  const encoded = encodeURIComponent(email);
  return `<div style="margin-top:30px;padding-top:15px;border-top:1px solid #eee;font-size:11px;color:#999"><a href="${appUrl}/api/unsubscribe?email=${encoded}&token=findsly" style="color:#999">Unsubscribe</a></div>`;
}

function wrapHtmlWithTracking(html: string, interactionId: string, email: string): string {
  const pixel = buildTrackingPixel(interactionId);
  const unsub = buildUnsubscribeLink(email);
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}${unsub}</body>`);
  }
  return `<div>${html}</div>${pixel}${unsub}`;
}

export async function POST(req: Request) {
  const supabase = await supabaseServer(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { channel, contact_id, subject, message, phone, handle, recipient_name, recipient_company, parent_interaction_id } = await req.json();
  let result: any = { success: true, channel };
  let error = null;
  let metadata: any = {};

  if (!contact_id) return NextResponse.json({ error: "contact_id required", success: false }, { status: 400 });

  if (channel === "email") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("warmup_status, warmup_started_at, email_limit, email_sent")
      .eq("user_id", user.id)
      .single();

    if (profile?.warmup_status === "in_progress" && profile?.warmup_started_at) {
      const daysSinceStart = Math.floor((Date.now() - new Date(profile.warmup_started_at).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const schedule = [5,10,15,20,30,40,50,65,80,100,120,140,160,200];
      const todayLimit = schedule[Math.min(daysSinceStart - 1, 13)] || 200;

      const today = new Date().toISOString().split("T")[0];
      const { count: sentToday } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("channel", "email")
        .eq("direction", "outbound")
        .gte("created_at", today);

      if ((sentToday || 0) >= todayLimit) {
        return NextResponse.json({
          error: `Daily warmup limit reached (${todayLimit}/day). Try again tomorrow.`,
          success: false,
          warmup: { sentToday: sentToday || 0, limit: todayLimit },
        }, { status: 429 });
      }
    }
  }

  switch (channel) {
    case "email": {
      try {
        const contactRes = await supabase.from("contacts").select("email, tags").eq("id", contact_id).eq("user_id", user.id).single();
        const toEmail = contactRes.data?.email;
        if (!toEmail) { error = "No email found for this contact"; break; }
        if ((contactRes.data?.tags || []).includes("unsubscribed")) { error = "This contact has unsubscribed"; break; }
        const fromAddress = replyEmailAddress(contact_id);

        let finalSubject = subject || "Hello";
        if (parent_interaction_id && !subject) {
          const { data: parent } = await supabase.from("interactions").select("subject").eq("id", parent_interaction_id).single();
          const parentSubject = parent?.subject || "";
          finalSubject = parentSubject.startsWith("Re:") ? parentSubject : `Re: ${parentSubject || "Your message"}`;
        }

        const { data: interaction } = await supabase.from("interactions").insert({
          contact_id, user_id: user.id, channel: "email", direction: "outbound",
          subject: finalSubject, body: message || "", status: "sending",
        }).select("id").single();

        const rawHtml = (message || "").replace(/\n/g, "<br>");
        const trackedHtml = wrapHtmlWithTracking(rawHtml, interaction?.id || "", toEmail);

        const sendResult = await sendEmail({
          from: fromAddress,
          to: toEmail,
          subject: finalSubject,
          html: trackedHtml,
          replyTo: fromAddress,
        });

        if (!sendResult.success) {
          error = sendResult.error || "Send failed";
          if (interaction) await supabase.from("interactions").update({ status: "failed" }).eq("id", interaction.id);
          break;
        }
        result.messageId = sendResult.messageId;
        metadata = { provider: sendResult.provider, message_id: sendResult.messageId, from: fromAddress, to: toEmail };
        if (interaction) {
          await supabase.from("interactions").update({ status: "sent", metadata }).eq("id", interaction.id);
        }
      } catch (e: any) { error = e.message; }
      break;
    }

    case "whatsapp": {
      const { data: profile } = await supabase.from("user_profiles").select("whatsapp_token, whatsapp_phone").eq("user_id", user.id).single();
      const waToken = profile?.whatsapp_token;
      const waPhone = profile?.whatsapp_phone;
      if (!waToken || !waPhone) { error = "WhatsApp not configured"; break; }
      const contactRes = await supabase.from("contacts").select("phone, tags").eq("id", contact_id).eq("user_id", user.id).single();
      const toPhone = contactRes.data?.phone?.replace(/[^0-9]/g, "");
      if (!toPhone) { error = "No phone number for this contact"; break; }
      if ((contactRes.data?.tags || []).includes("unsubscribed")) { error = "This contact has unsubscribed"; break; }
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${waPhone}/messages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${waToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toPhone,
            type: "text",
            text: { body: message || `Hi ${recipient_name || ""}, this is a message from Findsly.` },
          }),
        });
        const d = await res.json();
        if (d.error) { error = d.error.message || JSON.stringify(d.error); } else {
          result.messageId = d.messages?.[0]?.id;
          metadata = { whatsapp_message_id: d.messages?.[0]?.id, to: toPhone, from: waPhone };
        }
      } catch (e: any) { error = e.message; }
      break;
    }

    case "telegram": {
      const { data: profile } = await supabase.from("user_profiles").select("telegram_bot_token").eq("user_id", user.id).single();
      const tgToken = profile?.telegram_bot_token;
      if (!tgToken) { error = "Telegram not configured"; break; }
      const contactRes = await supabase.from("contacts").select("telegram_handle, tags").eq("id", contact_id).eq("user_id", user.id).single();
      const chatId = contactRes.data?.telegram_handle;
      if (!chatId) { error = "No Telegram for this contact"; break; }
      if ((contactRes.data?.tags || []).includes("unsubscribed")) { error = "This contact has unsubscribed"; break; }
      try {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message || `Hi ${recipient_name || ""}, this is a message from Findsly.`,
          }),
        });
        const d = await res.json();
        if (!d.ok) { error = d.description || "Send failed"; } else {
          result.messageId = d.result?.message_id;
          metadata = { telegram_message_id: d.result?.message_id, chat_id: chatId, bot_username: d.result?.from?.username };
        }
      } catch (e: any) { error = e.message; }
      break;
    }

    default:
      error = "Unsupported channel";
  }

  if (error) return NextResponse.json({ error, success: false });

  if (parent_interaction_id) metadata.parent_interaction_id = parent_interaction_id;

  if (channel !== "email") {
    await supabase.from("interactions").insert({
      contact_id,
      user_id: user.id,
      channel,
      direction: "outbound",
      subject: subject || "",
      body: message || "",
      status: "sent",
      metadata,
    });
  }
  await supabase.from("contacts").update({
    last_contacted: new Date().toISOString(), status: "contacted", updated_at: new Date().toISOString(),
  }).eq("id", contact_id);
  await supabase.from("deals").update({ stage: "contacted", updated_at: new Date().toISOString() }).eq("contact_id", contact_id).eq("stage", "lead");

  return NextResponse.json(result);
}
