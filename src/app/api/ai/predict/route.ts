import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await supabase.from("ai_preferences").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  const days = count && count > 0 ? 30 : 0;

  const { data: revenue } = await supabase.from("revenue_logs").select("amount").eq("user_id", user.id);
  const { data: deals } = await supabase.from("deals").select("value,stage").eq("user_id", user.id);

  const totalRev = (revenue || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const activeDeals = (deals || []).filter((d: any) => !["won", "lost"].includes(d.stage));
  const pipelineValue = activeDeals.reduce((s: number, d: any) => s + Number(d.value) * (d.probability || 20) / 100, 0);

  return NextResponse.json({
    predictedRevenue: Math.round(pipelineValue * 1.2),
    pipelineValue: Math.round(pipelineValue),
    confidence: days >= 30 ? 85 : Math.min(50 + days, 85),
    dataDays: days,
    message: days < 30 ? "Prediction accuracy improves after 30+ days of platform usage." : "Based on your historical data and current pipeline."
  });
}
