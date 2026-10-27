import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type OsmPlace = {
  name?: string | null;
  nameFa?: string | null;
  aliases?: string[];
  kind?: string;
  coverageHints?: string[];
};

type OsmDataset = {
  places?: OsmPlace[];
};

type LocationResult = {
  location?: {
    city?: unknown;
    neighborhood?: unknown;
    street?: unknown;
    province?: unknown;
  };
};

const CITY_COVERAGE: Record<string, string> = {
  'رامسر': 'ramsar-area',
  'تنکابن': 'tonekabon-area',
  'نشتارود': 'nashtarud-area',
  'سلمان‌شهر': 'salman-shahr-area',
};

/**
 * OSM coverage rectangles overlap and are not administrative boundaries.
 * They are used only as a disambiguation hint when the user explicitly names
 * one of the supported cities; they must not independently establish a city.
 */
function loadOsmDataset(): OsmDataset | null {
  const path = resolve(process.cwd(), 'datasets/openstreetmap-place-names.json');
  if (!existsSync(path)) return null;

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as OsmDataset).places)
    ) {
      return null;
    }
    return parsed as OsmDataset;
  } catch {
    // A missing or invalid optional dataset must not make property search fail.
    return null;
  }
}

function normalizeText(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[‌\u200c]/g, ' ')
    .replace(/[\-ـ_،,؛;.!؟?()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getPlaceKind(kind: string | undefined): 'street' | 'locality' | null {
  if (kind?.startsWith('road:')) return 'street';
  if (
    kind === 'place:neighbourhood' ||
    kind === 'place:suburb' ||
    kind === 'place:quarter' ||
    kind === 'place:locality' ||
    kind === 'place:village' ||
    kind === 'place:hamlet' ||
    kind === 'place:isolated_dwelling'
  ) {
    return 'locality';
  }
  return null;
}

/**
 * Supplements the curated catalog with OpenStreetMap names when the optional
 * OSM dataset is present. Curated matches take precedence. OSM coverage hints
 * are not treated as proof of municipal boundaries or legal property status.
 */
export function normalizeLocationFromOsm<T extends LocationResult>(
  result: T,
  originalMessage: string,
  dataset: OsmDataset | null = loadOsmDataset(),
): T {
  if (!result.location || !dataset?.places?.length) return result;

  const message = ` ${normalizeText(originalMessage)} `;
  const city = typeof result.location.city === 'string'
    ? result.location.city
    : null;
  const requiredCoverage = city ? CITY_COVERAGE[normalizeText(city).replace(/ /g, '') === 'سلمانشهر' ? 'سلمان‌شهر' : city] : undefined;

  const candidates = dataset.places.flatMap((place) => {
    const kind = getPlaceKind(place.kind);
    if (!kind) return [];

    // Do not use the coverage rectangle to infer a city. If the city was
    // explicitly resolved, use its hint only to reduce ambiguous matches.
    if (
      requiredCoverage &&
      !place.coverageHints?.includes(requiredCoverage)
    ) {
      return [];
    }

    const names = [...new Set([
      place.name,
      place.nameFa,
      ...(Array.isArray(place.aliases) ? place.aliases : []),
    ].filter((name): name is string => typeof name === 'string'))];

    const matchedNames = names
      .map((name) => normalizeText(name))
      .filter((name) =>
        name.length >= 3 && message.includes(` ${name} `),
      )
      .sort((a, b) => b.length - a.length);

    if (!matchedNames.length) return [];

    return [{
      kind,
      canonical: (place.nameFa || place.name || '').trim(),
      normalizedCanonical: normalizeText((place.nameFa || place.name || '').trim()),
      matchedLength: matchedNames[0].length,
    }];
  }).filter((candidate) => candidate.canonical.length > 0)
    .sort((a, b) => b.matchedLength - a.matchedLength);

  const bestOfKind = (kind: 'street' | 'locality') => {
    const matches = candidates.filter((candidate) => candidate.kind === kind);
    if (!matches.length) return null;

    // Several OSM road segments can represent the same named street.
    const distinct = [...new Map(
      matches.map((candidate) => [candidate.normalizedCanonical, candidate]),
    ).values()];

    // Without an explicit city, only accept a name if it resolves to one
    // canonical label across the loaded coverage; otherwise it is ambiguous.
    if (!requiredCoverage && distinct.length !== 1) return null;
    return distinct[0];
  };

  const locality = bestOfKind('locality');
  const street = bestOfKind('street');

  if (
    (result.location.neighborhood == null || result.location.neighborhood === '') &&
    locality
  ) {
    result.location.neighborhood = locality.canonical;
  }
  if (
    (result.location.street == null || result.location.street === '') &&
    street
  ) {
    result.location.street = street.canonical;
  }

  return result;
}
