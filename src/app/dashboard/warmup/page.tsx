"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Flame, Play, RotateCcw, CheckCircle, Clock } from "lucide-react";

export default function WarmupPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await authFetch("/api/warmup");
    const d = await res.json();
    setData(d);
  }

  async function startWarmup() {
    setLoading(true);
    await authFetch("/api/warmup", { method: "POST", body: JSON.stringify({ action: "start" }), headers: { "Content-Type": "application/json" } });
    await load();
    setLoading(false);
  }

  async function resetWarmup() {
    if (!confirm("Reset warmup progress?")) return;
    setLoading(true);
    await authFetch("/api/warmup", { method: "POST", body: JSON.stringify({ action: "reset" }), headers: { "Content-Type": "application/json" } });
    await load();
    setLoading(false);
  }

  if (!data) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" /></div>;

  const sc: Record<string, { label: string; color: string }> = {
    not_started: { label: "Not Started", color: "text-gray-500 bg-gray-50" },
    in_progress: { label: "Warming Up", color: "text-orange-600 bg-orange-50" },
    completed: { label: "Completed", color: "text-green-600 bg-green-50" },
  };
  const s = sc[data.status] || sc.not_started;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Email Warmup</h1>
      <p className="mb-8 text-sm text-gray-500">Gradually increase sending volume to build email reputation</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={"inline-flex h-10 w-10 items-center justify-center rounded-lg " + s.color}>
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-500">Day {data.currentDay} of 14</p>
            </div>
          </div>
          {data.status === "not_started" && (
            <button onClick={startWarmup} disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              <Play className="h-4 w-4" /> Start Warmup
            </button>
          )}
          {data.status === "in_progress" && (
            <button onClick={resetWarmup} disabled={loading} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>

        {data.status === "in_progress" && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">{data.progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500" style={{ width: data.progress + "%" }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{data.todayLimit}</p>
                <p className="text-xs text-blue-500">Daily Limit</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.sentToday}</p>
                <p className="text-xs text-green-500">Sent Today</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">{data.remaining}</p>
                <p className="text-xs text-amber-500">Remaining</p>
              </div>
            </div>
          </>
        )}

        {data.status === "completed" && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Warmup complete! You can now send up to 200 emails per day.</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">14-Day Schedule</h3>
        <div className="grid grid-cols-7 gap-2">
          {data.schedule.map((item: any) => {
            const isCurrent = data.status === "in_progress" && data.currentDay === item.day;
            const isPast = data.status === "in_progress" && data.currentDay > item.day;
            const isDone = data.status === "completed";
            const cls = isDone ? "bg-green-100 text-green-700" : isCurrent ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400" : isPast ? "bg-gray-100 text-gray-500" : "bg-gray-50 text-gray-400";
            return (
              <div key={item.day} className={"rounded-lg p-2 text-center text-xs " + cls}>
                <p className="font-bold">Day {item.day}</p>
                <p>{item.limit}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
