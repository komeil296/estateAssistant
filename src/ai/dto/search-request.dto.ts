import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export type PropertyType = 'land' | 'apartment' | 'villa';
export type RentalMode = 'monthly' | 'short_term';
export type CustomerIntent = 'buy' | 'sell' | 'rent' | 'lease_out' | 'exchange';
export type DocumentType =
  | 'six_dang'
  | 'three_dang'
  | 'official'
  | 'end_user'
  | 'other'
  | 'unknown';
export type DeedEra = 'pre_revolution' | 'post_revolution' | 'unknown';
const DEED_ERAS: DeedEra[] = ['pre_revolution', 'post_revolution', 'unknown'];

const PROPERTY_TYPES: PropertyType[] = ['land', 'apartment', 'villa'];
const RENTAL_MODES: RentalMode[] = ['monthly', 'short_term'];
const CUSTOMER_INTENTS: CustomerIntent[] = [
  'buy',
  'sell',
  'rent',
  'lease_out',
  'exchange',
];
const DOCUMENT_TYPES: DocumentType[] = [
  'six_dang',
  'three_dang',
  'official',
  'end_user',
  'other',
  'unknown',
];

export class SearchLocationDto {
  @ApiProperty({ example: 'مازندران', nullable: true })
  province!: string | null;

  @ApiProperty({ example: 'رامسر', nullable: true })
  city!: string | null;

  @ApiProperty({ example: 'سادات‌شهر', nullable: true })
  neighborhood!: string | null;
}

export class SearchAreaDto {
  @ApiProperty({ example: 300, nullable: true })
  targetSqm!: number | null;

  @ApiProperty({ example: 200, nullable: true })
  minSqm!: number | null;

  @ApiProperty({ example: 400, nullable: true })
  maxSqm!: number | null;
}

export class SearchBudgetDto {
  @ApiProperty({
    example: 100000000000,
    nullable: true,
    description: 'حداکثر بودجه کل به ریال',
  })
  maxTotalPriceRial!: number | null;

  @ApiProperty({
    example: 350000000,
    nullable: true,
    description: 'حداکثر قیمت هر مترمربع به ریال',
  })
  maxPricePerSqmRial!: number | null;

  @ApiProperty({
    example: 5000000000,
    nullable: true,
    description: 'حداکثر ودیعه به ریال',
  })
  maxDepositRial!: number | null;

  @ApiProperty({
    example: 150000000,
    nullable: true,
    description: 'حداکثر اجاره ماهانه به ریال',
  })
  maxRentMonthlyRial!: number | null;

  @ApiProperty({
    example: 50000000,
    nullable: true,
    description: 'حداکثر اجاره هر شب به ریال',
  })
  maxRentNightlyRial!: number | null;
}

export class SearchRequirementsDto {
  @ApiProperty({ example: 2, nullable: true })
  bedrooms!: number | null;

  @ApiProperty({ enum: DOCUMENT_TYPES, nullable: true })
  documentType!: DocumentType | null;

  @ApiProperty({ example: 'residential', nullable: true })
  landUse!: string | null;

  @ApiProperty({ example: true, nullable: true, description: 'نزدیکی ملک به دریا یا ساحل؛ مستقل از چشم‌انداز' })
  nearSea!: boolean | null;

  @ApiProperty({ example: true, nullable: true, description: 'داشتن چشم‌انداز؛ مستقل از فاصله تا دریا' })
  hasView!: boolean | null;

  @ApiProperty({ example: true, nullable: true, description: 'قرار داشتن ملک داخل شهرک' })
  isInTownship!: boolean | null;

  @ApiProperty({ example: true, nullable: true, description: 'چشم‌انداز کوه' })
  hasMountainView!: boolean | null;

  @ApiProperty({ example: true, nullable: true, description: 'چشم‌انداز دریا' })
  hasSeaView!: boolean | null;

  @ApiProperty({ example: true, nullable: true, description: 'ادعای آگهی درباره حفظ چشم‌انداز در بلندمدت؛ نه تضمین حقوقی' })
  viewProtectionClaim!: boolean | null;

  @ApiProperty({ enum: DEED_ERAS, nullable: true, description: 'دوره زمانی سند؛ سند شاهنشاهی به پیش از انقلاب اشاره دارد' })
  deedEra!: DeedEra | null;
}

export class SearchStayDto {
  @ApiProperty({
    example: '2026-11-10',
    nullable: true,
    description: 'تاریخ ورود به شکل YYYY-MM-DD',
  })
  checkInDate!: string | null;

  @ApiProperty({
    example: '2026-11-13',
    nullable: true,
    description: 'تاریخ خروج به شکل YYYY-MM-DD',
  })
  checkOutDate!: string | null;

  @ApiProperty({ example: 4, nullable: true, description: 'تعداد مهمانان' })
  guests!: number | null;

  @ApiProperty({ example: 3, nullable: true, description: 'تعداد شب اقامت؛ مثلاً ۴ روز معمولاً برابر با ۳ شب است' })
  nights!: number | null;
}

/**
 * Canonical search contract shared by model extraction, API filtering, and
 * training examples. Prices are integer Rials; unknown values are null.
 */
export class SearchRequestDto {
  @ApiProperty({ enum: CUSTOMER_INTENTS, nullable: true, example: null })
  intent!: CustomerIntent | null;

  @ApiProperty({ enum: PROPERTY_TYPES, nullable: true, example: 'villa', description: 'نوع ملک مورد جست‌وجو در خرید/اجاره؛ برای معاوضه از wantedPropertyType استفاده کن' })
  propertyType!: PropertyType | null;

  @ApiProperty({ enum: PROPERTY_TYPES, nullable: true, example: 'villa', description: 'نوع ملکی که مشتری در معاوضه ارائه می‌کند' })
  offeredPropertyType!: PropertyType | null;

  @ApiProperty({ enum: PROPERTY_TYPES, nullable: true, example: 'apartment', description: 'نوع ملکی که مشتری در معاوضه می‌خواهد دریافت کند' })
  wantedPropertyType!: PropertyType | null;

  @ApiProperty({ enum: RENTAL_MODES, nullable: true, example: 'short_term' })
  rentalMode!: RentalMode | null;

  @ApiProperty({ type: SearchLocationDto })
  location!: SearchLocationDto;

  @ApiProperty({ type: SearchAreaDto })
  area!: SearchAreaDto;

  @ApiProperty({ type: SearchBudgetDto })
  budget!: SearchBudgetDto;

  @ApiProperty({ type: SearchRequirementsDto })
  requirements!: SearchRequirementsDto;

  @ApiProperty({ type: SearchStayDto })
  stay!: SearchStayDto;

  @ApiProperty({ type: [String], example: ['checkInDate', 'checkOutDate'] })
  missingInformation!: string[];

  @ApiProperty({
    nullable: true,
    example: 'برای چه تاریخی می‌خواهید اقامت داشته باشید؟',
  })
  clarificationQuestion!: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new BadRequestException(`فیلد ${field} باید یک شیء معتبر باشد.`);
  }
  return value;
}

function requireNullableString(
  value: unknown,
  field: string,
): string | null {
  if (value === null || typeof value === 'string') {
    return value;
  }
  throw new BadRequestException(`فیلد ${field} باید متن یا null باشد.`);
}

function requireNullableNumber(
  value: unknown,
  field: string,
): number | null {
  if (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
  ) {
    return value;
  }
  throw new BadRequestException(`فیلد ${field} باید عدد نامنفی یا null باشد.`);
}

function requireNullableBoolean(
  value: unknown,
  field: string,
): boolean | null {
  if (value === null || typeof value === 'boolean') {
    return value;
  }
  throw new BadRequestException(`فیلد ${field} باید true، false یا null باشد.`);
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  nullable = false,
): T | null {
  if (nullable && value === null) {
    return null;
  }
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }
  throw new BadRequestException(`مقدار فیلد ${field} معتبر نیست.`);
}

function requireDateOrNull(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  ) {
    return value;
  }
  throw new BadRequestException(
    `فیلد ${field} باید تاریخ معتبر با قالب YYYY-MM-DD یا null باشد.`,
  );
}

/**
 * Validate untrusted model output before it is used to construct a property
 * search. This function does not verify that locations or properties exist.
 */
export function validateSearchRequest(value: unknown): SearchRequestDto {
  const root = requireRecord(value, 'searchRequest');
  const location = requireRecord(root.location, 'location');
  const area = requireRecord(root.area, 'area');
  const budget = requireRecord(root.budget, 'budget');
  const requirements = requireRecord(root.requirements, 'requirements');
  const stay = requireRecord(root.stay, 'stay');

  if (
    !Array.isArray(root.missingInformation) ||
    !root.missingInformation.every((item) => typeof item === 'string')
  ) {
    throw new BadRequestException(
      'فیلد missingInformation باید آرایه‌ای از متن‌ها باشد.',
    );
  }

  const clarificationQuestion = root.clarificationQuestion;
  if (
    clarificationQuestion !== null &&
    typeof clarificationQuestion !== 'string'
  ) {
    throw new BadRequestException(
      'فیلد clarificationQuestion باید متن یا null باشد.',
    );
  }

  const validated: SearchRequestDto = {
    intent: requireEnum(root.intent, CUSTOMER_INTENTS, 'intent', true) as CustomerIntent | null,
    propertyType: requireEnum(
      root.propertyType,
      PROPERTY_TYPES,
      'propertyType',
      true,
    ),
    offeredPropertyType: requireEnum(
      root.offeredPropertyType,
      PROPERTY_TYPES,
      'offeredPropertyType',
      true,
    ),
    wantedPropertyType: requireEnum(
      root.wantedPropertyType,
      PROPERTY_TYPES,
      'wantedPropertyType',
      true,
    ),
    rentalMode: requireEnum(
      root.rentalMode,
      RENTAL_MODES,
      'rentalMode',
      true,
    ),
    location: {
      province: requireNullableString(location.province, 'location.province'),
      city: requireNullableString(location.city, 'location.city'),
      neighborhood: requireNullableString(
        location.neighborhood,
        'location.neighborhood',
      ),
    },
    area: {
      targetSqm: requireNullableNumber(area.targetSqm, 'area.targetSqm'),
      minSqm: requireNullableNumber(area.minSqm, 'area.minSqm'),
      maxSqm: requireNullableNumber(area.maxSqm, 'area.maxSqm'),
    },
    budget: {
      maxTotalPriceRial: requireNullableNumber(
        budget.maxTotalPriceRial,
        'budget.maxTotalPriceRial',
      ),
      maxPricePerSqmRial: requireNullableNumber(
        budget.maxPricePerSqmRial,
        'budget.maxPricePerSqmRial',
      ),
      maxDepositRial: requireNullableNumber(
        budget.maxDepositRial,
        'budget.maxDepositRial',
      ),
      maxRentMonthlyRial: requireNullableNumber(
        budget.maxRentMonthlyRial,
        'budget.maxRentMonthlyRial',
      ),
      maxRentNightlyRial: requireNullableNumber(
        budget.maxRentNightlyRial,
        'budget.maxRentNightlyRial',
      ),
    },
    requirements: {
      bedrooms: requireNullableNumber(
        requirements.bedrooms,
        'requirements.bedrooms',
      ),
      documentType: requireEnum(
        requirements.documentType,
        DOCUMENT_TYPES,
        'requirements.documentType',
        true,
      ),
      landUse: requireNullableString(
        requirements.landUse,
        'requirements.landUse',
      ),
      nearSea: requireNullableBoolean(
        requirements.nearSea,
        'requirements.nearSea',
      ),
      hasView: requireNullableBoolean(
        requirements.hasView,
        'requirements.hasView',
      ),
      isInTownship: requireNullableBoolean(requirements.isInTownship, 'requirements.isInTownship'),
      hasMountainView: requireNullableBoolean(requirements.hasMountainView, 'requirements.hasMountainView'),
      hasSeaView: requireNullableBoolean(requirements.hasSeaView, 'requirements.hasSeaView'),
      viewProtectionClaim: requireNullableBoolean(requirements.viewProtectionClaim, 'requirements.viewProtectionClaim'),
      deedEra: requireEnum(requirements.deedEra, DEED_ERAS, 'requirements.deedEra', true),
    },
    stay: {
      checkInDate: requireDateOrNull(stay.checkInDate, 'stay.checkInDate'),
      checkOutDate: requireDateOrNull(stay.checkOutDate, 'stay.checkOutDate'),
      guests: requireNullableNumber(stay.guests, 'stay.guests'),
      nights: requireNullableNumber(stay.nights, 'stay.nights'),
    },
    missingInformation: root.missingInformation as string[],
    clarificationQuestion,
  };

  if (
    validated.area.minSqm !== null &&
    validated.area.maxSqm !== null &&
    validated.area.minSqm > validated.area.maxSqm
  ) {
    throw new BadRequestException(
      'حداقل متراژ نمی‌تواند از حداکثر متراژ بیشتر باشد.',
    );
  }

  if (
    validated.stay.checkInDate !== null &&
    validated.stay.checkOutDate !== null &&
    validated.stay.checkInDate >= validated.stay.checkOutDate
  ) {
    throw new BadRequestException('تاریخ خروج باید بعد از تاریخ ورود باشد.');
  }

  return validated;
}
