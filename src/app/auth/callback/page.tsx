"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Completing sign in...");

  useEffect(() => {
    async function handle() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) { setMsg("Invalid login link."); return; }

      const supabase = getSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMsg("Login failed: " + error.message);
        setTimeout(() => router.push("/auth"), 3000);
        return;
      }
      router.push("/dashboard");
    }
    handle();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-600">{msg}</p>
      </div>
    </div>
  );
}
