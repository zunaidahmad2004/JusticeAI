import { logger } from '../utils/logger';

export interface GeocoderResult {
  latitude:  number;
  longitude: number;
  display_name: string;
}

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key required).
 * Respects Nominatim usage policy — 1 request per second max.
 * Returns null if address cannot be geocoded.
 */
export async function geocodeAddress(address: string): Promise<GeocoderResult | null> {
  if (!address?.trim()) return null;

  // Append India to improve result accuracy for Indian police records
  const query = address.includes('India') ? address : `${address.trim()}, India`;

  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'JusticeAI-Investigation-Platform/1.0 (contact: admin@justiceai.gov.in)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.warn(`Nominatim error: ${res.status} for "${address}"`);
      return null;
    }

    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) {
      logger.debug(`Nominatim: no results for "${address}"`);
      return null;
    }

    return {
      latitude:     parseFloat(data[0].lat),
      longitude:    parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  } catch (err: unknown) {
    logger.warn(`Geocoding failed for "${address}": ${String(err).substring(0, 100)}`);
    return null;
  }
}

/** Throttle helper — wait ms between Nominatim calls to respect usage policy */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
