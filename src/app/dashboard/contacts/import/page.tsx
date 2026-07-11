"use client";
import { authFetch } from "@/lib/auth-fetch";
import { useState, useEffect } from "react";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [collection, setCollection] = useState("");
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    authFetch("/api/collections").then(r => r.json()).then(d => setCollections(d.data || []));
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(0, 6);
      const headers = lines[0]?.split(",").map(h => h.trim()) || [];
      const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim()));
      setPreview({ headers, rows, total: text.split("\n").length - 1 });
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (collection) formData.append("collection_id", collection);

    const res = await authFetch("/api/import", { method: "POST", body: formData });
    const d = await res.json();
    setResult(d);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Import Contacts</h1>
      <p className="mb-8 text-sm text-gray-500">Upload a CSV file to bulk import contacts</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Collection</label>
          <select value={collection} onChange={e => setCollection(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
            <option value="">No collection (default)</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">CSV File</label>
          <div className="flex items-center gap-4">
            <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-8 cursor-pointer hover:border-blue-300 transition">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">{file ? file.name : "Click to upload CSV"}</span>
              <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-400">Supported columns: name, email, phone, company, title, location, website</p>
        </div>

        {preview && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Preview ({preview.total} contacts)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    {preview.headers.map((h: string, i: number) => <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row: string[], i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      {row.map((cell: string, j: number) => <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className={`mb-6 rounded-lg p-4 ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center gap-2">
              {result.error ? <AlertCircle className="h-5 w-5 text-red-600" /> : <Check className="h-5 w-5 text-green-600" />}
              <span className={`text-sm ${result.error ? "text-red-700" : "text-green-700"}`}>
                {result.error ? result.error : `Successfully imported ${result.imported} contacts`}
              </span>
            </div>
          </div>
        )}

        <button onClick={handleImport} disabled={!file || loading} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          {loading ? "Importing..." : "Import Contacts"}
        </button>
      </div>
    </div>
  );
}
