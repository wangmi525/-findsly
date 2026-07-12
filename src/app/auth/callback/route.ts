import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const origin = url.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=No+code+provided`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(sessionError.message)}`);
  }

  if (data.session) {
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: "bearer",
    });

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(cookieName, cookieValue, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  return NextResponse.redirect(`${origin}/auth?error=No+session+created`);
}
