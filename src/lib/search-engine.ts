const searchCache: Map<string, { results: any[]; time: number }> = new Map();

function getCached(key: string): any[] | null {
  const c = searchCache.get(key);
  if (c && Date.now() - c.time < 30 * 60 * 1000) return c.results;
  return null;
}

function buildUrl(base: string, params: Record<string, string>): string {
  const qs = Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  return base + "?" + qs;
}

export async function searchGoogleMaps(query: string, location: string, count: number): Promise<any[]> {
  const key = "gm:" + query + ":" + location;
  const cached = getCached(key);
  if (cached) return cached.slice(0, count);
  const results: any[] = [];
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const url = buildUrl("https://maps.googleapis.com/maps/api/place/textsearch/json", { query: query + " " + location, key: apiKey });
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        for (const p of data.results.slice(0, count)) {
          const emails = await extractEmails("https://" + p.name.toLowerCase().replace(/\s/g, "") + ".com");
          results.push({ name: p.name, title: (p.types && p.types[0] ? p.types[0].replace(/_/g, " ") : "Business"), company: p.name, location: p.formatted_address || location, phone: "", website: "", email: emails[0] || "", source: "Google Maps", score: Math.floor(70 + Math.random() * 30), channels: { email: !!emails[0], instagram: false, whatsapp: false } });
        }
      }
    } catch (e) {}
  }
  if (results.length === 0) {
    const web = await searchWeb(query, location, count);
    results.push(...web);
  }
  searchCache.set(key, { results, time: Date.now() });
  return results.slice(0, count);
}

export async function searchWeb(query: string, location: string, count: number): Promise<any[]> {
  const key = "web:" + query + ":" + location;
  const cached = getCached(key);
  if (cached) return cached.slice(0, count);
  const results: any[] = [];
  try {
    const searchQuery = query + " business " + location + " contact email";
    const url = buildUrl("https://html.duckduckgo.com/html/", { q: searchQuery });
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    const links: string[] = []; const titles: string[] = []; const snippets: string[] = [];
    let m;
    while ((m = linkRegex.exec(html)) !== null && links.length < 20) {
      let href = m[1];
      if (href.includes("uddg=")) { try { href = decodeURIComponent(href.split("uddg=")[1]?.split("&")[0] || href); } catch {} }
      links.push(href); titles.push(m[2].replace(/<[^>]*>/g, "").trim());
    }
    while ((m = snippetRegex.exec(html)) !== null && snippets.length < 20) { snippets.push(m[1].replace(/<[^>]*>/g, "").trim()); }
    for (let i = 0; i < Math.min(links.length, count); i++) {
      const website = links[i] || "";
      const emails = website.startsWith("http") ? await extractEmails(website) : [];
      const domain = website.replace(/^https?:\/\//, "").split("/")[0].replace("www.", "");
      const parts = domain.split(".");
      const companyName = (parts[0] || "").charAt(0).toUpperCase() + (parts[0] || "").slice(1);
      results.push({ name: titles[i] || domain, title: "Business Owner", company: companyName, location, phone: "", website, email: emails[0] || "", source: "Web Search", score: Math.floor(40 + Math.random() * 60), channels: { email: !!emails[0], instagram: false, whatsapp: false }, snippet: snippets[i] || "" });
    }
  } catch (e) {}
  searchCache.set(key, { results, time: Date.now() });
  return results.slice(0, count);
}

export async function extractEmails(url: string): Promise<string[]> {
  try {
    const target = url.startsWith("http") ? url : "https://" + url;
    const res = await fetch(target, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const emails = new Set<string>();
    const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (matches) matches.forEach(function(e: string) { if (!e.match(/\.(png|jpg|jpeg|gif|css|js|svg)$/i) && !e.includes("example.") && !e.includes("sentry.")) emails.add(e.toLowerCase()); });
    return Array.from(emails).slice(0, 3);
  } catch { return []; }
}
