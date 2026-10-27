import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  SearchRequestDto,
  validateSearchRequest,
} from './dto/search-request.dto';

const REAL_ESTATE_SYSTEM_PROMPT = `
تو یک دستیار فارسی‌زبان برای پیدا کردن و اجاره اقامتگاه در ایران هستی.

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
intent: buy, sell, rent, lease_out
propertyType: land, apartment, villa، یا null
rentalMode: monthly, short_term، یا null
documentType: six_dang, three_dang, official, end_user, other, unknown، یا null
برای استخراج قیمت، همه مبالغ را ابتدا به عدد صحیح «تومان» تبدیل کن؛ حتی اگر کاربر ریال گفته، آن را به تومان تبدیل کن. در این خروجی موقت، مقدار فیلدهای budget را به تومان بنویس، نه ریال. کد سرور بعد از دریافت خروجی، همه مقادیر غیر null بخش budget را به ریال تبدیل می‌کند. برای مثال «۱۰ میلیارد تومان» باید در maxTotalPriceRial به‌صورت عدد 10000000000 نوشته شود؛ سرور آن را در ۱۰ ضرب می‌کند.
استان، شهر و محله را از هم جدا نگه دار. نام شهر را هر جا در متن آمده استخراج کن و هرگز به دلیل نبودن نام استان آن را null نگذار. مثال: «تو تنکابن» یعنی location.city=«تنکابن»؛ «تو رامسر» یعنی location.city=«رامسر». اگر سادات‌شهر ذکر شد و شهر رامسر هم از متن یا زمینه روشن است، city را «رامسر» و neighborhood را «سادات‌شهر» بگذار؛ در غیر این صورت چیزی را حدس نزن. برای اجاره کوتاه‌مدت اگر مدت اقامت مثل ۳ شب مشخص است ولی تاریخ ورود و خروج مشخص نیست، checkInDate و checkOutDate را null بگذار و clarificationQuestion را با یک سؤال کوتاه درباره تاریخ ورود تنظیم کن. اگر اطلاعات لازم برای ادامه جست‌وجو ناقص است، نام فیلدهای مربوط را در missingInformation قرار بده.
«حدود ۳۰۰ متر» را با targetSqm=300 ثبت کن و minSqm و maxSqm را null بگذار، مگر بازه دقیق گفته شده باشد.
بودجه کل را در maxTotalPriceRial و قیمت هر متر را فقط در maxPricePerSqmRial قرار بده.
برای اجاره کوتاه‌مدت، maxRentNightlyRial را استفاده کن. تاریخ ورود و خروج را با قالب YYYY-MM-DD و تعداد نفرات را در stay.guests ثبت کن. اگر مشخص نیستند null بگذار و در صورت نیاز نام فیلد را در missingInformation بیاور.
ساختار دقیق:
{
  "intent": "buy",
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
      };
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
    } catch {
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
