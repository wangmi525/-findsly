"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus("Authorization denied. Redirecting...");
      setTimeout(() => router.push("/auth"), 2000);
      return;
    }

    if (!code) {
      const hash = window.location.hash.replace("#", "");
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        setStatus("Signed in! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 500);
        return;
      }
      setStatus("No authorization code found.");
      setTimeout(() => router.push("/auth"), 2000);
      return;
    }

    setStatus("Completing sign in...");

    const supabase = getSupabase();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus("Login failed. Redirecting...");
        setTimeout(() => router.push("/auth"), 2000);
        return;
      }
      setStatus("Signed in! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 500);
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
}
