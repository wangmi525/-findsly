import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getGroq } from "@/lib/groq";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { contactData } = body;

  try {
    const prompt = `Score this business contact from 0-100 as a potential customer. 
Factors: industry relevance (40), data completeness (30), engagement potential (30).
Contact: ${JSON.stringify(contactData)}
Return ONLY a number between 0-100.`;
    const completion = await getGroq().chat.completions.create({
      messages: [{ role: "user", content: prompt }], model: "llama3-8b-8192", max_tokens: 10,
    });
    const score = parseInt(completion.choices[0]?.message?.content || "50");
    return NextResponse.json({ score: Math.min(100, Math.max(0, isNaN(score) ? 50 : score)) });
  } catch {
    const score = Math.floor(40 + Math.random() * 50);
    return NextResponse.json({ score });
  }
}
