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
  const mentionsPrice = /(?:میلیارد|میلیون|تومن|تومان|ریال|متری\s*[\d۰-۹]|قیمت|چند\s*می ?ارزه|چقدر\s*می ?ارزه)/.test(text);
  const valuationIntent = /(?:ببینم|بدونم|بدونیم)\s*(?:که\s*)?(?:ملکم\s*)?(?:چند|چقدر)\s*می ?ارزه|(?:قیمت|ارزش)\s*(?:ملکم|ملک|زمین|ویلا)/.test(text);

  if (/(?:تهاتر|معاوضه|عوض\s*کنم|تعویض\s*کنم)/.test(text)) {
    return { intent: 'exchange', rentalMode: null };
  }

  if (/(?:اجاره\s*(?:بدم|بدهم|بدهیم|بدیم|بگذارم|بذارم)|اجاره\s*می ?دم|ملکم\s*(?:رو|را)\s*اجاره)/.test(text)) {
    return {
      intent: 'lease_out',
      rentalMode: mentionsNightlyPrice ? 'short_term' : mentionsMonthlyPrice ? 'monthly' : null,
    };
  }

  if (/(?:می ?خوام\s*بفروشم|می ?خواهم\s*بفروشم|بفروشم|بفروشیم|برای\s*فروش|قصد\s*فروش|می ?خوام\s*ببینم\s*(?:چند|چقدر)\s*می ?ارزه)/.test(text)) {
    return { intent: 'sell', rentalMode: null };
  }

  if (ownsProperty && (mentionsNightlyPrice || mentionsMonthlyPrice)) {
    return {
      intent: 'lease_out',
      rentalMode: mentionsNightlyPrice ? 'short_term' : 'monthly',
    };
  }

  if (ownsProperty && (valuationIntent || mentionsPrice)) {
    return { intent: 'sell', rentalMode: null };
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

  // Domain rule: a quoted nightly or monthly amount in a customer's request
  // is treated as a rental budget; ownership above changes the role to landlord.
  if (mentionsNightlyPrice || /(?:برای\s*)?[\d۰-۹]+\s*(?:شب|روز)/.test(text)) {
    return { intent: 'rent', rentalMode: 'short_term' };
  }
  if (mentionsMonthlyPrice) return { intent: 'rent', rentalMode: 'monthly' };

  return { intent: null, rentalMode: null };
}


export function resolveNightsFromMessage(message: string): number | null {
  const text = normalizePersianText(message)
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
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
