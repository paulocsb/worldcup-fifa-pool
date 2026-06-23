/**
 * Maps host cities of the FIFA World Cup 2026 to their country (pt-BR
 * label). Only 16 cities — 3 in Mexico, 2 in Canada, 11 in the USA —
 * so a small static set is sufficient and avoids a server-side lookup.
 *
 * Source: docs/FIFA-2026-FORMAT.md (host countries summary). API-Football
 * may return either the city of the stadium or a nearby suburb; entries
 * cover both common forms (e.g. "East Rutherford" for MetLife).
 */

const MEXICO_CITIES = new Set([
  'Mexico City',
  'Ciudad de México',
  'Cidade do México',
  'Guadalajara',
  'Monterrey',
])

const CANADA_CITIES = new Set([
  'Toronto',
  'Vancouver',
])

// All other Copa 2026 host cities are in the USA. Listed for documentation;
// resolution falls back to 'EUA' for any city not in the Mexico/Canada sets.
//
// Atlanta · Foxborough (Boston) · Arlington (Dallas) · Houston ·
// Kansas City · Inglewood (Los Angeles) · Miami Gardens (Miami) ·
// East Rutherford (NY/NJ) · Philadelphia · Santa Clara (SF Bay) · Seattle

export function countryOfCity(city: string | null | undefined): string | null {
  if (!city) return null
  if (MEXICO_CITIES.has(city)) return 'México'
  if (CANADA_CITIES.has(city)) return 'Canadá'
  return 'EUA'
}

/**
 * Composes "Stadium Name · City, Country" with graceful fallbacks:
 *  - venue + city  → "NRG Stadium · Houston, EUA"
 *  - venue only    → "NRG Stadium"
 *  - city only     → "Houston, EUA"
 *  - nothing       → ""
 */
export function venueLabel(
  venue: string | null | undefined,
  city: string | null | undefined,
): string {
  const parts: string[] = []
  if (venue) parts.push(venue)
  if (city) {
    const country = countryOfCity(city)
    parts.push(country ? `${city}, ${country}` : city)
  }
  return parts.join(' · ')
}
