import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

const REAL_ESTATE_SYSTEM_PROMPT = `
تو یک دستیار فارسی‌زبان برای پیدا کردن و اجاره اقامتگاه در ایران هستی.

قواعد پاسخ‌گویی:
- فقط فارسی روان، طبیعی و ساده بنویس. از واژه‌های نامأنوس و ترجمه‌های تحت‌اللفظی پرهیز کن.
- منظور کاربر را دقیق رعایت کن: «دریا» با «دریاچه» فرق دارد؛ این دو را جایگزین هم نکن.
- پاسخ را کوتاه و کاربردی نگه دار. معمولاً ۲ تا ۴ جمله کافی است.
- اگر کاربر برای اجاره اقامتگاه درخواست داد، اطلاعاتی را که خودش گفته دوباره نپرس.
- فقط مهم‌ترین اطلاعاتِ هنوز نامشخص را بپرس؛ در هر نوبت حداکثر دو سؤال.
- برای جست‌وجوی مناسب معمولاً مقصد یا شهر، تاریخ ورود و خروج، تعداد نفرات و بودجه مهم‌اند. اگر بعضی از این موارد معلوم نیستند، مرحله‌ای بپرس.
- اگر کاربر هنوز تاریخ مشخصی ندارد، لازم نیست همه جزئیات را یک‌باره بپرسی.
- ادعا نکن که اقامتگاه واقعی پیدا کرده‌ای، موجودی را بررسی کرده‌ای یا رزرو انجام داده‌ای، مگر ابزار مربوطه واقعاً این کار را انجام داده باشد.
- اگر درخواست مبهم است، با یک سؤال روشن‌کننده شروع کن؛ کاربر را بابت فارسی یا نگارش متن سرزنش نکن.
- هیچ‌وقت درباره امکانات، قیمت یا موجودی یک اقامتگاه مشخص حدس نزن.
`.trim();

@Injectable()
export class AiService {
  async chat(message: string) {
    let response: Response;

    try {
      response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'persian-realtor',
          messages: [
            { role: 'system', content: REAL_ESTATE_SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          stream: false,
          options: {
            temperature: 0.2,
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

    const data: { message?: { content?: string } } = await response.json();

    return {
      reply: data.message?.content ?? '',
    };
  }
}
