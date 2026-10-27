import { normalizeLocationFromOsm } from './openstreetmap-location-catalog';

describe('normalizeLocationFromOsm', () => {
  const dataset = {
    places: [
      {
        name: 'خیابان نمونه',
        nameFa: null,
        aliases: ['نمونه'],
        kind: 'road:street',
        coverageHints: ['ramsar-area'],
      },
      {
        name: 'محله نمونه',
        nameFa: null,
        aliases: [],
        kind: 'place:neighbourhood',
        coverageHints: ['ramsar-area'],
      },
      {
        name: 'خیابان آزادی',
        nameFa: null,
        aliases: [],
        kind: 'road:street',
        coverageHints: ['ramsar-area'],
      },
      {
        name: 'خیابان آزادی',
        nameFa: null,
        aliases: [],
        kind: 'road:street',
        coverageHints: ['tonekabon-area'],
      },
    ],
  };

  it('fills a missing street from OSM when the city is explicitly known', () => {
    const result = {
      location: {
        city: 'رامسر',
        neighborhood: null as string | null,
        street: null as string | null,
      },
    };

    normalizeLocationFromOsm(result, 'زمین در رامسر، خیابان نمونه', dataset);

    expect(result.location.street).toBe('خیابان نمونه');
    expect(result.location.neighborhood).toBeNull();
  });

  it('fills a missing neighborhood from OSM place names', () => {
    const result = {
      location: {
        city: 'رامسر',
        neighborhood: null as string | null,
        street: null as string | null,
      },
    };

    normalizeLocationFromOsm(result, 'ملک در محله نمونه رامسر', dataset);

    expect(result.location.neighborhood).toBe('محله نمونه');
  });

  it('does not overwrite a curated location match', () => {
    const result = {
      location: {
        city: 'رامسر',
        neighborhood: 'محله شناخته‌شده' as string | null,
        street: null as string | null,
      },
    };

    normalizeLocationFromOsm(result, 'خیابان نمونه', dataset);

    expect(result.location.neighborhood).toBe('محله شناخته‌شده');
  });

  it('does not infer a city from an OSM coverage rectangle', () => {
    const result = {
      location: {
        city: null as string | null,
        neighborhood: null as string | null,
        street: null as string | null,
      },
    };

    normalizeLocationFromOsm(result, 'خیابان نمونه', dataset);

    expect(result.location.city).toBeNull();
  });

  it('does not choose an ambiguous street when no city is specified', () => {
    const result = {
      location: {
        city: null as string | null,
        neighborhood: null as string | null,
        street: null as string | null,
      },
    };

    normalizeLocationFromOsm(result, 'خیابان آزادی', dataset);

    expect(result.location.street).toBeNull();
  });
});
