import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getGroq } from "@/lib/groq";

const CHANNEL_PROMPTS: Record<string, string> = {
  email: "Write a professional cold email. Include subject line. Keep under 100 words.",
  whatsapp: "Write a casual WhatsApp message. Under 3 sentences. Use 1-2 emojis.",
};

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("ai_messages_used, ai_messages_limit").eq("user_id", user.id).single();
  const used = profile?.ai_messages_used || 0;
  const limit = profile?.ai_messages_limit || 10;
  if (used >= limit) return NextResponse.json({ error: "AI message limit reached. Free tier: 10/month." }, { status: 402 });

  const body = await req.json();
  const { contactName, company, product, channel = "email" } = body;
  const prompt = CHANNEL_PROMPTS[channel] || CHANNEL_PROMPTS.email;
  const full = `${prompt}\n\nMy product: ${product}\nContact: ${contactName} at ${company}\n\nMessage:`;

  let message: string;
  try {
    const completion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: full }], model: "llama3-8b-8192", max_tokens: 300,
    });
    message = completion.choices[0]?.message?.content || "";
  } catch {
    message = channel === "email"
      ? `Subject: Partnership with ${company}\n\nHi ${contactName},\n\nI found ${company} and think our ${product} could help you grow.\n\nInterested in a quick chat?\n\nBest`
      : `Hi ${contactName}! Saw ${company} and wanted to reach out. We help businesses with ${product}. Interested?`;
  }

  await supabase.from("user_profiles").update({ ai_messages_used: used + 1 }).eq("user_id", user.id);
  return NextResponse.json({ message, channel, remaining: limit - used - 1 });
}
