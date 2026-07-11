"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Shield, User, Trash2, Users, Crown } from "lucide-react";

export default function TeamPage() {
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch("/api/team").then(r => r.json()).then(d => {
      setTeam(d.team); setMembers(d.members || []); setRole(d.role);
    });
  }, []);

  const createTeam = async () => {
    const res = await authFetch("/api/team", { method: "POST", body: JSON.stringify({ name: "My Team" }), headers: { "Content-Type": "application/json" } });
    const d = await res.json();
    if (d.error) { setError(d.error); return; }
    setTeam(d.team); setRole("admin");
  };

  const invite = async () => {
    if (!inviteEmail) return;
    setError("");
    const res = await authFetch("/api/team", { method: "POST", body: JSON.stringify({ email: inviteEmail, team_id: team?.id }), headers: { "Content-Type": "application/json" } });
    const d = await res.json();
    if (d.error) setError(d.error);
    else { setInviteEmail(""); authFetch("/api/team").then(r => r.json()).then(d => { setMembers(d.members); }); }
  };

  if (!team) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Team</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No team yet</h3>
          <p className="text-sm text-gray-500 mb-4">Team features require Growth plan ($199/mo) or higher.</p>
          <button onClick={createTeam} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500">Create Team</button>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Team</h1><p className="text-sm text-gray-500">{members.length} members</p></div>
        <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700"><Crown className="h-4 w-4" /> {team.name}</div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">Invite Member</h3>
        <div className="flex gap-2">
          <input placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={invite} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Invite</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {members.map((m: any, i: number) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-50 px-5 py-4 last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100"><User className="h-4 w-4 text-gray-500" /></div>
              <div><p className="text-sm font-medium text-gray-900">{m.user_profiles?.full_name || "Member"}</p><p className="text-xs text-gray-400">{m.user_profiles?.email || "—"}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">{m.role}</span>
              {role === "admin" && m.role !== "admin" && <button className="rounded-lg p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
