import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth?error=google_auth_failed`);
  return NextResponse.redirect(data.url);
}
