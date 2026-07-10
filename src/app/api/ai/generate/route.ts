import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getGroq } from "@/lib/groq";

const CHANNEL_PROMPTS: Record<string, string> = {
  email: "Write a professional cold outreach email. Include subject line.",
  whatsapp: "Write a friendly, casual WhatsApp message. Keep it under 3 sentences. Use emojis naturally.",
  telegram: "Write a direct Telegram message. Be concise.",
  instagram: "Write a friendly Instagram DM. Casual tone, 2-3 sentences.",
  linkedin: "Write a professional LinkedIn InMail.",
  twitter: "Write a tweet-length DM (280 chars max).",
};

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { contactName, company, product, channel = "email" } = body;

  const prompt = CHANNEL_PROMPTS[channel] || CHANNEL_PROMPTS.email;
  const full = `${prompt}\n\nContext:\n- My product/service: ${product}\n- Contact name: ${contactName}\n- Contact company: ${company}\n\nWrite the message:`;

  try {
    const completion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: full }],
      model: "llama3-8b-8192",
      max_tokens: 500,
    });
    const message = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ message, channel });
  } catch (err: any) {
    const fallback = channel === "email"
      ? `Subject: Partnership Opportunity with ${company}\n\nHi ${contactName},\n\nI've been following ${company} and would love to explore how our product can help you grow.\n\nWould you be open to a quick chat?\n\nBest regards`
      : `Hi ${contactName}! 👋 I saw ${company} and wanted to reach out. We help businesses like yours with ${product}. Interested?`;
    return NextResponse.json({ message: fallback, channel });
  }
}
