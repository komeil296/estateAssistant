import {
  isLandForVillaConstructionRequest,
  resolveIntentFromMessage,
  resolveNightsFromMessage,
  resolvePricePerSqmTomanFromMessage,
  resolveRentalBudgetTomanFromMessage,
  resolveDepositBudgetTomanFromMessage,
  resolvePropertyTermsFromMessage,
  resolvePropertyTypeFromMessage,
} from './intent-rules';

describe('resolveIntentFromMessage', () => {
  it.each([
    ['یه ویلا می‌خوام، شبی ۵ تومن هم می‌تونم بدم', 'rent', 'short_term'],
    ['یه ویلا می‌خوام، ماهی ۳۰ میلیون می‌تونم بدم', 'rent', 'monthly'],
    ['یه ویلا دارم، شبی ۸ میلیون', 'lease_out', 'short_term'],
    ['یه ویلا دارم، ماهی ۳۰ میلیون', 'lease_out', 'monthly'],
    ['زمین دارم، متری ۲۰ میلیون', 'sell', null],
    ['زمین دارم، می‌خوام ببینم چند می‌ارزه', null, null],
    ['یه زمین برای ساخت ویلا می‌خوام', 'buy', null],
    ['دنبال خرید یه ویلا هستم', 'buy', null],
    ['یه ویلا می‌خوام بگیرم، ۸ میلیارد هم دارم', 'buy', null],
    ['یه ویلا دارم، می‌خوام تهاتر کنم با آپارتمان', 'exchange', null],
    ['برای ۴ روز یه ویلا می‌خوام', 'rent', 'short_term'],
    ['یه کلبه سوئیسی برای دو شب تو رامسر می‌خوام', 'rent', 'short_term'],
    ['یه ویلا برای سه شب می‌خوام بخرم', 'buy', null],
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
    ['زمین دارم، متری یک و نیم میلیارد', 1_500_000_000],
    ['زمین دارم', null],
    ['یه آپارتمان ۱۲۰ متری دارم، برای فروش', null],
    ['یه آپارتمان ۱۰۰ متری برای فروش دارم', null],
    ['زمین دارم، متری ۲۰ تومن', 20_000_000],
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


describe('resolveRentalBudgetTomanFromMessage', () => {
  it.each([
    ['یه ویلا می‌خوام، شبی ۵ میلیون هم می‌تونم بدم', { mode: 'short_term', amountToman: 5_000_000 }],
    ['یه ویلا می‌خوام، ماهی ۳۰ میلیون بودجه دارم', { mode: 'monthly', amountToman: 30_000_000 }],
    ['یه ویلا برای اجاره می‌خوام، ماهی سی تومن', { mode: 'monthly', amountToman: 30_000_000 }],
    ['یه ویلا می‌خوام، شبی ۵ تومن', { mode: 'short_term', amountToman: 5_000_000 }],
    ['یه ویلا می‌خوام', null],
  ] as const)('%s', (message, expected) => {
    expect(resolveRentalBudgetTomanFromMessage(message)).toEqual(expected);
  });
});


describe('resolveDepositBudgetTomanFromMessage', () => {
  it.each([
    ['یه آپارتمان دارم، رهن کامل ۲ میلیارد تومن', 2_000_000_000],
    ['رهن ۵۰۰ میلیون تومان، ماهی ۱۵ میلیون اجاره', 500_000_000],
    ['رهن کامل ۲', null],
  ] as const)('%s', (message, expected) => {
    expect(resolveDepositBudgetTomanFromMessage(message)).toBe(expected);
  });
});

describe('resolvePropertyTypeFromMessage', () => {
  it.each([
    ['یه خونه تو تنکابن می‌خوام', 'house'],
    ['یه زمین دارم، متری ۲۰ میلیون', 'land'],
    ['زمین دارم، متری ۲ میلیارد', 'land'],
    ['ویلای من رو برای تعطیلات نوروز شبی ۱۰ میلیون اجاره بده', 'villa'],
    ['یه ویلا با ویو ابدی می‌خوام', 'villa'],
    ['یه زمین برای ساخت ویلا می‌خوام', 'land'],
    ['ملک می‌خوام', null],
    ['زمین و ویلا می‌خوام', null],
  ] as const)('%s', (message, expected) => {
    expect(resolvePropertyTypeFromMessage(message)).toBe(expected);
  });
});

describe('resolvePropertyTermsFromMessage', () => {
  it.each([
    ['زمین شهرکی می‌خوام', { isInTownship: true, hasMountainView: null, hasSeaView: null, viewProtectionClaim: null, deedEra: null }],
    ['ویلای شهرکی با ویو ابدی کوه و دریا', { isInTownship: true, hasMountainView: true, hasSeaView: true, viewProtectionClaim: true, deedEra: null }],
    ['ویلای شهرکی با ویو ابدی دریا و کوه، سند شاهنشاهی', { isInTownship: true, hasMountainView: true, hasSeaView: true, viewProtectionClaim: true, deedEra: 'pre_revolution' }],
    ['سند شاهنشاهی دارد', { isInTownship: null, hasMountainView: null, hasSeaView: null, viewProtectionClaim: null, deedEra: 'pre_revolution' }],
    ['یه آپارتمان با چشم‌انداز دریا', { isInTownship: null, hasMountainView: null, hasSeaView: true, viewProtectionClaim: null, deedEra: null }],
    ['ویلای معمولی', { isInTownship: null, hasMountainView: null, hasSeaView: null, viewProtectionClaim: null, deedEra: null }],
  ])('%s', (message, expected) => {
    expect(resolvePropertyTermsFromMessage(message)).toEqual(expected);
  });
});

describe('lease-out direction phrases', () => {
  it('recognizes an instruction to advertise the owner’s villa for rent', () => {
    expect(resolveIntentFromMessage('ویلای من رو برای تعطیلات نوروز شبی ۱۰ میلیون اجاره بده')).toEqual({
      intent: 'lease_out',
      rentalMode: 'short_term',
    });
  });
});
