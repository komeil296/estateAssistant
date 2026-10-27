export type ResolvedIntent =
  | 'buy'
  | 'sell'
  | 'rent'
  | 'lease_out'
  | 'exchange';

export type ResolvedRentalMode = 'monthly' | 'short_term';

export interface IntentResolution {
  intent: ResolvedIntent | null;
  rentalMode: ResolvedRentalMode | null;
}

function normalizePersianText(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[‌\u200c]/g, ' ')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Resolve high-confidence real-estate intent patterns supplied by domain experts.
 * Leave genuinely ambiguous messages unresolved instead of guessing.
 */
export function resolveIntentFromMessage(message: string): IntentResolution {
  const text = normalizePersianText(message);
  const ownsProperty = /(?:\bمن\s+)?(?:ملک|ویلا|زمین|آپارتمان|خونه|خانه|مغازه)?\s*(?:رو|را)?\s*دارم\b/.test(text)
    || /(?:ویلا|زمین|آپارتمان|خونه|خانه|ملک|مغازه)\s+دارم/.test(text)
    || /دارم\s+(?:که\s+)?(?:می ?خوام|می ?خواهم)/.test(text);

  const mentionsNightlyPrice = /(?:شبی|هر\s*شب|شبانه)/.test(text);
  const mentionsMonthlyPrice = /(?:ماهی|ماهانه|هر\s*ماه)/.test(text);
  const mentionsPrice = /(?:میلیارد|میلیون|تومن|تومان|ریال|متری\s*\d|قیمت|چند\s*می ?ارزه|چقدر\s*می ?ارزه)/.test(text);
  const valuationIntent = /(?:ببینم|بدونم|بدونیم)\s*(?:که\s*)?(?:ملکم\s*)?(?:چند|چقدر)\s*می ?ارزه|(?:قیمت|ارزش)\s*(?:ملکم|ملک|زمین|ویلا)/.test(text);

  if (/(?:تهاتر|معاوضه|عوض\s*کنم|تعویض\s*کنم)/.test(text)) {
    return { intent: 'exchange', rentalMode: null };
  }

  // Valuation is a separate user goal; do not silently convert it into selling.
  if (valuationIntent) {
    return { intent: null, rentalMode: null };
  }

  if (/(?:اجاره\s*(?:بدم|بدهم|بدهیم|بدیم|بده|بدید|بدهید|بگذارم|بذارم)|اجاره\s*می ?دم|ملکم\s*(?:رو|را)\s*اجاره)/.test(text)) {
    return {
      intent: 'lease_out',
      rentalMode: mentionsNightlyPrice ? 'short_term' : mentionsMonthlyPrice ? 'monthly' : null,
    };
  }

  if (/(?:می ?خوام\s*بفروشم|می ?خواهم\s*بفروشم|بفروشم|بفروشیم|برای\s*فروش|قصد\s*فروش)/.test(text)) {
    return { intent: 'sell', rentalMode: null };
  }

  if (ownsProperty && (mentionsNightlyPrice || mentionsMonthlyPrice)) {
    return {
      intent: 'lease_out',
      rentalMode: mentionsNightlyPrice ? 'short_term' : 'monthly',
    };
  }

  if (ownsProperty && mentionsPrice) {
    return { intent: 'sell', rentalMode: null };
  }

  // Land wanted for building a villa is a high-confidence purchase request.
  if (/(?:زمین).{0,45}(?:برای\s*)?(?:ساخت|ساختن).{0,20}ویلا/.test(text)
      && /(?:می ?خوام|می ?خواهم|دنبال|لازم\s*دارم)/.test(text)) {
    return { intent: 'buy', rentalMode: null };
  }

  if (
    mentionsPrice &&
    !mentionsNightlyPrice &&
    !mentionsMonthlyPrice &&
    /(?:می ?خوام|می ?خواهم|می ?خوایم|می ?خواهیم).{0,50}(?:بگیرم|بگیریم)/.test(text)
  ) {
    return { intent: 'buy', rentalMode: null };
  }

  if (/(?:می ?خوام\s*(?:بخرم|خرید)|می ?خواهم\s*(?:بخرم|خرید)|دنبال\s*خرید|برای\s*خرید|قصد\s*خرید|بخرم|بخریم)/.test(text)) {
    return { intent: 'buy', rentalMode: null };
  }

  if (/(?:اجاره\s*(?:کنم|بگیرم|بگیریم)|برای\s*اجاره|می ?خوام\s*اجاره|می ?خواهم\s*اجاره)/.test(text)) {
    return {
      intent: 'rent',
      rentalMode: mentionsNightlyPrice ? 'short_term' : mentionsMonthlyPrice ? 'monthly' : null,
    };
  }

  // A quoted nightly or monthly amount in a customer's request is treated as a rental budget.
  if (mentionsNightlyPrice || /(?:برای\s*)?\d+\s*(?:شب|روز)/.test(text)) {
    return { intent: 'rent', rentalMode: 'short_term' };
  }
  if (mentionsMonthlyPrice) return { intent: 'rent', rentalMode: 'monthly' };

  return { intent: null, rentalMode: null };
}

/**
 * Returns a per-square-metre amount in Toman. The service converts it to Rial
 * alongside the other budget fields, so conversion happens exactly once.
 */
export function resolvePricePerSqmTomanFromMessage(message: string): number | null {
  const text = normalizePersianText(message);
  const wordAmount = text.match(/متری\s*(یک|یه)\s*و\s*نیم\s*(میلیارد|میلیون|هزار)/);
  if (wordAmount) {
    const multiplier = wordAmount[2] === 'میلیارد'
      ? 1_000_000_000
      : wordAmount[2] === 'میلیون'
        ? 1_000_000
        : 1_000;
    return Math.round(1.5 * multiplier);
  }

  const match = text.match(/(?:متری\s*(\d+(?:[.,]\d+)?)\s*(میلیارد|میلیون|هزار)?|(\d+(?:[.,]\d+)?)\s*(میلیارد|میلیون|هزار)?\s*متری)/);
  if (!match) return null;

  const rawAmount = (match[1] ?? match[3]).replace(',', '.');
  const unit = match[2] ?? match[4];
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount < 0) return null;

  const multiplier = unit === 'میلیارد'
    ? 1_000_000_000
    : unit === 'میلیون'
      ? 1_000_000
      : unit === 'هزار'
        ? 1_000
        : 1;

  return Math.round(amount * multiplier);
}

/**
 * Extract an explicitly stated nightly/monthly rent budget in Toman.
 * In colloquial Persian, «تومن» without a scale is treated as million Toman
 * only in this rental-price context (e.g. «شبی ۵ تومن»).
 */
export function resolveRentalBudgetTomanFromMessage(
  message: string,
): { mode: ResolvedRentalMode; amountToman: number } | null {
  const text = normalizePersianText(message);
  const match = text.match(
    /(?:شبی|هر\s*شب|شبانه|ماهی|ماهانه|هر\s*ماه)\s*(\d+(?:[.,]\d+)?)\s*(میلیارد|میلیون|هزار|تومن|تومان|ریال)?/,
  );
  if (!match) return null;

  const mode: ResolvedRentalMode = /(?:شبی|هر\s*شب|شبانه)/.test(match[0])
    ? 'short_term'
    : 'monthly';
  const amount = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = match[2];
  const multiplier = unit === 'میلیارد'
    ? 1_000_000_000
    : unit === 'میلیون' || unit === 'تومن' || unit === 'تومان' || unit === 'ریال' || !unit
      ? 1_000_000
      : 1_000;

  return {
    mode,
    amountToman: Math.round(amount * multiplier),
  };
}

export function isLandForVillaConstructionRequest(message: string): boolean {
  const text = normalizePersianText(message);
  return /زمین/.test(text)
    && /(?:برای\s*)?(?:ساخت|ساختن)\s*ویلا/.test(text)
    && /(?:می ?خوام|می ?خواهم|دنبال|لازم\s*دارم)/.test(text);
}

export function resolveNightsFromMessage(message: string): number | null {
  const text = normalizePersianText(message);
  const explicitNights = text.match(/(\d+)\s*شب/);
  if (explicitNights) return Number(explicitNights[1]);
  const days = text.match(/(\d+)\s*روز/);
  if (days) return Math.max(0, Number(days[1]) - 1);
  const words: Record<string, number> = { یک: 1, یه: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, شیش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10 };
  const wordNights = text.match(/(یک|یه|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده)\s*شب/);
  if (wordNights) return words[wordNights[1]];
  const wordDays = text.match(/(یک|یه|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده)\s*روز/);
  if (wordDays) return Math.max(0, words[wordDays[1]] - 1);
  return null;
}


export interface PropertyTerms {
  isInTownship: boolean | null;
  hasMountainView: boolean | null;
  hasSeaView: boolean | null;
  viewProtectionClaim: boolean | null;
  deedEra: 'pre_revolution' | 'post_revolution' | 'unknown' | null;
}

/** Extract domain terminology without inferring unstated property facts. */
export function resolvePropertyTermsFromMessage(message: string): PropertyTerms {
  const text = normalizePersianText(message);
  const isInTownship = /(?:زمین|ویلا|ملک)?\s*(?:شهرکی|داخل\s*(?:یک\s*)?شهرک|توی\s*(?:یک\s*)?شهرک|داخل\s*شهرک)/.test(text);
  const hasMountainView = /(?:ویو(?:ی)?|چشم\s*انداز|دید)\s*(?:به\s*)?کوه|کوه\s*(?:ویو|ویوی|چشم\s*انداز|دید)/.test(text);
  const hasSeaView = /(?:ویو(?:ی)?|چشم\s*انداز|دید|مشرف\s*به)\s*(?:به\s*)?دریا|دریا\s*(?:ویو|ویوی|چشم\s*انداز|دید)/.test(text);
  const viewProtectionClaim = /(?:ویو\s*ابدی|دید\s*ابدی|چشم\s*انداز\s*ابدی)/.test(text);
  const deedEra = /(?:سند\s*)?(?:شاهنشاهی|قبل\s*از\s*انقلاب|پیش\s*از\s*انقلاب)/.test(text)
    ? 'pre_revolution'
    : /(?:سند\s*)?(?:بعد\s*از\s*انقلاب|پس\s*از\s*انقلاب)/.test(text)
      ? 'post_revolution'
      : null;
  return {
    isInTownship: isInTownship ? true : null,
    hasMountainView: hasMountainView ? true : null,
    hasSeaView: hasSeaView ? true : null,
    viewProtectionClaim: viewProtectionClaim ? true : null,
    deedEra,
  };
}
