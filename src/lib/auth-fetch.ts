"use client";
import { getSupabase } from "./supabase-client";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }
  return fetch(url, { ...options, headers });
}
