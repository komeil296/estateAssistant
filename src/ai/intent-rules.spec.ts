import {
  isLandForVillaConstructionRequest,
  resolveIntentFromMessage,
  resolveNightsFromMessage,
  resolvePricePerSqmTomanFromMessage,
} from './intent-rules';

describe('resolveIntentFromMessage', () => {
  it.each([
    ['یه ویلا می‌خوام، شبی ۵ تومن هم می‌تونم بدم', 'rent', 'short_term'],
    ['یه ویلا می‌خوام، ماهی ۳۰ میلیون می‌تونم بدم', 'rent', 'monthly'],
    ['یه ویلا دارم، شبی ۸ میلیون', 'lease_out', 'short_term'],
    ['یه ویلا دارم، ماهی ۳۰ میلیون', 'lease_out', 'monthly'],
    ['زمین دارم، متری ۲۰ میلیون', 'sell', null],
    ['زمین دارم، می‌خوام ببینم چند می‌ارزه', null, null],\n    ['یه زمین برای ساخت ویلا می‌خوام', 'buy', null],
    ['دنبال خرید یه ویلا هستم', 'buy', null],
    ['یه ویلا می‌خوام بگیرم، ۸ میلیارد هم دارم', 'buy', null],
    ['یه ویلا دارم، می‌خوام تهاتر کنم با آپارتمان', 'exchange', null],
    ['برای ۴ روز یه ویلا می‌خوام', 'rent', 'short_term'],
    ['یه ویلا با ویوی دریا تو رامسر می‌خوام', null, null],
  ] as const)('%s', (message, intent, rentalMode) => {
    expect(resolveIntentFromMessage(message)).toEqual({ intent, rentalMode });
  });
});


describe('resolveNightsFromMessage', () => {
  it.each([
    ['برای ۴ روز یه ویلا می‌خوام', 3],
    ['برای 4 روز ویلا می‌خوام', 3],
    ['۳ شب و ۴ روز', 3],
    ['برای سه شب ویلا می‌خوام', 3],
    ['برای ۴ شب ویلا می‌خوام', 4],
  ])('%s', (message, nights) => {
    expect(resolveNightsFromMessage(message)).toBe(nights);
  });
});


describe('resolvePricePerSqmTomanFromMessage', () => {
  it.each([
    ['زمین دارم، متری ۲۰ میلیون', 20_000_000],
    ['زمین متری 2 میلیارد', 2_000_000_000],
    ['زمین دارم', null],
  ])('%s', (message, expected) => {
    expect(resolvePricePerSqmTomanFromMessage(message)).toBe(expected);
  });
});

describe('isLandForVillaConstructionRequest', () => {
  it('recognizes land requested for building a villa', () => {
    expect(isLandForVillaConstructionRequest('یه زمین برای ساخت ویلا می‌خوام')).toBe(true);
  });

  it('does not match unrelated land messages', () => {
    expect(isLandForVillaConstructionRequest('زمین دارم، متری ۲۰ میلیون')).toBe(false);
  });
});
