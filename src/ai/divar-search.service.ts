import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { SearchRequestDto } from './dto/search-request.dto';

type SqlValue = string | number | null;
type DivarRow = {
  source_row: number; cat2_slug: string | null; cat3_slug: string | null;
  city_slug: string | null; neighborhood_slug: string | null; created_at_month: string | null;
  user_type: string | null; title: string | null; description: string | null;
  rent_mode: string | null; rent_type: string | null; price_mode: string | null;
  credit_mode: string | null; deed_type: string | null; rooms_count: string | null;
  property_type: string | null; land_size: number | null; building_size: number | null;
  price_value: number | null; rent_value: number | null; credit_value: number | null;
  has_parking: number | null; has_pool: number | null; has_jacuzzi: number | null;
  has_elevator: number | null; has_warehouse: number | null; has_balcony: number | null;
  has_sauna: number | null; has_barbecue: number | null; regular_person_capacity: number | null;
  rent_price_on_regular_days: number | null; rent_price_on_special_days: number | null;
  rent_price_at_weekends: number | null; location_latitude: number | null;
  location_longitude: number | null;
};

const CITY_SLUGS: Record<string, string[]> = {
  رامسر: ['ramsar'], تنکابن: ['tonekabon', 'tanekabon'], شهسوار: ['tonekabon', 'tanekabon'],
  نشتارود: ['nashtarud', 'nashtarood'], 'سلمان شهر': ['salman-shahr', 'salmanshahr', 'salman_shahr'],
  'متل قو': ['salman-shahr', 'salmanshahr', 'salman_shahr'], ساری: ['sari'], بابل: ['babol'],
  آمل: ['amol'], چالوس: ['chaloos', 'chalus', 'chalous'], نوشهر: ['nowshahr', 'noushahr'],
  تهران: ['tehran'], کرج: ['karaj'], رشت: ['rasht'], اصفهان: ['isfahan', 'esfahan'],
  شیراز: ['shiraz'], مشهد: ['mashhad'], تبریز: ['tabriz'], قزوین: ['qazvin'], گرگان: ['gorgan'],
};
const PROPERTY_TERMS: Record<string, string[]> = {
  land: ['land', 'plot', 'زمین', 'قطعه'],
  apartment: ['apartment', 'flat', 'آپارتمان'],
  villa: ['villa', 'ویلا'],
  house: ['house', 'home', 'خانه'],
};
const FEATURE_COLUMNS: Record<string, string> = {
  'amenity.parking': 'has_parking', 'amenity.pool': 'has_pool',
  'amenity.jacuzzi': 'has_jacuzzi', 'amenity.elevator': 'has_elevator',
  'amenity.warehouse': 'has_warehouse', 'amenity.balcony': 'has_balcony',
  'amenity.sauna': 'has_sauna', 'amenity.barbecue': 'has_barbecue',
};
const FEATURE_TEXT_TERMS: Record<string, string[]> = {
  'connectivity.wifi': ['وای فای', 'وای‌فای', 'wifi', 'wi-fi'],
  'amenity.parking': ['پارکینگ'], 'amenity.pool': ['استخر'],
  'amenity.jacuzzi': ['جکوزی', 'جاکوزی'], 'amenity.sauna': ['سونا'],
  'amenity.barbecue': ['باربیکیو', 'باربکیو'],
};

function normalize(value: string): string {
  return value.replace(/[يى]/g, 'ی').replace(/[ك]/g, 'ک')
    .replace(/[‌\u200c]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
function transliterateSlug(value: string): string {
  const known = CITY_SLUGS[normalize(value)];
  if (known && known.length) return known[0];
  const letters: Record<string, string> = {
    ا: 'a', آ: 'a', ب: 'b', پ: 'p', ت: 't', ث: 's', ج: 'j', چ: 'ch',
    ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', ژ: 'zh', س: 's',
    ش: 'sh', ص: 's', ض: 'z', ط: 't', ظ: 'z', ع: '', غ: 'gh', ف: 'f',
    ق: 'gh', ک: 'k', گ: 'g', ل: 'l', م: 'm', ن: 'n', و: 'v', ه: 'h', ی: 'y', ء: '',
  };
  return normalize(value).split('').map((char) => letters[char] ?? (/[a-z0-9]/.test(char) ? char : ' '))
    .join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function boolValue(value: string | boolean | number | string[]): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const text = normalize(value);
    if (['true', 'yes', 'بله', 'دارد', 'مجاز'].includes(text)) return true;
    if (['false', 'no', 'خیر', 'ندارد', 'ممنوع'].includes(text)) return false;
  }
  return null;
}

@Injectable()
export class DivarSearchService {
  private database: DatabaseSync | null = null;

  private getDatabase(): DatabaseSync {
    if (this.database) return this.database;
    const configuredPath = process.env.DIVAR_SQLITE_PATH;
    const databasePath = configuredPath ? resolve(configuredPath) : resolve(process.cwd(), 'data', 'processed', 'divar_ads.sqlite');
    if (!existsSync(databasePath)) {
      throw new ServiceUnavailableException('پایگاه آگهی‌های دیوار آماده نیست. ابتدا scripts/import-divar-to-sqlite.py را اجرا کن.');
    }
    try {
      this.database = new DatabaseSync(databasePath, { readOnly: true });
      return this.database;
    } catch {
      throw new ServiceUnavailableException('پایگاه محلی آگهی‌های دیوار قابل باز شدن نیست؛ فایل دیتابیس را دوباره بساز.');
    }
  }

  async search(request: SearchRequestDto) {
    const db = this.getDatabase();
    const conditions: string[] = ['1 = 1'];
    const parameters: SqlValue[] = [];
    const addTextGroup = (terms: string[]) => {
      const alternatives: string[] = [];
      for (const column of ['title', 'description']) {
        for (const term of terms) {
          alternatives.push("COALESCE(" + column + ", '') LIKE ?");
          parameters.push('%' + term + '%');
        }
      }
      if (alternatives.length) conditions.push('(' + alternatives.join(' OR ') + ')');
    };

    const intent = request.intent;
    if (intent === 'buy' || intent === 'sell') {
      conditions.push("cat2_slug IN ('residential-sell', 'commercial-sell')");
    } else if (intent === 'rent' || intent === 'lease_out') {
      conditions.push("cat2_slug IN ('residential-rent', 'commercial-rent', 'temporary-rent')");
    } else if (intent === 'exchange') {
      addTextGroup(['معاوضه', 'تهاتر', 'تعویض']);
    }

    if (request.propertyType) {
      const terms = PROPERTY_TERMS[request.propertyType];
      const alternatives = ["LOWER(COALESCE(property_type, '')) = ?", "LOWER(COALESCE(cat3_slug, '')) = ?"];
      parameters.push(request.propertyType, request.propertyType);
      for (const term of terms) {
        alternatives.push("LOWER(COALESCE(property_type, '')) LIKE ?");
        alternatives.push("LOWER(COALESCE(cat3_slug, '')) LIKE ?");
        parameters.push('%' + term.toLowerCase() + '%', '%' + term.toLowerCase() + '%');
      }
      conditions.push('(' + alternatives.join(' OR ') + ')');
    }

    if (request.location.city) {
      const city = normalize(request.location.city);
      const slugs = CITY_SLUGS[city] ?? [transliterateSlug(city)];
      const alternatives: string[] = [];
      for (const slug of slugs.filter(Boolean)) {
        alternatives.push("LOWER(COALESCE(city_slug, '')) = ?");
        parameters.push(slug.toLowerCase());
      }
      alternatives.push("COALESCE(title, '') LIKE ?");
      parameters.push('%' + request.location.city + '%');
      alternatives.push("COALESCE(description, '') LIKE ?");
      parameters.push('%' + request.location.city + '%');
      conditions.push('(' + alternatives.join(' OR ') + ')');
    }

    if (request.location.neighborhood) {
      const neighborhood = request.location.neighborhood;
      const slug = transliterateSlug(neighborhood);
      conditions.push("(LOWER(COALESCE(neighborhood_slug, '')) LIKE ? OR COALESCE(title, '') LIKE ? OR COALESCE(description, '') LIKE ?)");
      parameters.push('%' + slug + '%', '%' + neighborhood + '%', '%' + neighborhood + '%');
    }

    const areaColumn = request.propertyType === 'land' ? 'land_size' : request.propertyType ? 'building_size' : 'COALESCE(building_size, land_size)';
    if (request.area.minSqm !== null) {
      conditions.push(areaColumn + ' >= ?');
      parameters.push(request.area.minSqm);
    }
    if (request.area.maxSqm !== null) {
      conditions.push(areaColumn + ' <= ?');
      parameters.push(request.area.maxSqm);
    }
    if (request.area.targetSqm !== null && request.area.minSqm === null && request.area.maxSqm === null) {
      conditions.push(areaColumn + ' BETWEEN ? AND ?');
      parameters.push(request.area.targetSqm * 0.9, request.area.targetSqm * 1.1);
    }

    // Dataset money values are commonly interpreted as Toman; API budgets are Rial.
    const budget = request.budget;
    if (intent === 'buy' || intent === 'sell') {
      if (budget.maxTotalPriceRial !== null) {
        conditions.push("(price_value > 0 AND (price_mode IS NULL OR (LOWER(price_mode) NOT LIKE '%meter%' AND LOWER(price_mode) NOT LIKE '%sqm%' AND LOWER(price_mode) NOT LIKE '%per%')) AND price_value <= ?)");
        parameters.push(budget.maxTotalPriceRial / 10);
      }
      if (budget.maxPricePerSqmRial !== null) {
        conditions.push("(price_value > 0 AND (LOWER(COALESCE(price_mode, '')) LIKE '%meter%' OR LOWER(COALESCE(price_mode, '')) LIKE '%sqm%' OR LOWER(COALESCE(price_mode, '')) LIKE '%per%') AND price_value <= ?)");
        parameters.push(budget.maxPricePerSqmRial / 10);
      }
    } else if (intent === 'rent' || intent === 'lease_out') {
      if (request.rentalMode === 'short_term' && budget.maxRentNightlyRial !== null) {
        conditions.push("COALESCE(NULLIF(rent_price_on_special_days, 0), NULLIF(rent_price_at_weekends, 0), NULLIF(rent_price_on_regular_days, 0), NULLIF(rent_value, 0)) <= ?");
        parameters.push(budget.maxRentNightlyRial / 10);
      } else if (budget.maxRentMonthlyRial !== null) {
        conditions.push('rent_value > 0 AND rent_value <= ?');
        parameters.push(budget.maxRentMonthlyRial / 10);
      }
      if (budget.maxDepositRial !== null) {
        conditions.push('credit_value > 0 AND credit_value <= ?');
        parameters.push(budget.maxDepositRial / 10);
      }
    }

    if (request.requirements.bedrooms !== null) {
      conditions.push("CAST(COALESCE(rooms_count, '0') AS INTEGER) >= ?");
      parameters.push(request.requirements.bedrooms);
    }
    if (request.requirements.nearSea === true) {
      conditions.push("((COALESCE(title, '') LIKE '%دریا%' OR COALESCE(description, '') LIKE '%دریا%' OR COALESCE(title, '') LIKE '%ساحل%' OR COALESCE(description, '') LIKE '%ساحل%') AND COALESCE(title, '') NOT LIKE '%دریاچه%' AND COALESCE(description, '') NOT LIKE '%دریاچه%')");
    } else if (request.requirements.nearSea === false) {
      conditions.push("COALESCE(title, '') NOT LIKE '%دریا%' AND COALESCE(description, '') NOT LIKE '%دریا%' AND COALESCE(title, '') NOT LIKE '%ساحل%' AND COALESCE(description, '') NOT LIKE '%ساحل%'");
    }
    if (request.requirements.hasSeaView === true) addTextGroup(['ویو دریا', 'ویوی دریا', 'چشم انداز دریا', 'چشم‌انداز دریا', 'دید دریا']);
    if (request.requirements.hasMountainView === true) addTextGroup(['ویو کوه', 'ویوی کوه', 'چشم انداز کوه', 'دید کوه']);
    if (request.requirements.isInTownship === true) addTextGroup(['شهرک']);
    if (request.requirements.viewProtectionClaim === true) addTextGroup(['ویو ابدی', 'چشم انداز ابدی', 'چشم‌انداز ابدی']);
    if (request.requirements.deedEra === 'pre_revolution') addTextGroup(['شاهنشاهی']);

    if (request.requirements.documentType) {
      const documentTerms: Record<string, string[]> = {
        six_dang: ['شش دانگ', 'شش‌دانگ'], three_dang: ['سه دانگ', 'سه‌دانگ'],
        single_page: ['تک برگ', 'تک‌برگ'], official: ['رسمی'], end_user: ['قولنامه', 'بنچاق'],
        other: [], unknown: [],
      };
      const terms = documentTerms[request.requirements.documentType] ?? [];
      if (terms.length) addTextGroup(terms);
    }

    for (const feature of request.features ?? []) {
      if (feature.id === 'view.types' && Array.isArray(feature.value)) {
        const terms = feature.value.flatMap((item) => {
          if (item === 'sea') return ['ویو دریا', 'ویوی دریا', 'چشم انداز دریا', 'دید دریا'];
          if (item === 'mountain') return ['ویو کوه', 'ویوی کوه', 'چشم انداز کوه', 'دید کوه'];
          if (item === 'forest') return ['ویو جنگل', 'ویوی جنگل', 'چشم انداز جنگل', 'دید جنگل'];
          return [];
        });
        if (terms.length) addTextGroup(terms);
        continue;
      }
      const column = FEATURE_COLUMNS[feature.id];
      const value = boolValue(feature.value);
      if (column && value !== null) {
        conditions.push(column + ' = ?');
        parameters.push(value ? 1 : 0);
      } else {
        const terms = FEATURE_TEXT_TERMS[feature.id];
        if (terms && value !== false) addTextGroup(terms);
      }
    }

    if (request.requirements.hasView === true &&
        request.requirements.hasSeaView !== true &&
        request.requirements.hasMountainView !== true &&
        !request.features.some((feature) => feature.id === 'view.types')) {
      addTextGroup(['ویو', 'ویوی', 'چشم انداز', 'چشم‌انداز', 'مشرف به']);
    }

    if (request.requirements.landUse) {
      const landUseTerms: Record<string, string[]> = {
        residential: ['مسکونی'],
        agricultural: ['کشاورزی', 'زراعی', 'باغی'],
        commercial: ['تجاری', 'مغازه'],
        construction: ['ساخت', 'پروانه ساخت', 'قابل ساخت'],
      };
      const terms = landUseTerms[request.requirements.landUse];
      if (terms) addTextGroup(terms);
    }

    const where = conditions.join(' AND ');
    const count = db.prepare('SELECT COUNT(*) AS total FROM divar_ads WHERE ' + where).get(...parameters) as { total: number };
    const rows = db.prepare(
      'SELECT source_row, cat2_slug, cat3_slug, city_slug, neighborhood_slug, created_at_month, user_type, title, description, rent_mode, rent_type, price_mode, credit_mode, deed_type, rooms_count, property_type, land_size, building_size, price_value, rent_value, credit_value, has_parking, has_pool, has_jacuzzi, has_elevator, has_warehouse, has_balcony, has_sauna, has_barbecue, regular_person_capacity, rent_price_on_regular_days, rent_price_on_special_days, rent_price_at_weekends, location_latitude, location_longitude FROM divar_ads WHERE ' + where + ' ORDER BY created_at_month DESC, source_row DESC LIMIT 20',
    ).all(...parameters) as unknown as DivarRow[];

    const reply = count.total === 0
      ? 'با شرط‌های فعلی در دیتاست تاریخی دیوار موردی پیدا نشد. ممکن است بعضی فیلدها در آگهی‌ها ثبت نشده باشند یا این نمونهٔ تاریخی آگهی مناسب نداشته باشد.'
      : 'با شرط‌های فعلی ' + count.total.toLocaleString('fa-IR') + ' آگهی در دیتاست تاریخی پیدا شد؛ ' + rows.length.toLocaleString('fa-IR') + ' مورد اول برگردانده شده است.';

    return {
      reply,
      parsedRequest: request,
      totalMatches: count.total,
      returned: rows.length,
      source: 'divarofficial/real_estate_ads',
      sourceUrl: 'https://huggingface.co/datasets/divarofficial/real_estate_ads',
      latestSourceMonth: '2025-03',
      dataNotice: 'این‌ها آگهی‌های تاریخی و ناشناس‌شدهٔ دیتاست هستند؛ قیمت و موجودی فعلی یا امکان تماس با آگهی‌دهنده را تضمین نمی‌کنند.',
      listings: rows.map((row) => ({
        sourceRow: row.source_row,
        title: row.title,
        description: (row.description ?? '').slice(0, 1000),
        citySlug: row.city_slug,
        neighborhoodSlug: row.neighborhood_slug,
        category: row.cat2_slug,
        propertyType: row.property_type ?? row.cat3_slug,
        createdAtMonth: row.created_at_month,
        userType: row.user_type,
        landAreaSqm: row.land_size,
        buildingAreaSqm: row.building_size,
        roomsCount: row.rooms_count,
        priceToman: row.price_value,
        priceMode: row.price_mode,
        rentToman: row.rent_value,
        rentMode: row.rent_mode,
        depositToman: row.credit_value,
        nightlyRatesToman: {
          regular: row.rent_price_on_regular_days,
          weekend: row.rent_price_at_weekends,
          specialDay: row.rent_price_on_special_days,
        },
        amenities: {
          parking: row.has_parking === 1, pool: row.has_pool === 1,
          jacuzzi: row.has_jacuzzi === 1, elevator: row.has_elevator === 1,
          warehouse: row.has_warehouse === 1, balcony: row.has_balcony === 1,
          sauna: row.has_sauna === 1, barbecue: row.has_barbecue === 1,
        },
        coordinates: row.location_latitude !== null && row.location_longitude !== null
          ? { latitude: row.location_latitude, longitude: row.location_longitude } : null,
        matchNotes: [
          ...(request.location.city ? ['شهر بر اساس شناسهٔ شهر یا متن آگهی تطبیق داده شده است.'] : []),
          ...(request.requirements.nearSea === true ? ['نزدیکی به دریا فقط از اشارهٔ متنی آگهی تشخیص داده شده؛ فاصلهٔ جغرافیایی اندازه‌گیری نشده است.'] : []),
          ...(request.features.some((feature) => !FEATURE_COLUMNS[feature.id] && !FEATURE_TEXT_TERMS[feature.id]) ? ['برخی ویژگی‌های درخواستی در این نسخه فیلتر دقیق ندارند.'] : []),
        ],
      })),
    };
  }

  close(): void {
    this.database?.close();
    this.database = null;
  }
}
