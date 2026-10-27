import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  SearchRequestDto,
  validateSearchRequest,
} from './dto/search-request.dto';

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
intent: buy, sell, rent, lease_out، یا null
propertyType: land, apartment, villa، یا null
rentalMode: monthly, short_term، یا null
documentType: six_dang, three_dang, official, end_user, other, unknown، یا null
برای استخراج قیمت، همه مبالغ را ابتدا به عدد صحیح «تومان» تبدیل کن؛ حتی اگر کاربر ریال گفته، آن را به تومان تبدیل کن. در این خروجی موقت، مقدار فیلدهای budget را به تومان بنویس، نه ریال. کد سرور بعد از دریافت خروجی، همه مقادیر غیر null بخش budget را به ریال تبدیل می‌کند. برای مثال «۱۰ میلیارد تومان» باید در maxTotalPriceRial به‌صورت عدد 10000000000 نوشته شود؛ سرور آن را در ۱۰ ضرب می‌کند.
استان، شهر و محله را از هم جدا نگه دار. نام شهر را هر جا در متن آمده استخراج کن و هرگز به دلیل نبودن نام استان آن را null نگذار. مثال: «تو تنکابن» یعنی location.city=«تنکابن»؛ «تو رامسر» یعنی location.city=«رامسر». اگر سادات‌شهر ذکر شد و شهر رامسر هم از متن یا زمینه روشن است، city را «رامسر» و neighborhood را «سادات‌شهر» بگذار؛ در غیر این صورت چیزی را حدس نزن. برای اجاره کوتاه‌مدت اگر مدت اقامت مثل ۳ شب مشخص است ولی تاریخ ورود و خروج مشخص نیست، checkInDate و checkOutDate را null بگذار و clarificationQuestion را با یک سؤال کوتاه درباره تاریخ ورود تنظیم کن. اگر اطلاعات لازم برای ادامه جست‌وجو ناقص است، نام فیلدهای مربوط را در missingInformation قرار بده.
«حدود ۳۰۰ متر» را با targetSqm=300 ثبت کن و minSqm و maxSqm را null بگذار، مگر بازه دقیق گفته شده باشد.
در requirements.nearSea فقط نزدیکی فیزیکی ملک به دریا یا ساحل را ثبت کن: «نزدیک دریا»، «نزدیک ساحل» و «پیاده تا ساحل» یعنی nearSea=true. اگر چنین شرطی گفته نشده، nearSea=null بگذار. «ویوی دریا» یا «چشم‌انداز دریا» به معنی requirements.hasView=true است و به‌تنهایی nearSea را true نکن؛ نزدیکی به دریا و چشم‌انداز دو شرط مستقل‌اند. اگر فقط نزدیکی به دریا گفته شده، hasView باید null باشد؛ اگر فقط چشم‌انداز دریا گفته شده، nearSea باید null باشد. فقط وقتی هر دو شرط صریحاً گفته شده‌اند، هر دو را true بگذار. اگر کاربر گفت «داخل شهر»، آن را به nearSea یا hasView تعبیر نکن.
شهر را اگر در متن ذکر شده استخراج کن. محله را فقط وقتی کاربر نام محله‌ای را گفته استخراج کن؛ نبودن محله به‌تنهایی اطلاعات ناقص نیست و نباید در missingInformation قرار بگیرد. location.city را هم فقط وقتی واقعاً نام شهر از متن مشخص نیست در missingInformation قرار بده. برای «داخل شهر رامسر» city=«رامسر» ثبت کن و neighborhood را null بگذار.
intent را فقط بر اساس قصد معامله‌ای که کاربر صریحاً بیان کرده تعیین کن: buy یعنی کاربر می‌خواهد ملک بخرد، sell یعنی می‌خواهد ملک خودش را بفروشد، rent یعنی می‌خواهد ملکی را اجاره کند، و lease_out یعنی می‌خواهد ملک خودش را اجاره بدهد. اگر فقط نوع ملک، شهر، ویو یا امکانات را گفته و قصد معامله روشن نیست، intent=null بگذار؛ هرگز به‌طور پیش‌فرض buy انتخاب نکن. در این حالت «intent» را در missingInformation قرار بده و clarificationQuestion کوتاهی بپرس که آیا قصد خرید، فروش یا اجاره دارد.
بودجه کل را در maxTotalPriceRial و قیمت هر متر را فقط در maxPricePerSqmRial قرار بده.
برای اجاره کوتاه‌مدت، maxRentNightlyRial را استفاده کن. تاریخ ورود و خروج را با قالب YYYY-MM-DD و تعداد نفرات را در stay.guests ثبت کن. اگر مشخص نیستند null بگذار و در صورت نیاز نام فیلد را در missingInformation بیاور.
ساختار دقیق:
{
  "intent": null,
  "propertyType": null,
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
    "hasView": null
  },
  "stay": {
    "checkInDate": null,
    "checkOutDate": null,
    "guests": null
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
        budget: Record<string, unknown>;
        requirements?: Record<string, unknown>;
        intent?: unknown;
        missingInformation?: unknown;
        clarificationQuestion?: unknown;
      };

      // Do not let the model infer a transaction type from a property description.
      // Resolve clear intent from the original user message; otherwise ask a question.
      const normalizedIntentMessage = message
        .replace(/[ي]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/‌/g, ' ')
        .toLowerCase();

      const explicitIntent: 'buy' | 'sell' | 'rent' | 'lease_out' | null =
        /(?:اجاره\s*(?:بدهم|بدم|بدهیم|بدیم|بدھم)|اجاره\s*دادن|مستأجر\s*(?:می‌خواهم|میخوام))/.test(normalizedIntentMessage)
          ? 'lease_out'
          : /(?:بفروشم|بفروشیم|برای\s*فروش|قصد\s*فروش|فروش\s*ملک)/.test(normalizedIntentMessage)
            ? 'sell'
            : /(?:بخرم|بخریم|برای\s*خرید|قصد\s*خرید|خرید\s*ملک)/.test(normalizedIntentMessage)
              ? 'buy'
              : /(?:اجاره\s*(?:کنم|بگیرم|بگیریم)|اجاره\s*ماهانه|اجاره\s*کوتاه.?مدت|اجاره\s*روزانه|اقامت\s*برای\s*\d+\s*شب|برای\s*\d+\s*شب|شبی\s*حداکثر)/.test(normalizedIntentMessage)
                ? 'rent'
                : null;

      result.intent = explicitIntent;
      if (!Array.isArray(result.missingInformation)) {
        result.missingInformation = [];
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

        result.requirements.nearSea = mentionsNearSea ? true : null;
        result.requirements.hasView = mentionsSeaView ? true : null;
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
