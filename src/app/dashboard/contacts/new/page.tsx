"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

export default function NewContactPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", title: "", company: "", location: "", email: "", phone: "", tags: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [],
      status: "new",
      source: "manual",
    };
    const res = await fetch("/api/contacts", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
    if (res.ok) router.push("/dashboard/contacts");
    setSaving(false);
  };

  const fields = [
    { key: "name", label: "Name", placeholder: "John Doe", required: true },
    { key: "title", label: "Title", placeholder: "CEO" },
    { key: "company", label: "Company", placeholder: "Acme Inc" },
    { key: "location", label: "Location", placeholder: "New York, USA" },
    { key: "email", label: "Email", placeholder: "john@acme.com" },
    { key: "phone", label: "Phone", placeholder: "+1 555-0123" },
    { key: "tags", label: "Tags (comma separated)", placeholder: "vip, follow-up" },
  ];

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/contacts" className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Contact</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
            <input type="text" placeholder={f.placeholder} required={f.required} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 outline-none" />
          </div>
        ))}
        <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? "Saving..." : "Add Contact"}
        </button>
      </form>
    </div>
  );
}
