import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  SearchRequestDto,
  validateSearchRequest,
} from './dto/search-request.dto';
import { normalizeKnownLocation } from './location-catalog';
import { normalizeLocationFromOsm } from './openstreetmap-location-catalog';
import { resolveAccommodationFeaturesFromMessage } from './accommodation-feature-resolver';
import {
  isLandForVillaConstructionRequest,
  resolveIntentFromMessage,
  resolveNightsFromMessage,
  resolveSolarHijriCheckInDateFromMessage,
  resolvePricePerSqmTomanFromMessage,
  resolveRentalBudgetTomanFromMessage,
  resolveDepositBudgetTomanFromMessage,
  resolvePropertyTermsFromMessage,
  resolvePropertyTypeFromMessage,
  resolveExchangePropertyTypesFromMessage,
} from './intent-rules';

const REAL_ESTATE_SYSTEM_PROMPT = `
تو یک دستیار فارسی‌زبان برای جست‌وجوی خرید، فروش، اجاره و واگذاری املاک و اقامتگاه در ایران هستی.

قواعد پاسخ‌گویی:
- فقط فارسی روان، طبیعی و ساده بنویس. از واژه‌های نامأنوس و ترجمه‌های تحت‌اللفظی پرهیز کن.
- منظور کاربر را دقیق رعایت کن: «دریا» با «دریاچه» فرق دارد؛ این دو را جایگزین هم نکن.
- پاسخ را کوتاه و کاربردی نگه دار. معمولاً ۲ تا ۴ جمله کافی است.
- تاریخچه گفتگو را بخوان و اطلاعات قبلی را تا وقتی کاربر اصلاح نکرده حفظ کن.
- در پیام‌های پیگیری، فقط همان شرطی را تغییر بده که کاربر تغییر داده است؛ بقیه شرط‌ها را حفظ کن.
- اطلاعاتی را که کاربر گفته دوباره نپرس و اگر چیزی مبهم است، آن را از واقعیت قطعی جدا کن.
- فقط مهم‌ترین اطلاعاتِ هنوز نامشخص را بپرس؛ در هر نوبت حداکثر دو سؤال.
- برای اجاره کوتاه‌مدت معمولاً مقصد، تاریخ ورود و خروج، تعداد نفرات و بودجه مهم‌اند.
- اگر کاربر می‌گوید «ارزون‌تر»، «بزرگ‌تر»، «همون ولی نزدیک‌تر» یا عبارتی مشابه، آن را با توجه به درخواست‌های قبلی تفسیر کن.
- اگر کاربر فقط نوع ملک یا ویژگی‌ها را می‌گوید، بدون شواهد قصد خرید/فروش/اجاره را قطعی فرض نکن.
- ادعا نکن که آگهی واقعی پیدا کرده‌ای، موجودی را بررسی کرده‌ای یا رزرو انجام داده‌ای، مگر ابزار مربوطه واقعاً این کار را انجام داده باشد.
- هیچ‌وقت درباره امکانات، قیمت، آدرس یا موجودی یک ملک مشخص حدس نزن. اگر جست‌وجوی واقعی به داده‌ها متصل نیست، شفاف بگو که هنوز نتیجه زنده در اختیار نداری.
- اگر درخواست شامل چند شرط است، آن‌ها را دقیق و بدون حذف یا جابه‌جایی بودجه، شهر، نوع معامله، متراژ و امکانات بازگو کن.
- پاسخ طبیعی و مفید بده؛ کوتاه بودن مهم است اما از پاسخ مبهم و بی‌خاصیت پرهیز کن.
`.trim();

const SEARCH_EXTRACTION_PROMPT = `
درخواست مشتری را به یک شیء JSON مطابق ساختار زیر تبدیل کن. فقط JSON معتبر برگردان.
اگر تاریخچهٔ گفتگو داده شده، درخواست جاری را در ادامهٔ همان گفتگو تفسیر کن و شرط‌های قبلی را که کاربر تغییر نداده حفظ کن؛ شرطی را که کاربر صریحاً اصلاح کرده با مقدار جدید جایگزین کن.
هیچ فیلدی را حذف نکن. اطلاعات نامشخص را null بگذار. برای آرایه missingInformation فقط نام فیلدهای مهمی را بنویس که برای ادامه کار واقعاً لازم‌اند.
مقادیر مجاز:
intent: buy, sell, rent, lease_out, exchange، یا null
propertyType: land, apartment, villa, house، یا null
offeredPropertyType: land, apartment, villa، یا null
wantedPropertyType: land, apartment, villa، یا null
rentalMode: monthly, short_term، یا null
documentType: six_dang, three_dang, single_page, official, end_user, other, unknown، یا null
فیلدهای دامنه‌ای requirements: isInTownship، hasMountainView، hasSeaView، viewProtectionClaim، deedEra.
ویژگی‌های اقامتگاه را در features به‌صورت آرایه‌ای از اشیای {id,value} استخراج کن. شناسه‌ها باید از فرهنگ استاندارد باشند؛ ویژگی‌هایی که کاربر صریحاً نخواسته را اضافه نکن و از نوع اقامتگاه امکانات را حدس نزن. مثال شناسه‌ها: amenity.pool، amenity.jacuzzi، food.breakfast.price، bathroom.types، connectivity.wifi، amenity.parking، view.types، accommodation.type. مقادیر چندگزینه‌ای باید آرایه رشته‌ای با مقادیر استاندارد باشند. اگر ویژگی مشخصی گفته نشده، در features قرار نده.
«زمین/ویلای شهرکی» یعنی isInTownship=true. «ویو ابدی» یعنی viewProtectionClaim=true و فقط ادعای آگهی درباره حفظ چشم‌انداز است، نه تضمین حقوقی. «دید یا ویوی کوه» یعنی hasMountainView=true؛ «دید یا ویوی دریا» یعنی hasSeaView=true. «سند شاهنشاهی» یعنی deedEra=pre_revolution؛ این عبارت به‌تنهایی اعتبار حقوقی سند را ثابت نمی‌کند. اگر اشاره نشده، null بگذار.
برای استخراج قیمت، همه مبالغ را ابتدا به عدد صحیح «تومان» تبدیل کن؛ حتی اگر کاربر ریال گفته، آن را به تومان تبدیل کن. در این خروجی موقت، مقدار فیلدهای budget را به تومان بنویس، نه ریال. کد سرور بعد از دریافت خروجی، همه مقادیر غیر null بخش budget را به ریال تبدیل می‌کند. برای مثال «۱۰ میلیارد تومان» باید در maxTotalPriceRial به‌صورت عدد 10000000000 نوشته شود؛ سرور آن را در ۱۰ ضرب می‌کند.
استان، شهر، محله و خیابان را از هم جدا نگه دار. نام خیابان، بلوار یا کوچه را در location.street قرار بده و هرگز آن را در location.neighborhood نگذار. نام شهر را هر جا در متن آمده استخراج کن و هرگز به دلیل نبودن نام استان آن را null نگذار. عبارت‌هایی مثل «نزدیک دریا»، «ویو دریا»، «دید کوه» و «شهرکی» ویژگی یا شرط ملک هستند، نه نام شهر؛ هرگز آن‌ها را در location.city قرار نده. اگر نام شهر گفته نشده، location.city=null بگذار. مثال: «تو تنکابن» یعنی location.city=«تنکابن»؛ «تو رامسر» یعنی location.city=«رامسر». اگر سادات‌شهر ذکر شد و شهر رامسر هم از متن یا زمینه روشن است، city را «رامسر» و neighborhood را «سادات‌شهر» بگذار؛ در غیر این صورت چیزی را حدس نزن. مدت اقامت را در stay.nights ثبت کن. «۳ شب» یعنی nights=3؛ «۳ شب و ۴ روز» یعنی nights=3؛ «برای ۴ روز» نیز معمولاً nights=3. تعداد شب را از متن استخراج کن اما تاریخ ورود و خروج را حدس نزن. برای اجاره کوتاه‌مدت اگر مدت اقامت مشخص است ولی تاریخ ورود و خروج مشخص نیست، checkInDate و checkOutDate را null بگذار و clarificationQuestion را با یک سؤال کوتاه درباره تاریخ ورود تنظیم کن. اگر اطلاعات لازم برای ادامه جست‌وجو ناقص است، نام فیلدهای مربوط را در missingInformation قرار بده.
«حدود ۳۰۰ متر» را با targetSqm=300 ثبت کن و minSqm و maxSqm را null بگذار، مگر بازه دقیق گفته شده باشد.
در requirements.nearSea فقط نزدیکی فیزیکی ملک به دریا یا ساحل را ثبت کن: «نزدیک دریا»، «نزدیک ساحل» و «پیاده تا ساحل» یعنی nearSea=true. اگر چنین شرطی گفته نشده، nearSea=null بگذار. «ویوی دریا» یا «چشم‌انداز دریا» به معنی requirements.hasView=true است و به‌تنهایی nearSea را true نکن؛ نزدیکی به دریا و چشم‌انداز دو شرط مستقل‌اند. اگر فقط نزدیکی به دریا گفته شده، hasView باید null باشد؛ اگر فقط چشم‌انداز دریا گفته شده، nearSea باید null باشد. فقط وقتی هر دو شرط صریحاً گفته شده‌اند، هر دو را true بگذار. اگر کاربر گفت «داخل شهر»، آن را به nearSea یا hasView تعبیر نکن.
شهر را اگر در متن ذکر شده استخراج کن. محله را فقط وقتی کاربر نام محله‌ای را گفته استخراج کن؛ نبودن محله به‌تنهایی اطلاعات ناقص نیست و نباید در missingInformation قرار بگیرد. location.city را هم فقط وقتی واقعاً نام شهر از متن مشخص نیست در missingInformation قرار بده. برای «داخل شهر رامسر» city=«رامسر» ثبت کن و neighborhood را null بگذار.
intent را با توجه به کل جمله، نقش مشتری و قواعد بازار تعیین کن: buy یعنی خرید، sell یعنی فروش، rent یعنی اجاره گرفتن، lease_out یعنی اجاره دادن ملک خود، و exchange یعنی تهاتر/معاوضه. عبارت «ملک دارم» همراه با نرخ شبی/ماهی یعنی معمولاً lease_out؛ «ملک دارم» همراه با قیمت متری یا قیمت کل، یا پرسش «می‌خوام ببینم چند می‌ارزه» یعنی sell؛ نرخ شبی در درخواست ملک یعنی rent با rentalMode=short_term؛ نرخ ماهی در درخواست ملک یعنی rent با rentalMode=monthly. «تهاتر» و «معاوضه» یعنی exchange. در exchange، نوع ملک ارائه‌شده را در offeredPropertyType و نوع ملک درخواستی را در wantedPropertyType بگذار و propertyType را null قرار بده. برای سایر موارد مبهم حدس نزن. اگر فقط نوع ملک، شهر، ویو یا امکانات را گفته و قصد معامله روشن نیست، intent=null بگذار؛ هرگز به‌طور پیش‌فرض buy انتخاب نکن. وجود عبارت «می‌خوام» یا «می‌خواهم» به‌تنهایی به معنی خرید نیست. در این حالت «intent» را در missingInformation قرار بده و clarificationQuestion کوتاهی بپرس که آیا قصد خرید، فروش یا اجاره دارد.
بودجه کل را در maxTotalPriceRial و قیمت هر متر را فقط در maxPricePerSqmRial قرار بده.
برای اجاره کوتاه‌مدت، maxRentNightlyRial را استفاده کن. تاریخ ورود و خروج را با قالب YYYY-MM-DD و تعداد نفرات را در stay.guests ثبت کن. اگر مشخص نیستند null بگذار و در صورت نیاز نام فیلد را در missingInformation بیاور.
ساختار دقیق:
{
  "intent": null,
  "propertyType": null,
  "offeredPropertyType": null,
  "wantedPropertyType": null,
  "rentalMode": null,
  "location": { "province": null, "city": null, "neighborhood": null, "street": null },
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
  "features": [],
  "missingInformation": [],
  "clarificationQuestion": null
}
`.trim();

@Injectable()
export class AiService {
  async chat(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ) {
    // Keep a small, bounded conversational window for local models with limited context.
    // The client cannot inject a system role through history.
    const recentHistory = (Array.isArray(history) ? history : [])
      .filter(
        (item) =>
          item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string' &&
          item.content.trim().length > 0,
      )
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content.trim().slice(-1200),
      }));

    const data = await this.callOllama([
      { role: 'system', content: REAL_ESTATE_SYSTEM_PROMPT },
      ...recentHistory,
      { role: 'user', content: message },
    ]);

    return {
      reply: data.message?.content ?? '',
    };
  }

  async parseSearchRequest(
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<SearchRequestDto> {
    const recentHistory = (Array.isArray(history) ? history : [])
      .filter(
        (item) =>
          item &&
          (item.role === 'user' || item.role === 'assistant') &&
          typeof item.content === 'string' &&
          item.content.trim().length > 0,
      )
      .slice(-8)
      .map((item) => ({ role: item.role, content: item.content.trim().slice(-1200) }));

    const data = await this.callOllama(
      [
        { role: 'system', content: SEARCH_EXTRACTION_PROMPT },
        ...recentHistory,
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
        Array.isArray(parsed)
      ) {
        throw new Error('ساختار خروجی مدل معتبر نیست.');
      }

      // Treat model output as untrusted, incomplete data. Fill the API contract's
      // required shape before applying deterministic domain rules and validation.
      const parsedRecord = parsed as Record<string, unknown>;
      const asRecord = (value: unknown): Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
      const nullableString = (value: unknown): string | null =>
        typeof value === 'string' ? value : null;
      const nullableNumber = (value: unknown): number | null =>
        typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? value
          : null;
      const nullableBoolean = (value: unknown): boolean | null =>
        typeof value === 'boolean' ? value : null;
      const location = asRecord(parsedRecord.location);
      const area = asRecord(parsedRecord.area);
      const budget = asRecord(parsedRecord.budget);
      const rawRequirements = asRecord(parsedRecord.requirements);
      const rawStay = asRecord(parsedRecord.stay);
      const allowedPropertyTypes = ['land', 'apartment', 'villa', 'house'];
      const nullablePropertyType = (value: unknown): string | null =>
        typeof value === 'string' && allowedPropertyTypes.includes(value)
          ? value
          : null;
      const allowedIntents = ['buy', 'sell', 'rent', 'lease_out', 'exchange'];
      const nullableIntent = (value: unknown): string | null =>
        typeof value === 'string' && allowedIntents.includes(value)
          ? value
          : null;
      const allowedRentalModes = ['monthly', 'short_term'];
      const nullableRentalMode = (value: unknown): string | null =>
        typeof value === 'string' && allowedRentalModes.includes(value)
          ? value
          : null;
      const allowedDocumentTypes = [
        'six_dang',
        'three_dang',
        'single_page',
        'official',
        'end_user',
        'other',
        'unknown',
      ];
      const nullableDocumentType = (value: unknown): string | null =>
        typeof value === 'string' && allowedDocumentTypes.includes(value)
          ? value
          : null;
      const allowedDeedEras = ['pre_revolution', 'post_revolution', 'unknown'];
      const nullableDeedEra = (value: unknown): string | null =>
        typeof value === 'string' && allowedDeedEras.includes(value)
          ? value
          : null;
      const rawCheckInDate = rawStay.checkInDate;
      const rawCheckOutDate = rawStay.checkOutDate;
      const result = {
        ...parsedRecord,
        intent: nullableIntent(parsedRecord.intent),
        propertyType: nullablePropertyType(parsedRecord.propertyType),
        offeredPropertyType: nullablePropertyType(parsedRecord.offeredPropertyType),
        wantedPropertyType: nullablePropertyType(parsedRecord.wantedPropertyType),
        rentalMode: nullableRentalMode(parsedRecord.rentalMode),
        location: {
          province: nullableString(location.province),
          city: nullableString(location.city),
          neighborhood: nullableString(location.neighborhood),
          street: nullableString(location.street),
        },
        area: {
          targetSqm: nullableNumber(area.targetSqm),
          minSqm: nullableNumber(area.minSqm),
          maxSqm: nullableNumber(area.maxSqm),
        },
        budget: {
          maxTotalPriceRial: nullableNumber(budget.maxTotalPriceRial),
          maxPricePerSqmRial: nullableNumber(budget.maxPricePerSqmRial),
          maxDepositRial: nullableNumber(budget.maxDepositRial),
          maxRentMonthlyRial: nullableNumber(budget.maxRentMonthlyRial),
          maxRentNightlyRial: nullableNumber(budget.maxRentNightlyRial),
        },
        requirements: {
          bedrooms: nullableNumber(rawRequirements.bedrooms),
          documentType: nullableDocumentType(rawRequirements.documentType),
          landUse: nullableString(rawRequirements.landUse),
          nearSea: nullableBoolean(rawRequirements.nearSea),
          hasView: nullableBoolean(rawRequirements.hasView),
          isInTownship: nullableBoolean(rawRequirements.isInTownship),
          hasMountainView: nullableBoolean(rawRequirements.hasMountainView),
          hasSeaView: nullableBoolean(rawRequirements.hasSeaView),
          viewProtectionClaim: nullableBoolean(rawRequirements.viewProtectionClaim),
          deedEra: nullableDeedEra(rawRequirements.deedEra),
        },
        features: [] as Array<{ id: string; value: string | boolean | number | string[] }>,
        stay: {
          checkInDate:
            typeof rawCheckInDate === 'string' &&
            /^\\d{4}-\\d{2}-\\d{2}$/.test(rawCheckInDate)
              ? rawCheckInDate
              : null,
          checkOutDate:
            typeof rawCheckOutDate === 'string' &&
            /^\\d{4}-\\d{2}-\\d{2}$/.test(rawCheckOutDate)
              ? rawCheckOutDate
              : null,
          guests: nullableNumber(rawStay.guests),
          nights: nullableNumber(rawStay.nights),
        },
        missingInformation: Array.isArray(parsedRecord.missingInformation)
          ? parsedRecord.missingInformation.filter(
              (field): field is string => typeof field === 'string',
            )
          : [],
        clarificationQuestion: nullableString(parsedRecord.clarificationQuestion),
      } as {
        location: {
          city: string | null;
          neighborhood: string | null;
          street: string | null;
          province: string | null;
        };
        area: Record<string, unknown>;
        budget: Record<string, unknown>;
        requirements: Record<string, unknown>;
        stay: Record<string, unknown>;
        features: Array<{ id: string; value: string | boolean | number | string[] }>;
        intent: unknown;
        propertyType: unknown;
        offeredPropertyType: unknown;
        wantedPropertyType: unknown;
        rentalMode: unknown;
        missingInformation: unknown;
        clarificationQuestion: unknown;
      };

      // A property feature is not a city name. Some model outputs mistakenly
      // put phrases such as "نزدیک دریا" into location.city.
      if (
        result.location.city &&
        /نزدیک|دریا|ساحل|ویو|چشم\\s*انداز|کوه|شهرکی|خوابه/.test(
          result.location.city
            .replace(/[ي]/g, 'ی')
            .replace(/[ك]/g, 'ک')
            .replace(/‌/g, ' '),
        )
      ) {
        result.location.city = null;
      }

      // Use deterministic feature extraction so explicit user preferences are not lost
      // when the local model omits or mislabels the features array.
      result.features = resolveAccommodationFeaturesFromMessage(message);

      // A specific lodging category (e.g. swiss_cottage or hotel) is not an apartment.
      // Prefer a broad property type only when the user's wording explicitly supports it.
      const explicitPropertyType = resolvePropertyTypeFromMessage(message);
      const accommodationType = result.features.find(
        (feature) => feature.id === 'accommodation.type',
      )?.value;
      const specificLodgingTypes = new Set([
        'suite',
        'hotel',
        'motel',
        'forest_cottage',
        'swiss_cottage',
        'glass_cottage',
        'traditional_lodging',
        'eco_lodge',
        'rural_house',
      ]);
      const hasSpecificLodgingType =
        typeof accommodationType === 'string' &&
        specificLodgingTypes.has(accommodationType);

      if (explicitPropertyType !== null) {
        // Deterministic explicit wording beats a contradictory model classification.
        result.propertyType = explicitPropertyType;
      } else if (hasSpecificLodgingType) {
        // Keep the precise lodging category in features; do not invent "apartment".
        result.propertyType = null;
      }

      // Resolve high-confidence intent patterns from the original Persian message.
      // This keeps core domain rules deterministic and independently testable.
      const intentResolution = resolveIntentFromMessage(message);
      const landConstructionRequest = isLandForVillaConstructionRequest(message);
      const explicitIntent = intentResolution.intent ?? (landConstructionRequest ? 'buy' : null);
      if (explicitIntent !== null) result.intent = explicitIntent;
      else if (history.length === 0) result.intent = null;
      const effectiveIntent = explicitIntent ?? result.intent;

      // If sale is primary and exchange is only an alternative, the first property
      // type mentioned before the exchange clause is the property being sold.
      if (
        explicitIntent === 'sell' &&
        /(?:تهاتر|معاوضه)/.test(message) &&
        result.propertyType === null
      ) {
        const primaryListingText = message.split(/تهاتر|معاوضه/)[0];
        const primaryType = resolvePropertyTypeFromMessage(primaryListingText);
        if (primaryType !== null) result.propertyType = primaryType;
      }

      // Offered/wanted property types describe an exchange only. Never trust the
      // model to populate these fields for ordinary purchase, sale, or rental requests.
      if (effectiveIntent !== 'exchange') {
        result.offeredPropertyType = null;
        result.wantedPropertyType = null;
      } else {
        const exchangeTypes = resolveExchangePropertyTypesFromMessage(message);
        if (exchangeTypes !== null) {
          result.offeredPropertyType = exchangeTypes.offeredPropertyType;
          result.wantedPropertyType = exchangeTypes.wantedPropertyType;
        }
      }

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

      if (effectiveIntent !== 'rent' && effectiveIntent !== 'lease_out') {
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
      // A follow-up may rely on a duration from earlier user messages. Without history,
      // discard model-invented durations; explicit current-message durations always win.
      if (resolvedNights !== null) result.stay.nights = resolvedNights;
      else if (history.length === 0 || explicitIntent === 'buy' || explicitIntent === 'sell') result.stay.nights = null;

      // Resolve Solar Hijri dates from the original message; do not trust a
      // model-generated Gregorian date when the user explicitly gave a Persian date.
      const resolvedCheckInDate = resolveSolarHijriCheckInDateFromMessage(message);
      if (resolvedCheckInDate !== null) {
        result.stay.checkInDate = resolvedCheckInDate;
      }

      // If both dates were explicitly stated or reliably extracted, derive the
      // duration from the date range; otherwise leave nights unknown.
      if (
        resolvedNights === null &&
        typeof result.stay.checkInDate === 'string' &&
        typeof result.stay.checkOutDate === 'string'
      ) {
        const start = Date.parse(`${result.stay.checkInDate}T00:00:00Z`);
        const end = Date.parse(`${result.stay.checkOutDate}T00:00:00Z`);
        result.stay.nights =
          Number.isFinite(start) && Number.isFinite(end) && end > start
            ? Math.round((end - start) / (24 * 60 * 60 * 1000))
            : null;
      }

      // A known check-in date plus an explicit number of nights fully determines
      // check-out. Never ask the user for a date they have already implied.
      if (
        typeof result.stay.checkInDate === 'string' &&
        Number.isFinite(Date.parse(result.stay.checkInDate + 'T00:00:00Z')) &&
        result.stay.checkInDate.length === 10 &&
        typeof result.stay.nights === 'number' &&
        Number.isInteger(result.stay.nights) &&
        result.stay.nights >= 0
      ) {
        const checkInTimestamp = Date.parse(`${result.stay.checkInDate}T00:00:00Z`);
        if (Number.isFinite(checkInTimestamp)) {
          result.stay.checkOutDate = new Date(
            checkInTimestamp + result.stay.nights * 24 * 60 * 60 * 1000,
          ).toISOString().slice(0, 10);
        }
      }
      if (
        result.stay.checkInDate != null &&
        result.stay.checkOutDate != null &&
        typeof result.clarificationQuestion === 'string' &&
        (result.clarificationQuestion.includes('تاریخ خروج') ||
          result.clarificationQuestion.includes('تاریخ ورود') ||
          result.clarificationQuestion.includes('خروج را مشخص') ||
          result.clarificationQuestion.includes('ورود را مشخص'))
      ) {
        result.clarificationQuestion = null;
      }
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

      // A specific accommodation type can satisfy the lodging-category requirement
      // even when the broad propertyType intentionally remains null.
      const hasAccommodationType = result.features.some(
        (feature) =>
          feature.id === 'accommodation.type' &&
          typeof feature.value === 'string',
      );
      if (hasAccommodationType) {
        actionableMissing = actionableMissing.filter((field) => field !== 'propertyType');
      }

      // Drop model-suggested missing fields that deterministic rules have now resolved.
      if (result.stay?.checkInDate != null) {
        actionableMissing = actionableMissing.filter((field) => field !== 'stay.checkInDate');
      }
      if (result.stay?.checkOutDate != null) {
        actionableMissing = actionableMissing.filter((field) => field !== 'stay.checkOutDate');
      }
      if (result.stay?.guests != null) {
        actionableMissing = actionableMissing.filter((field) => field !== 'stay.guests');
      }

      if (explicitIntent === null && !actionableMissing.includes('intent')) {
        actionableMissing.push('intent');
      }
      if (result.location?.city == null && !actionableMissing.includes('location.city')) {
        actionableMissing.push('location.city');
      }
      if (
        explicitIntent !== 'exchange' &&
        result.propertyType == null &&
        !hasAccommodationType &&
        !actionableMissing.includes('propertyType')
      ) {
        actionableMissing.push('propertyType');
      }
      if (explicitIntent === 'rent' && result.rentalMode === 'short_term') {
        for (const field of ['stay.checkInDate', 'stay.checkOutDate', 'stay.guests']) {
          const key = field.split('.')[1];
          const checkoutDerivable =
            key === 'checkOutDate' &&
            result.stay?.checkInDate != null &&
            typeof result.stay?.nights === 'number';
          if (
            result.stay?.[key] == null &&
            !checkoutDerivable &&
            !actionableMissing.includes(field)
          ) {
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

      // "Single-page deed" is not the same as a three-dang deed.
      const normalizedDocumentText = message
        .replace(/[ي]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/[‌\u200c]/g, ' ')
        .replace(/\s+/g, ' ');
      if (/سند\s*تک\s*برگ|تک\s*برگ\s*(?:سند)?/.test(normalizedDocumentText)) {
        result.requirements.documentType = 'single_page';
      }
      // A negative requirement must not be stored as a positive agricultural-use filter.
      if (/(?:کاربری\s*کشاورزی|کشاورزی).{0,12}(?:نباشه|نباشد|نمی\s*خوام|نمی\s*خواهم|نبودن)/.test(
        message.replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').replace(/‌/g, ' '),
      )) {
        result.requirements.landUse = null;
      }

      // Use deterministic property type extraction when the model leaves a single explicit type blank.
      // Exchange is excluded because its offered and wanted property types are handled separately.
      if (explicitIntent !== 'exchange' && result.propertyType == null) {
        const propertyType = resolvePropertyTypeFromMessage(message);
        if (propertyType !== null) result.propertyType = propertyType;
      }

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
      // Never trust the model for a per-square-metre price unless the original
      // message contains an explicit monetary amount tied to "متری".
      if (pricePerSqmToman !== null) result.budget.maxPricePerSqmRial = pricePerSqmToman;
      else if (history.length === 0 || explicitIntent === 'buy' || explicitIntent === 'sell') result.budget.maxPricePerSqmRial = null;

      // Explicit values in the current message override prior context. Otherwise the
      // model may preserve a budget from earlier user messages in the same search.
      const rentalBudget = resolveRentalBudgetTomanFromMessage(message);
      if (rentalBudget !== null) {
        result.budget.maxRentNightlyRial = null;
        result.budget.maxRentMonthlyRial = null;
        result.rentalMode = rentalBudget.mode;
        if (rentalBudget.mode === 'short_term') {
          result.budget.maxRentNightlyRial = rentalBudget.amountToman;
        } else {
          result.budget.maxRentMonthlyRial = rentalBudget.amountToman;
        }
        if (
          (intentResolution.intent === 'rent' || intentResolution.intent === 'lease_out') &&
          !/(?:قیمت\s*(?:کل|فروش)|قیمت\s*ملک|ارزش\s*کل|جمعاً|می\s*فروشم)/.test(message)
        ) {
          result.budget.maxTotalPriceRial = null;
        }
      }

      // Distinguish a rental deposit from the total purchase price.
      const depositToman = resolveDepositBudgetTomanFromMessage(message);
      if (depositToman !== null) {
        result.budget.maxDepositRial = depositToman;
        if (!/(?:قیمت\s*(?:کل|فروش)|قیمت\s*ملک|ارزش\s*کل|جمعاً)/.test(message)) {
          result.budget.maxTotalPriceRial = null;
        }
      }

      // Bare "۵ تومن" attached to a sale price has no reliable scale. Ask rather
      // than silently interpreting it as five million or five billion Toman.
      if (
        /(?:قیمت(?:ش)?|قیمت\s*کل|می\s*فروشم|می\s*ارزه)\s*\d+(?:[.,]\d+)?\s*(?:تومن|تومان)(?!\s*(?:میلیون|میلیارد|هزار))/.test(
          message.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))),
        )
      ) {
        result.budget.maxTotalPriceRial = null;
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
      normalizeLocationFromOsm(result, message);

      return validateSearchRequest(result);
    } catch (error) {
      console.error('parseSearchRequest error:', error);

      throw new ServiceUnavailableException(
        'مدل نتوانست درخواست را به ساختار استاندارد تبدیل کند. متن درخواست را ساده‌تر کن و دوباره امتحان کن.',
      );
    }
  }

  private async callOllama(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
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
