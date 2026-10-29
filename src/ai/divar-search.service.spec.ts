import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DivarSearchService } from './divar-search.service';
import { SearchRequestDto } from './dto/search-request.dto';

describe('DivarSearchService', () => {
  let folder: string;
  let databasePath: string;
  let originalDatabasePath: string | undefined;
  let service: DivarSearchService;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'estate-divar-search-'));
    databasePath = join(folder, 'divar_ads.sqlite');
    originalDatabasePath = process.env.DIVAR_SQLITE_PATH;
    process.env.DIVAR_SQLITE_PATH = databasePath;

    const db = new DatabaseSync(databasePath);
    db.exec(`
      CREATE TABLE divar_ads (
        source_row INTEGER PRIMARY KEY,
        cat2_slug TEXT, cat3_slug TEXT, city_slug TEXT, neighborhood_slug TEXT,
        created_at_month TEXT, user_type TEXT, title TEXT, description TEXT,
        rent_mode TEXT, rent_type TEXT, price_mode TEXT, credit_mode TEXT,
        deed_type TEXT, rooms_count TEXT, property_type TEXT,
        land_size REAL, building_size REAL, price_value REAL, rent_value REAL,
        credit_value REAL, has_parking INTEGER, has_pool INTEGER, has_jacuzzi INTEGER,
        has_elevator INTEGER, has_warehouse INTEGER, has_balcony INTEGER,
        has_sauna INTEGER, has_barbecue INTEGER, regular_person_capacity REAL,
        rent_price_on_regular_days REAL, rent_price_on_special_days REAL,
        rent_price_at_weekends REAL, location_latitude REAL, location_longitude REAL
      );
      INSERT INTO divar_ads (
        source_row, cat2_slug, cat3_slug, city_slug, created_at_month, title,
        description, property_type, building_size, price_value
      ) VALUES
        (2, 'residential-sell', 'villa', 'ramsar', '2024-10', 'ویلای رامسر',
         'ویلای نزدیک شهر', 'villa', 180, 4000000000),
        (3, 'residential-sell', 'villa', 'ramsar', '2024-12', 'ویلای گران رامسر',
         'ویلای بزرگ', 'villa', 250, 6000000000),
        (4, 'residential-sell', 'apartment', 'ramsar', '2025-01', 'آپارتمان رامسر',
         'آپارتمان مناسب', 'apartment', 100, 2000000000);
    `);
    db.close();
    service = new DivarSearchService();
  });

  afterEach(() => {
    service.close();
    if (originalDatabasePath === undefined) delete process.env.DIVAR_SQLITE_PATH;
    else process.env.DIVAR_SQLITE_PATH = originalDatabasePath;
    rmSync(folder, { recursive: true, force: true });
  });

  it('filters real source rows by sale intent, property type, city and total budget', async () => {
    const request: SearchRequestDto = {
      intent: 'buy',
      propertyType: 'villa',
      offeredPropertyType: null,
      wantedPropertyType: null,
      rentalMode: null,
      location: { province: null, city: 'رامسر', neighborhood: null, street: null },
      area: { targetSqm: null, minSqm: null, maxSqm: null },
      budget: {
        maxTotalPriceRial: 50000000000,
        maxPricePerSqmRial: null,
        maxDepositRial: null,
        maxRentMonthlyRial: null,
        maxRentNightlyRial: null,
      },
      requirements: {
        bedrooms: null, documentType: null, landUse: null, nearSea: null,
        hasView: null, isInTownship: null, hasMountainView: null,
        hasSeaView: null, viewProtectionClaim: null, deedEra: null,
      },
      stay: { checkInDate: null, checkOutDate: null, guests: null, nights: null },
      features: [],
      missingInformation: [],
      clarificationQuestion: null,
    };

    const result = await service.search(request);

    expect(result.totalMatches).toBe(1);
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0].sourceRow).toBe(2);
    expect(result.listings[0].priceToman).toBe(4000000000);
    expect(result.dataNotice).toContain('تاریخی');
  });
});
