import { resolveIntentFromMessage } from './intent-rules';

describe('resolveIntentFromMessage', () => {
  it.each([
    ['یه ویلا می‌خوام، شبی ۵ تومن هم می‌تونم بدم', 'rent', 'short_term'],
    ['یه ویلا می‌خوام، ماهی ۳۰ میلیون می‌تونم بدم', 'rent', 'monthly'],
    ['یه ویلا دارم، شبی ۸ میلیون', 'lease_out', 'short_term'],
    ['یه ویلا دارم، ماهی ۳۰ میلیون', 'lease_out', 'monthly'],
    ['زمین دارم، متری ۲۰ میلیون', 'sell', null],
    ['زمین دارم، می‌خوام ببینم چند می‌ارزه', 'sell', null],
    ['دنبال خرید یه ویلا هستم', 'buy', null],
    ['یه ویلا می‌خوام بگیرم، ۸ میلیارد هم دارم', 'buy', null],
    ['یه ویلا دارم، می‌خوام تهاتر کنم با آپارتمان', 'exchange', null],
    ['برای ۴ روز یه ویلا می‌خوام', 'rent', 'short_term'],
    ['یه ویلا با ویوی دریا تو رامسر می‌خوام', null, null],
  ] as const)('%s', (message, intent, rentalMode) => {
    expect(resolveIntentFromMessage(message)).toEqual({ intent, rentalMode });
  });
});
