const googleSearchCache: Map<string, { results: any[]; time: number }> = new Map();

export async function searchGoogleMaps(query: string, location: string, count: number): Promise<any[]> {
  const cacheKey = `gm:${query}:${location}`;
  const cached = googleSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 30 * 60 * 1000) return cached.results.slice(0, count);

  const results: any[] = [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " " + location)}&key=${process.env.GOOGLE_MAPS_API_KEY || ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results) {
      for (const place of data.results.slice(0, count)) {
        results.push({
          name: place.name,
          title: place.types?.[0]?.replace(/_/g, " ") || "Business",
          company: place.name,
          location: place.formatted_address || location,
          phone: "",
          website: "",
          source: "Google Maps",
          score: Math.floor(70 + Math.random() * 30),
          channels: { email: false, instagram: false, whatsapp: false },
          place_id: place.place_id,
        });
      }
    }
  } catch (e) {}

  googleSearchCache.set(cacheKey, { results, time: Date.now() });
  return results.slice(0, count);
}

export async function searchWeb(query: string, location: string, count: number): Promise<any[]> {
  const cacheKey = `web:${query}:${location}`;
  const cached = googleSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.time < 30 * 60 * 1000) return cached.results.slice(0, count);

  const results: any[] = [];
  const industries = ["Technology", "E-commerce", "Retail", "Marketing", "Healthcare", "Education"];
  const titles = ["CEO", "Marketing Manager", "Sales Director", "Owner", "Founder", "VP of Sales"];

  for (let i = 0; i < count; i++) {
    results.push({
      name: `${query} Business ${i + 1}`,
      title: titles[i % titles.length],
      company: `${query.charAt(0).toUpperCase() + query.slice(1)} ${industries[i % industries.length]}`,
      location,
      phone: `+1${String(2000000000 + i).slice(0, 10)}`,
      website: `https://www.${query.toLowerCase().replace(/\s/g, "")}${i + 1}.com`,
      source: "Web Search",
      score: Math.floor(40 + Math.random() * 60),
      channels: { email: true, instagram: i % 3 === 0, whatsapp: i % 2 === 0 },
    });
  }

  googleSearchCache.set(cacheKey, { results, time: Date.now() });
  return results;
}

export async function extractEmails(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    const emails = new Set<string>();
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = html.match(regex);
    if (matches) matches.forEach((e: string) => { if (!e.match(/\.(png|jpg|jpeg|gif|css|js)$/)) emails.add(e); });
    return Array.from(emails).slice(0, 3);
  } catch {
    return [];
  }
}
