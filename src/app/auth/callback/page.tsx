"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Completing sign in...");

  useEffect(() => {
    async function handle() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errdesc = searchParams.get("error_description");
      const hash = window.location.hash.replace(/^#/, "");
      const fp = new URLSearchParams(hash);
      const at = fp.get("access_token");
      const rt = fp.get("refresh_token");
      const ferr = fp.get("error");

      const supabase = getSupabase();

      if (error || ferr) { setMsg(`Login failed: ${errdesc || error || ferr}`); return; }
      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        if (e) { setMsg(`Login failed: ${e.message}`); return; }
        router.push("/dashboard"); return;
      }
      if (at && rt) {
        const { error: e } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        if (e) { setMsg(`Login failed: ${e.message}`); return; }
        router.push("/dashboard"); return;
      }
      setMsg("Invalid login link.");
    }
    handle();
  }, [searchParams, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" /></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
