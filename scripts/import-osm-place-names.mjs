#!/usr/bin/env node
/**
 * Enrich the curated West Mazandaran place-name seed from OpenStreetMap.
 *
 * Usage: node scripts/import-osm-place-names.mjs
 * Output: datasets/openstreetmap-place-names.json
 *
 * The configured rectangles are search coverage hints, NOT official municipal
 * boundaries. Each feature keeps its OSM ID and all coverage hints instead of
 * asserting that a road or settlement belongs administratively to one city.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'datasets/openstreetmap-place-names.json');

const areas = [
  { id: 'ramsar-area', label: 'رامسر و پیرامون', bbox: [36.80, 50.52, 37.00, 50.82] },
  { id: 'tonekabon-area', label: 'تنکابن و پیرامون', bbox: [36.68, 50.78, 36.90, 51.08] },
  { id: 'nashtarud-area', label: 'نشتارود و پیرامون', bbox: [36.68, 50.78, 36.84, 50.98] },
  { id: 'salman-shahr-area', label: 'سلمان‌شهر و پیرامون', bbox: [36.64, 50.96, 36.82, 51.20] },
];

const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function buildQuery(box) {
  const bbox = '(' + box.join(',') + ')';
  return '[out:json][timeout:90];' +
    '(way["name"]["highway"]' + bbox + ';' +
    'node["name"]["place"]' + bbox + ';' +
    'way["name"]["place"]' + bbox + ';' +
    'relation["name"]["place"]' + bbox + ';' +
    'node["name"]["place"~"neighbourhood|suburb|quarter|locality|village|town|city|hamlet"]' + bbox + ';' +
    'way["name"]["place"~"neighbourhood|suburb|quarter|locality|village|town|city|hamlet"]' + bbox + ';' +
    'relation["name"]["place"~"neighbourhood|suburb|quarter|locality|village|town|city|hamlet"]' + bbox + ';);out center tags;';
}

function classify(tags = {}) {
  if (tags.place) return 'place:' + tags.place;
  if (tags.highway === 'motorway' || tags.highway === 'trunk') return 'road:major';
  if (tags.highway === 'primary' || tags.highway === 'secondary') return 'road:main';
  if (tags.highway === 'tertiary' || tags.highway === 'residential') return 'road:street';
  if (tags.highway === 'service' || tags.highway === 'living_street') return 'road:local';
  return 'road:' + (tags.highway || 'other');
}

async function queryArea(area) {
  const query = buildQuery(area.bbox);
  let lastError;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'estateAssistant-place-dataset/0.1 (local research import)',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
      const payload = await response.json();
      if (!Array.isArray(payload.elements)) throw new Error('Unexpected Overpass response');
      return payload.elements.map((element) => ({
        osmType: element.type,
        osmId: element.id,
        name: element.tags?.name,
        nameFa: element.tags?.['name:fa'] || null,
        aliases: (element.tags?.alt_name || element.tags?.old_name || '')
          .split(';').map((name) => name.trim()).filter(Boolean),
        kind: classify(element.tags),
        tags: element.tags || {},
        location: element.lat != null && element.lon != null
          ? { latitude: element.lat, longitude: element.lon }
          : element.center?.lat != null && element.center?.lon != null
            ? { latitude: element.center.lat, longitude: element.center.lon }
            : null,
        coverageHints: [area.id],
        source: 'OpenStreetMap',
      }));
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error('Failed to query ' + area.id + ': ' + (lastError?.message || lastError));
}

const byOsmId = new Map();
for (const area of areas) {
  const records = await queryArea(area);
  for (const record of records) {
    const key = record.osmType + '/' + record.osmId;
    const previous = byOsmId.get(key);
    if (previous) {
      previous.coverageHints = [...new Set([...previous.coverageHints, ...record.coverageHints])];
    } else {
      byOsmId.set(key, record);
    }
  }
  console.log(area.label + ': ' + records.length + ' named OSM objects');
}

const output = {
  datasetName: 'OpenStreetMap West Mazandaran Place Names',
  version: '0.1.0',
  generatedAt: new Date().toISOString(),
  attribution: '© OpenStreetMap contributors',
  license: 'Open Database License (ODbL) 1.0',
  sourceUrl: 'https://www.openstreetmap.org/copyright',
  coverageAreas: areas.map(({ id, label, bbox }) => ({ id, label, bbox })),
  notes: [
    'Coverage rectangles are not official municipal boundaries.',
    'OSM completeness varies by street and neighborhood; missing roads do not imply that they do not exist.',
    'A road may have multiple OSM segments; deduplicate for model prompts by normalized name plus context.',
    'Preserve OSM attribution and comply with ODbL when redistributing a derived database.',
    'This dataset does not establish legal land use, building permission, ownership, or parcel boundaries.',
  ],
  count: byOsmId.size,
  places: [...byOsmId.values()].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'fa') ||
    a.osmType.localeCompare(b.osmType) ||
    a.osmId - b.osmId),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log('Wrote ' + output.count + ' named objects to ' + outputPath);
