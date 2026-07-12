import crypto from 'crypto';
import PublicCrimeIncident from '../models/PublicCrimeIncident';
import { callLLM } from './aiService';
import { geocodeAddress, sleep } from './geocodeService';
import { logger } from '../utils/logger';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface RawArticle {
  title:       string;
  url:         string;
  publishedAt: string;
  source:      'gdelt' | 'gnews' | 'newsapi' | 'rss';
  description?: string;
}

interface AIExtracted {
  crime_type: string;
  city:       string;
  state:      string;
  address:    string;
  summary:    string;
  severity:   'high' | 'medium' | 'low';
  is_crime:   boolean;  // false → not actually a crime incident, skip
}

/* ─── URL hash for dedup ─────────────────────────────────────────────────── */
function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. GDELT — completely free, no API key, India crime news
   ═══════════════════════════════════════════════════════════════════════════ */
async function fetchGDELT(): Promise<RawArticle[]> {
  try {
    // GDELT Doc 2.0 Article Search — India crime news last 24h
    const query = encodeURIComponent('crime murder theft assault fraud kidnapping India');
    const url   = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=50&timespan=1440&sort=DateDesc&format=json&sourcecountry=IN`;

    const res  = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];

    const data = await res.json() as { articles?: Array<{ title: string; url: string; seendate: string; sourcename: string }> };
    return (data.articles || []).map((a) => ({
      title:       a.title || '',
      url:         a.url   || '',
      publishedAt: a.seendate || new Date().toISOString(),
      source:      'gdelt' as const,
      description: a.title,
    })).filter((a) => a.url && a.title);
  } catch (err) {
    logger.warn(`GDELT fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. GNews API — free tier 100 requests/day, India crime
   ═══════════════════════════════════════════════════════════════════════════ */
async function fetchGNews(): Promise<RawArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://gnews.io/api/v4/search?q=crime+India&lang=en&country=in&max=20&apikey=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json() as { articles?: Array<{ title: string; url: string; publishedAt: string; description: string }> };
    return (data.articles || []).map((a) => ({
      title:       a.title,
      url:         a.url,
      publishedAt: a.publishedAt,
      source:      'gnews' as const,
      description: a.description,
    }));
  } catch (err) {
    logger.warn(`GNews fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. NewsAPI — free tier, India crime headlines
   ═══════════════════════════════════════════════════════════════════════════ */
async function fetchNewsAPI(): Promise<RawArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://newsapi.org/v2/everything?q=crime+India&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json() as { articles?: Array<{ title: string; url: string; publishedAt: string; description: string }> };
    return (data.articles || []).map((a) => ({
      title:       a.title,
      url:         a.url,
      publishedAt: a.publishedAt,
      source:      'newsapi' as const,
      description: a.description,
    }));
  } catch (err) {
    logger.warn(`NewsAPI fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. GDELT GEO JSON (backup - real geocoords directly from GDELT)
   ═══════════════════════════════════════════════════════════════════════════ */
async function fetchGDELTGeo(): Promise<Array<RawArticle & { lat?: number; lng?: number }>> {
  try {
    const query = encodeURIComponent('crime India');
    const url   = `https://api.gdeltproject.org/api/v2/geo/geo?query=${query}&mode=PointData&maxrecords=50&timespan=1440&format=json`;
    const res   = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data  = await res.json() as { features?: Array<{ properties: { name: string; url: string; seendate: string; avgviews: number }; geometry: { coordinates: [number, number] } }> };
    return (data.features || []).map((f) => ({
      title:       f.properties.name || '',
      url:         f.properties.url  || '',
      publishedAt: f.properties.seendate || new Date().toISOString(),
      source:      'gdelt' as const,
      lat: f.geometry?.coordinates?.[1],
      lng: f.geometry?.coordinates?.[0],
    })).filter((a) => a.url && a.title && a.lat && a.lng);
  } catch (err) {
    logger.warn(`GDELT GEO fetch failed: ${String(err).substring(0, 100)}`);
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gemini AI extraction
   ═══════════════════════════════════════════════════════════════════════════ */
async function extractWithGemini(articles: RawArticle[]): Promise<Array<RawArticle & AIExtracted>> {
  if (!articles.length) return [];

  const BATCH = 10; // process 10 articles per Gemini call
  const results: Array<RawArticle & AIExtracted> = [];

  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH);

    const prompt = `You are a crime news analyst. Analyze these Indian news headlines and extract structured crime data.

For EACH article, determine:
1. Is it an actual crime incident? (is_crime: true/false)
2. Crime type (one of: Murder, Theft, Assault, Cyber Crime, Fraud, Kidnapping, Drugs, Women Safety, Other)
3. City where crime occurred
4. State (Indian state name)
5. Street/area address if mentioned
6. Brief factual summary (1-2 sentences, no speculation)
7. Severity: high (murder/rape/kidnapping), medium (assault/robbery/fraud), low (theft/minor)

Articles:
${batch.map((a, idx) => `${idx + 1}. "${a.title}"${a.description ? ` — ${a.description?.substring(0, 150)}` : ''}`).join('\n')}

Return ONLY valid JSON array. One object per article in order:
[
  {
    "is_crime": true,
    "crime_type": "Murder",
    "city": "Mumbai",
    "state": "Maharashtra",
    "address": "Andheri West",
    "summary": "One sentence factual summary.",
    "severity": "high"
  }
]

Rules:
- If headline is not about a crime incident, set is_crime: false
- Never invent locations not mentioned in the headline
- Only extract what is explicitly stated
- City and state MUST be in India`;

    try {
      const response = await callLLM(prompt);
      const cleaned  = response.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const match    = cleaned.match(/\[[\s\S]*\]/);
      if (!match) continue;

      const parsed: AIExtracted[] = JSON.parse(match[0]);
      parsed.forEach((ext, idx) => {
        if (ext.is_crime && batch[idx]) {
          results.push({ ...batch[idx], ...ext });
        }
      });
    } catch (err) {
      logger.warn(`Gemini extraction failed for batch: ${String(err).substring(0, 100)}`);
    }

    await sleep(500); // small delay between Gemini calls
  }

  return results;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: fetch + extract + geocode + save
   ═══════════════════════════════════════════════════════════════════════════ */
export async function fetchAndStorePublicCrime(): Promise<number> {
  logger.info('Starting public crime news fetch...');

  // 1. Fetch from all available sources
  const [gdelt, gnews, newsapi, gdeltGeo] = await Promise.all([
    fetchGDELT(),
    fetchGNews(),
    fetchNewsAPI(),
    fetchGDELTGeo(),
  ]);

  const allArticles = [...gdelt, ...gnews, ...newsapi];
  logger.info(`Fetched: GDELT=${gdelt.length}, GNews=${gnews.length}, NewsAPI=${newsapi.length}, GDELTGeo=${gdeltGeo.length}`);

  // 2. Filter out already-stored articles
  const hashes     = allArticles.map((a) => hashUrl(a.url));
  const existing   = await PublicCrimeIncident.find({ url_hash: { $in: hashes } }).select('url_hash').lean();
  const existSet   = new Set(existing.map((e) => e.url_hash));
  const newArticles = allArticles.filter((a) => !existSet.has(hashUrl(a.url)));

  logger.info(`${newArticles.length} new articles to process (${allArticles.length - newArticles.length} already stored)`);

  let saved = 0;

  // 3. Process GDELT Geo articles (already have coordinates)
  for (const article of gdeltGeo) {
    const hash = hashUrl(article.url);
    if (existSet.has(hash)) continue;
    if (!article.lat || !article.lng) continue;
    try {
      await PublicCrimeIncident.create({
        source:       'gdelt',
        source_url:   article.url,
        headline:     article.title,
        published_at: new Date(article.publishedAt),
        crime_type:   'Other',
        city: '', state: '', address: '',
        summary:      article.title,
        severity:     'medium',
        latitude:     article.lat,
        longitude:    article.lng,
        geocoded:     true,
        url_hash:     hash,
      });
      saved++;
    } catch { /* duplicate — skip */ }
  }

  // 4. Extract structured data from text articles using Gemini
  if (newArticles.length > 0) {
    const extracted = await extractWithGemini(newArticles);
    logger.info(`Gemini extracted ${extracted.length} crime incidents from ${newArticles.length} articles`);

    // 5. Geocode each extracted incident
    for (const inc of extracted) {
      const hash = hashUrl(inc.url);
      const locationQuery = [inc.address, inc.city, inc.state].filter(Boolean).join(', ');

      let lat: number | undefined;
      let lng: number | undefined;
      let geocoded = false;

      if (locationQuery) {
        await sleep(1200); // Nominatim 1 req/sec
        const geo = await geocodeAddress(locationQuery);
        if (geo) { lat = geo.latitude; lng = geo.longitude; geocoded = true; }
      }

      // Only save if we have coordinates (map requires them)
      if (!geocoded || !lat || !lng) {
        logger.debug(`Skipped (no coordinates): ${inc.title.substring(0, 60)}`);
        continue;
      }

      try {
        await PublicCrimeIncident.create({
          source:       inc.source,
          source_url:   inc.url,
          headline:     inc.title,
          published_at: new Date(inc.publishedAt),
          crime_type:   inc.crime_type  || 'Other',
          city:         inc.city        || '',
          state:        inc.state       || '',
          address:      inc.address     || '',
          summary:      inc.summary     || inc.title,
          severity:     inc.severity    || 'medium',
          latitude:     lat,
          longitude:    lng,
          geocoded:     true,
          url_hash:     hash,
        });
        saved++;
      } catch { /* duplicate url_hash — skip */ }
    }
  }

  logger.info(`Public crime fetch complete: ${saved} new incidents saved`);
  return saved;
}

/* ─── Get cached incidents for map ──────────────────────────────────────── */
export async function getCachedIncidents(filters: {
  crime_type?: string;
  since_hours?: number;
}) {
  const query: Record<string, unknown> = {
    geocoded:  true,
    latitude:  { $exists: true, $ne: null },
    longitude: { $exists: true, $ne: null },
  };

  if (filters.crime_type && filters.crime_type !== 'all') {
    query.crime_type = filters.crime_type;
  }

  if (filters.since_hours && filters.since_hours > 0) {
    query.published_at = { $gte: new Date(Date.now() - filters.since_hours * 3600 * 1000) };
  }

  return PublicCrimeIncident.find(query)
    .sort({ published_at: -1 })
    .limit(300)
    .lean();
}

/* ─── Check when last fetched ────────────────────────────────────────────── */
export async function getLastFetchTime(): Promise<Date | null> {
  const latest = await PublicCrimeIncident.findOne().sort({ fetched_at: -1 }).select('fetched_at').lean();
  return latest ? latest.fetched_at : null;
}
