import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();
  try {
    const event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    const supabase = await supabaseAdmin();

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      const uid = s.client_reference_id || s.metadata?.userId;
      const plan = s.metadata?.plan || "starter";
      if (uid) {
        const limits: Record<string, any> = {
          free: { search: 50, email: 50, ai: 10, seq: 0 },
          starter: { search: 600, email: 600, ai: 50, seq: 3 },
          pro: { search: 2000, email: 2000, ai: 200, seq: 10 },
          growth: { search: 5000, email: 5000, ai: 99999, seq: 20 },
          scale: { search: 15000, email: 15000, ai: 99999, seq: 99999 },
        };
        const l = limits[plan] || limits.starter;
        await supabase.from("user_profiles").upsert({ user_id: uid, plan, stripe_customer_id: s.customer, search_limit: l.search, email_limit: l.email, updated_at: new Date().toISOString(), search_used: 0, email_sent: 0 }, { onConflict: "user_id" });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const s = event.data.object as any;
      const { data: p } = await supabase.from("user_profiles").select("user_id").eq("stripe_customer_id", s.customer).single();
      if (p) {
        await supabase.from("user_profiles").update({ plan: "free", search_limit: 50, email_limit: 50 }).eq("user_id", p.user_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
