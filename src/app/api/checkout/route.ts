import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";

const PLAN_PRICES: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  growth: process.env.STRIPE_GROWTH_PRICE_ID,
  scale: process.env.STRIPE_SCALE_PRICE_ID,
};

export async function POST(req: Request) {
  try {
    const { plan, userId, email } = await req.json();
    const priceId = PLAN_PRICES[plan] || process.env.STRIPE_STARTER_PRICE_ID;
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
