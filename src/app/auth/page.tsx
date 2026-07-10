"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-client";
import { Zap, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [shpw, setShpw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = getSupabase();

    try {
      if (isLogin) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) { setError(authErr.message); setLoading(false); return; }
        if (data.session) { router.push("/dashboard"); return; }
      } else {
        const { data, error: authErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (authErr) { setError(authErr.message); setLoading(false); return; }
        if (data.session) { router.push("/dashboard"); return; }
        setSuccess("Account created! Check your email to confirm, or try signing in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const supabase = getSupabase();
    const { error: authErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authErr) setError(authErr.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center"><Zap className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold text-gray-900">LeadFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-gray-500">{isLogin ? "Sign in to continue" : "Start finding customers for free"}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <button onClick={handleGoogleLogin} className="mb-6 w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or</span></div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailAuth}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 outline-none" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={shpw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm focus:border-blue-500 outline-none" required minLength={6} />
                <button type="button" onClick={() => setShpw(!shpw)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">{shpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600">{error}</div>}
            {success && <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-600">{success}</div>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50">{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
