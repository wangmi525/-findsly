part1 = """"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Send, Loader2 } from "lucide-react";

export default function SequencesPage() {
  const [seqs, setSeqs] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(true);
  const [ns, setNs] = useState({ name: "", steps: [] as any[] });
  const [st, setSt] = useState({ delay: 3, channel: "email", message: "" });
  const [cols, setCols] = useState<any[]>([]);
  const [selCol, setSelCol] = useState("");
  const [ctcs, setCtcs] = useState<any[]>([]);
  const [selC, setSelC] = useState<string[]>([]);
  const [aSeq, setASeq] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [res, setRes] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const [sr, cr] = await Promise.all([authFetch("/api/sequences"), authFetch("/api/collections")]);
    setSeqs((await sr.json()).data || []); setCols((await cr.json()).data || []);
  }
  async function loadC(cId: string) { setSelCol(cId); setSelC([]); if (!cId) { setCtcs([]); return; } const r = await authFetch("/api/contacts?collection_id=" + cId + "&limit=100"); setCtcs((await r.json()).data || []); }
  const addS = () => { if (!st.message.trim()) { alert("Write a message first"); return; } setNs({ ...ns, steps: [...ns.steps, { ...st }] }); setSt({ delay: 3, channel: "email", message: "" }); };
  const remS = (i: number) => setNs({ ...ns, steps: ns.steps.filter((_: any, idx: number) => idx !== i) });
  const create = async (e: React.FormEvent) => { e.preventDefault(); if (!ns.name || !ns.steps.length) return; await authFetch("/api/sequences", { method: "POST", body: JSON.stringify({ ...ns, steps: JSON.stringify(ns.steps) }), headers: { "Content-Type": "application/json" } }); setShowNew(false); setNs({ name: "", steps: [] }); load(); };
  const tog = async (id: string, en: boolean) => { await authFetch("/api/sequences/" + id, { method: "PATCH", body: JSON.stringify({ enabled: !en }), headers: { "Content-Type": "application/json" } }); load(); };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await authFetch("/api/sequences/" + id, { method: "DELETE" }); load(); };
"""
with open("src/app/dashboard/sequences/part1.txt", "w") as f:
    f.write(part1)
print("part1 done")
