import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  SearchRequestDto,
  validateSearchRequest,
} from './dto/search-request.dto';
import { normalizeKnownLocation } from './location-catalog';
import {
  isLandForVillaConstructionRequest,
  resolveIntentFromMessage,
  resolveNightsFromMessage,
  resolvePricePerSqmTomanFromMessage,
  resolveRentalBudgetTomanFromMessage,
  resolvePropertyTermsFromMessage,
} from './intent-rules';

const REAL_ESTATE_SYSTEM_PROMPT = `
تو یک دستیار فارسی‌زبان برای جست‌وجوی خرید، فروش، اجاره و واگذاری املاک و اقامتگاه در ایران هستی.

قواعد پاسخ‌گویی:
- فقط فارسی روان، طبیعی و ساده بنویس. از واژه‌های نامأنوس و ترجمه‌های تحت‌اللفظی پرهیز کن.
- منظور کاربر را دقیق رعایت کن: «دریا» با «دریاچه» فرق دارد؛ این دو را جایگزین هم نکن.
- پاسخ را کوتاه و کاربردی نگه دار. معمولاً ۲ تا ۴ جمله کافی است.
- اطلاعاتی را که کاربر گفته دوباره نپرس.
- فقط مهم‌ترین اطلاعاتِ هنوز نامشخص را بپرس؛ در هر نوبت حداکثر دو سؤال.
- برای اجاره کوتاه‌مدت معمولاً مقصد، تاریخ ورود و خروج، تعداد نفرات و بودجه مهم‌اند.
- ادعا نکن که اقامتگاه واقعی پیدا کرده‌ای، موجودی را بررسی کرده‌ای یا رزرو انجام داده‌ای، مگر ابزار مربوطه واقعاً این کار را انجام داده باشد.
- هیچ‌وقت درباره امکانات، قیمت یا موجودی یک اقامتگاه مشخص حدس نزن.
`.trim();

const SEARCH_EXTRACTION_PROMPT = `
درخواست مشتری را به یک شیء JSON مطابق ساختار زیر تبدیل کن. فقط JSON معتبر برگردان.
هیچ فیلدی را حذف نکن. اطلاعات نامشخص را null بگذار. برای آرایه missingInformation فقط نام فیلدهای مهمی را بنویس که برای ادامه کار واقعاً لازم‌اند.
مقادیر مجاز:
intent: buy, sell, rent, lease_out, exchange، یا null
propertyType: land, apartment, villa، یا null
offeredPropertyType: land, apartment, villa، یا null
wantedPropertyType: land, apartment, villa، یا null
rentalMode: monthly, short_term، یا null
documentType: six_dang, three_dang, official, end_user, other, unknown، یا null
فیلدهای دامنه‌ای requirements: isInTownship، hasMountainView، hasSeaView، viewProtectionClaim، deedEra.
«زمین/ویلای شهرکی» یعنی isInTownship=true. «ویو ابدی» یعنی viewProtectionClaim=true و فقط ادعای آگهی درباره حفظ چشم‌انداز است، نه تضمین حقوقی. «دید یا ویوی کوه» یعنی hasMountainView=true؛ «دید یا ویوی دریا» یعنی hasSeaView=true. «سند شاهنشاهی» یعنی deedEra=pre_revolution؛ این عبارت به‌تنهایی اعتبار حقوقی سند را ثابت نمی‌کند. اگر اشاره نشده، null بگذار.
برای استخراج قیمت، همه مبالغ را ابتدا به عدد صحیح «تومان» تبدیل کن؛ حتی اگر کاربر ریال گفته، آن را به تومان تبدیل کن. در این خروجی موقت، مقدار فیلدهای budget را به تومان بنویس، نه ریال. کد سرور بعد از دریافت خروجی، همه مقادیر غیر null بخش budget را به ریال تبدیل می‌کند. برای مثال «۱۰ میلیارد تومان» باید در maxTotalPriceRial به‌صورت عدد 10000000000 نوشته شود؛ سرور آن را در ۱۰ ضرب می‌کند.
استان، شهر و محله را از هم جدا نگه دار. نام شهر را هر جا در متن آمده استخراج کن و هرگز به دلیل نبودن نام استان آن را null نگذار. مثال: «تو تنکابن» یعنی location.city=«تنکابن»؛ «تو رامسر» یعنی location.city=«رامسر». اگر سادات‌شهر ذکر شد و شهر رامسر هم از متن یا زمینه روشن است، city را «رامسر» و neighborhood را «سادات‌شهر» بگذار؛ در غیر این صورت چیزی را حدس نزن. مدت اقامت را در stay.nights ثبت کن. «۳ شب» یعنی nights=3؛ «۳ شب و ۴ روز» یعنی nights=3؛ «برای ۴ روز» نیز معمولاً nights=3. تعداد شب را از متن استخراج کن اما تاریخ ورود و خروج را حدس نزن. برای اجاره کوتاه‌مدت اگر مدت اقامت مشخص است ولی تاریخ ورود و خروج مشخص نیست، checkInDate و checkOutDate را null بگذار و clarificationQuestion را با یک سؤال کوتاه درباره تاریخ ورود تنظیم کن. اگر اطلاعات لازم برای ادامه جست‌وجو ناقص است، نام فیلدهای مربوط را در missingInformation قرار بده.
«حدود ۳۰۰ متر» را با targetSqm=300 ثبت کن و minSqm و maxSqm را null بگذار، مگر بازه دقیق گفته شده باشد.
در requirements.nearSea فقط نزدیکی فیزیکی ملک به دریا یا ساحل را ثبت کن: «نزدیک دریا»، «نزدیک ساحل» و «پیاده تا ساحل» یعنی nearSea=true. اگر چنین شرطی گفته نشده، nearSea=null بگذار. «ویوی دریا» یا «چشم‌انداز دریا» به معنی requirements.hasView=true است و به‌تنهایی nearSea را true نکن؛ نزدیکی به دریا و چشم‌انداز دو شرط مستقل‌اند. اگر فقط نزدیکی به دریا گفته شده، hasView باید null باشد؛ اگر فقط چشم‌انداز دریا گفته شده، nearSea باید null باشد. فقط وقتی هر دو شرط صریحاً گفته شده‌اند، هر دو را true بگذار. اگر کاربر گفت «داخل شهر»، آن را به nearSea یا hasView تعبیر نکن.
شهر را اگر در متن ذکر شده استخراج کن. محله را فقط وقتی کاربر نام محله‌ای را گفته استخراج کن؛ نبودن محله به‌تنهایی اطلاعات ناقص نیست و نباید در missingInformation قرار بگیرد. location.city را هم فقط وقتی واقعاً نام شهر از متن مشخص نیست در missingInformation قرار بده. برای «داخل شهر رامسر» city=«رامسر» ثبت کن و neighborhood را null بگذار.
intent را با توجه به کل جمله، نقش مشتری و قواعد بازار تعیین کن: buy یعنی خرید، sell یعنی فروش، rent یعنی اجاره گرفتن، lease_out یعنی اجاره دادن ملک خود، و exchange یعنی تهاتر/معاوضه. عبارت «ملک دارم» همراه با نرخ شبی/ماهی یعنی معمولاً lease_out؛ «ملک دارم» همراه با قیمت متری یا قیمت کل، یا پرسش «می‌خوام ببینم چند می‌ارزه» یعنی sell؛ نرخ شبی در درخواست ملک یعنی rent با rentalMode=short_term؛ نرخ ماهی در درخواست ملک یعنی rent با rentalMode=monthly. «تهاتر» و «معاوضه» یعنی exchange. در exchange، نوع ملک ارائه‌شده را در offeredPropertyType و نوع ملک درخواستی را در wantedPropertyType بگذار و propertyType را null قرار بده. برای سایر موارد مبهم حدس نزن. اگر فقط نوع ملک، شهر، ویو یا امکانات را گفته و قصد معامله روشن نیست، intent=null بگذار؛ هرگز به‌طور پیش‌فرض buy انتخاب نکن. در این حالت «intent» را در missingInformation قرار بده و clarificationQuestion کوتاهی بپرس که آیا قصد خرید، فروش یا اجاره دارد.
بودجه کل را در maxTotalPriceRial و قیمت هر متر را فقط در maxPricePerSqmRial قرار بده.
برای اجاره کوتاه‌مدت، maxRentNightlyRial را استفاده کن. تاریخ ورود و خروج را با قالب YYYY-MM-DD و تعداد نفرات را در stay.guests ثبت کن. اگر مشخص نیستند null بگذار و در صورت نیاز نام فیلد را در missingInformation بیاور.
ساختار دقیق:
{
  "intent": null,
  "propertyType": null,
  "offeredPropertyType": null,
  "wantedPropertyType": null,
  "rentalMode": null,
  "location": { "province": null, "city": null, "neighborhood": null },
  "area": { "targetSqm": null, "minSqm": null, "maxSqm": null },
  "budget": {
    "maxTotalPriceRial": null,
    "maxPricePerSqmRial": null,
    "maxDepositRial": null,
    "maxRentMonthlyRial": null,
    "maxRentNightlyRial": null
  },
  "requirements": {
    "bedrooms": null,
    "documentType": null,
    "landUse": null,
    "nearSea": null,
    "hasView": null,
    "isInTownship": null,
    "hasMountainView": null,
    "hasSeaView": null,
    "viewProtectionClaim": null,
    "deedEra": null
  },
  "stay": {
    "checkInDate": null,
    "checkOutDate": null,
    "guests": null,
    "nights": null
  },
  "missingInformation": [],
  "clarificationQuestion": null
}
`.trim();

@Injectable()
export class AiService {
  async chat(message: string) {
    const data = await this.callOllama([
      { role: 'system', content: REAL_ESTATE_SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]);

    return {
      reply: data.message?.content ?? '',
    };
  }

  async parseSearchRequest(message: string): Promise<SearchRequestDto> {
    const data = await this.callOllama(
      [
        { role: 'system', content: SEARCH_EXTRACTION_PROMPT },
        { role: 'user', content: message },
      ],
      true,
    );

    const content = data.message?.content;
    if (!content) {
      throw new ServiceUnavailableException(
        'مدل خروجی قابل استفاده‌ای برای درخواست جست‌وجو تولید نکرد.',
      );
    }

    try {
      const parsed = JSON.parse(content) as unknown;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        typeof (parsed as { budget?: unknown }).budget !== 'object' ||
        (parsed as { budget?: unknown }).budget === null ||
        Array.isArray((parsed as { budget: unknown }).budget)
      ) {
        throw new Error('ساختار خروجی مدل معتبر نیست.');
      }

      const result = parsed as {
        location?: {
          city?: unknown;
          neighborhood?: unknown;
          province?: unknown;
        };
        budget: Record<string, unknown>;
        requirements?: Record<string, unknown>;
        intent?: unknown;
        propertyType?: unknown;
        offeredPropertyType?: unknown;
        wantedPropertyType?: unknown;
        rentalMode?: unknown;
        stay?: Record<string, unknown>;
        missingInformation?: unknown;
        clarificationQuestion?: unknown;
      };

      // Resolve high-confidence intent patterns from the original Persian message.
      // This keeps core domain rules deterministic and independently testable.
      const intentResolution = resolveIntentFromMessage(message);
      const landConstructionRequest = isLandForVillaConstructionRequest(message);
      const explicitIntent = intentResolution.intent ?? (landConstructionRequest ? 'buy' : null);
      result.intent = explicitIntent;
      if (intentResolution.rentalMode) {
        result.rentalMode = intentResolution.rentalMode;
      }

      if (landConstructionRequest) {
        result.propertyType = 'land';
        if (!result.requirements || typeof result.requirements !== 'object' || Array.isArray(result.requirements)) {
          result.requirements = {};
        }
        result.requirements.landUse = 'construction';
      }

      // Normalize model-generated rental mode variants to the API contract.
      // Unknown values become null rather than causing the whole request to fail.
      const rawRentalMode =
        typeof result.rentalMode === 'string'
          ? result.rentalMode
              .trim()
              .toLowerCase()
              .replace(/[ي]/g, 'ی')
              .replace(/[ك]/g, 'ک')
              .replace(/[\s-]+/g, '_')
          : '';
      const monthlyRentalModes = new Set([
        'monthly',
        'long_term',
        'longterm',
        'monthly_rent',
        'اجاره_ماهانه',
        'ماهانه',
        'بلندمدت',
        'بلند_مدت',
      ]);
      const shortTermRentalModes = new Set([
        'short_term',
        'shortterm',
        'daily',
        'nightly',
        'temporary',
        'short_term_rental',
        'اجاره_کوتاه_مدت',
        'کوتاه_مدت',
        'روزانه',
        'شبانه',
        'موقت',
      ]);

      if (explicitIntent !== 'rent' && explicitIntent !== 'lease_out') {
        result.rentalMode = null;
      } else if (monthlyRentalModes.has(rawRentalMode)) {
        result.rentalMode = 'monthly';
      } else if (shortTermRentalModes.has(rawRentalMode)) {
        result.rentalMode = 'short_term';
      } else {
        result.rentalMode = null;
      }

      if (!result.stay || typeof result.stay !== 'object' || Array.isArray(result.stay)) {
        result.stay = {};
      }
      const resolvedNights = resolveNightsFromMessage(message);
      if (resolvedNights !== null) result.stay.nights = resolvedNights;
      if (result.stay.nights === undefined) result.stay.nights = null;
      if (result.offeredPropertyType === undefined) result.offeredPropertyType = null;
      if (result.wantedPropertyType === undefined) result.wantedPropertyType = null;
      if (!Array.isArray(result.missingInformation)) {
        result.missingInformation = [];
      }
      if (explicitIntent === 'exchange') {
        result.propertyType = null;
        const missing = result.missingInformation as string[];
        if (result.offeredPropertyType == null && !missing.includes('offeredPropertyType')) {
          missing.push('offeredPropertyType');
        }
        if (result.wantedPropertyType == null && !missing.includes('wantedPropertyType')) {
          missing.push('wantedPropertyType');
        }
        if (missing.includes('offeredPropertyType') || missing.includes('wantedPropertyType')) {
          result.clarificationQuestion = 'چه ملکی برای معاوضه دارید و در مقابل چه ملکی می‌خواهید؟';
        }
      }
      if (explicitIntent === null) {
        const missing = result.missingInformation as string[];
        if (!missing.includes('intent')) {
          missing.push('intent');
        }
        result.clarificationQuestion = 'قصد خرید، فروش یا اجاره دارید؟';
      } else {
        result.missingInformation = (result.missingInformation as string[]).filter(
          (field) => field !== 'intent',
        );
        if (result.clarificationQuestion === 'قصد خرید، فروش یا اجاره دارید؟') {
          result.clarificationQuestion = null;
        }
      }

      // Keep missingInformation focused on actionable questions, not optional property filters.
      const actionableFields = new Set([
        'intent',
        'location.city',
        'propertyType',
        'stay.checkInDate',
        'stay.checkOutDate',
        'stay.guests',
        'offeredPropertyType',
        'wantedPropertyType',
      ]);
      let actionableMissing = (result.missingInformation as string[])
        .filter((field) => actionableFields.has(field));

      if (explicitIntent === null && !actionableMissing.includes('intent')) {
        actionableMissing.push('intent');
      }
      if (result.location?.city == null && !actionableMissing.includes('location.city')) {
        actionableMissing.push('location.city');
      }
      if (
        explicitIntent !== 'exchange' &&
        result.propertyType == null &&
        !actionableMissing.includes('propertyType')
      ) {
        actionableMissing.push('propertyType');
      }
      if (explicitIntent === 'rent' && result.rentalMode === 'short_term') {
        for (const field of ['stay.checkInDate', 'stay.checkOutDate', 'stay.guests']) {
          const key = field.split('.')[1];
          if (result.stay?.[key] == null && !actionableMissing.includes(field)) {
            actionableMissing.push(field);
          }
        }
      }
      if (explicitIntent === 'exchange') {
        if (result.offeredPropertyType == null && !actionableMissing.includes('offeredPropertyType')) {
          actionableMissing.push('offeredPropertyType');
        }
        if (result.wantedPropertyType == null && !actionableMissing.includes('wantedPropertyType')) {
          actionableMissing.push('wantedPropertyType');
        }
      }
      result.missingInformation = [...new Set(actionableMissing)];

      if (explicitIntent === null) {
        result.clarificationQuestion = 'قصد خرید، فروش، اجاره یا معاوضه دارید؟';
      } else if (
        explicitIntent === 'exchange' &&
        (result.offeredPropertyType == null || result.wantedPropertyType == null)
      ) {
        result.clarificationQuestion = 'چه ملکی برای معاوضه دارید و در مقابل چه ملکی می‌خواهید؟';
      } else if (result.location?.city == null && !result.clarificationQuestion) {
        result.clarificationQuestion = 'در کدام شهر یا منطقه دنبال ملک هستید؟';
      }

      if (!result.requirements || typeof result.requirements !== 'object' || Array.isArray(result.requirements)) {
        result.requirements = {};
      }
      const propertyTerms = resolvePropertyTermsFromMessage(message);
      Object.assign(result.requirements, propertyTerms);

      // The model sometimes confuses physical proximity to the sea with a sea view.
      // Resolve these two independent filters deterministically from the user's wording.
      if (
        result.requirements &&
        typeof result.requirements === 'object' &&
        !Array.isArray(result.requirements)
      ) {
        const normalizedMessage = message
          .replace(/[ي]/g, 'ی')
          .replace(/[ك]/g, 'ک')
          .replace(/‌/g, ' ')
          .toLowerCase();

        const mentionsNearSea =
          /نزدیک\s*(?:به\s*)?(?:دریا|ساحل)/.test(normalizedMessage) ||
          /(?:پیاده|با\s*پیاده)\s*(?:تا|به)\s*(?:دریا|ساحل)/.test(normalizedMessage) ||
          /فاصله\s*(?:تا|از)\s*(?:دریا|ساحل)/.test(normalizedMessage);

        const mentionsSeaView =
          /(?:ویو(?:ی)?|چشم\s*انداز|دید|مشرف\s*به)\s*(?:دریا|ساحل)/.test(normalizedMessage) ||
          /(?:دریا|ساحل)\s*(?:ویو|ویوی|چشم\s*انداز|دید)/.test(normalizedMessage);

        const negatesNearSea =
          /(?:ولی|اما|البته)?\s*(?:نزدیک\s*(?:به\s*)?(?:دریا|ساحل)|نزدیکی\s*(?:به\s*)?(?:دریا|ساحل)|نزدیک\s*ساحل\s*بودن)\s*(?:مهم\s*نیست|اهمیت\s*ندارد|نمی\s*خوام|نمی\s*خواهم|لازم\s*نیست)/.test(normalizedMessage);
        result.requirements.nearSea = mentionsNearSea && !negatesNearSea ? true : null;
        result.requirements.hasView = mentionsSeaView ? true : null;
      }

      // Deterministically extract a clear per-square-metre price from colloquial Persian.
      // This value is in Toman here; the common conversion loop below changes it to Rial.
      const pricePerSqmToman = resolvePricePerSqmTomanFromMessage(message);
      if (pricePerSqmToman !== null) {
        result.budget.maxPricePerSqmRial = pricePerSqmToman;
      }

      // Use explicit nightly/monthly amounts from the original message instead of
      // relying on the model to populate the correct budget field.
      const rentalBudget = resolveRentalBudgetTomanFromMessage(message);
      if (rentalBudget !== null) {
        result.rentalMode = rentalBudget.mode;
        if (rentalBudget.mode === 'short_term') {
          result.budget.maxRentNightlyRial = rentalBudget.amountToman;
        } else {
          result.budget.maxRentMonthlyRial = rentalBudget.amountToman;
        }
      }

      const budgetFields = [
        'maxTotalPriceRial',
        'maxPricePerSqmRial',
        'maxDepositRial',
        'maxRentMonthlyRial',
        'maxRentNightlyRial',
      ];

      // Model output uses Toman as an intermediate unit. Convert centrally
      // so a model arithmetic mistake cannot silently change the API unit.
      for (const field of budgetFields) {
        const amount = result.budget[field];
        if (amount !== null && typeof amount === 'number' && Number.isFinite(amount)) {
          result.budget[field] = amount * 10;
        }
      }

      // Resolve city/locality aliases from the curated regional catalog.
      // This prevents historical names such as «سخت‌سر» and «شهسوار» from
      // being treated as unrelated places, and maps localities to their city.
      normalizeKnownLocation(result, message);

      return validateSearchRequest(result);
    } catch (error) {
      console.error('parseSearchRequest error:', error);

      throw new ServiceUnavailableException(
        'مدل نتوانست درخواست را به ساختار استاندارد تبدیل کند. متن درخواست را ساده‌تر کن و دوباره امتحان کن.',
      );
    }
  }

  private async callOllama(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    jsonFormat = false,
  ): Promise<{ message?: { content?: string } }> {
    let response: Response;

    try {
      response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'persian-realtor',
          messages,
          stream: false,
          ...(jsonFormat ? { format: 'json' } : {}),
          options: {
            temperature: jsonFormat ? 0 : 0.2,
            num_ctx: 4096,
          },
        }),
        signal: AbortSignal.timeout(120000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'ارتباط با Ollama برقرار نشد. مطمئن شو Ollama روی همین سیستم در حال اجراست.',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `سرویس Ollama با خطای HTTP ${response.status} پاسخ داد.`,
      );
    }

    return (await response.json()) as {
      message?: { content?: string };
    };
  }
}
