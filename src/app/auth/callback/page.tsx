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
    const errorDescription = params.get("error_description");

    if (error) {
      setStatus(`Login failed: ${errorDescription || error}`);
      return;
    }

    if (!code) {
      const hash = window.location.hash.replace("#", "");
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        setStatus("Completing sign in...");
        getSupabase().auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
          if (error) {
            setStatus(`Login failed: ${error.message}`);
            return;
          }
          router.push("/dashboard");
        });
        return;
      }

      setStatus("No authorization code found.");
      return;
    }

    setStatus("Completing sign in...");

    const supabase = getSupabase();
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        setStatus(`Login failed: ${error.message}`);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        return;
      }

      // Wait for SIGNED_IN event in case session is still being propagated
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          authListener.subscription.unsubscribe();
          router.push("/dashboard");
        }
      });

      // Fallback: if no SIGNED_IN event after 3s, check session directly
      setTimeout(() => {
        authListener.subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            router.push("/dashboard");
          } else {
            setStatus("Login failed: session not established.");
          }
        });
      }, 3000);
    });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
}
