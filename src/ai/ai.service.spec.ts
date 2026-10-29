import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves a for-sale villa request as a purchase and keeps the 5-billion-Toman budget', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'villa',
      offeredPropertyType: null,
      wantedPropertyType: null,
      rentalMode: null,
      location: { province: 'مازندران', city: 'رامسر', neighborhood: null, street: null },
      area: { targetSqm: null, minSqm: null, maxSqm: null },
      budget: {
        maxTotalPriceRial: 5000000000,
        maxPricePerSqmRial: null,
        maxDepositRial: null,
        maxRentMonthlyRial: null,
        maxRentNightlyRial: null,
      },
      requirements: {
        bedrooms: null, documentType: null, landUse: null, nearSea: null,
        hasView: null, isInTownship: null, hasMountainView: null,
        hasSeaView: null, viewProtectionClaim: null, deedEra: null,
      },
      stay: { checkInDate: null, checkOutDate: null, guests: null, nights: null },
      features: [],
      missingInformation: ['intent'],
      clarificationQuestion: 'قصد خرید، فروش یا اجاره دارید؟',
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest(
      'یه ویلای فروشی تو رامسر تا ۵ میلیارد تومان می‌خوام',
    );

    expect(result.intent).toBe('buy');
    expect(result.propertyType).toBe('villa');
    expect(result.location.city).toBe('رامسر');
    expect(result.budget.maxTotalPriceRial).toBe(50_000_000_000);
    expect(result.missingInformation).not.toContain('intent');
    expect(result.clarificationQuestion).not.toBe('قصد خرید، فروش یا اجاره دارید؟');
  });

  it('normalizes an incomplete model response for a villa near the sea', async () => {
    const modelOutput = {
      intent: 'buy',
      propertyType: 'villa',
      location: { city: 'نزدیک دریا' },
      requirements: { nearSea: true },
      missingInformation: ['province', 'neighborhood'],
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه ویلا می‌خوام نزدیک دریا.');

    expect(result.intent).toBeNull();
    expect(result.propertyType).toBe('villa');
    expect(result.location.city).toBeNull();
    expect(result.requirements.nearSea).toBe(true);
    expect(result.budget.maxTotalPriceRial).toBeNull();
    expect(result.area.targetSqm).toBeNull();
    expect(result.stay.nights).toBeNull();
  });

  it('does not turn the area of a listing into a per-square-metre price', async () => {
    const modelOutput = {
      intent: 'sell',
      propertyType: 'apartment',
      location: { province: null, city: 'رامسر', neighborhood: null },
      area: { targetSqm: 120, minSqm: null, maxSqm: null },
      budget: { maxTotalPriceRial: null, maxPricePerSqmRial: 120 },
      requirements: {},
      stay: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه آپارتمان ۱۲۰ متری تو رامسر دارم، برای فروش');

    expect(result.area.targetSqm).toBe(120);
    expect(result.budget.maxPricePerSqmRial).toBeNull();
  });

  it('separates a full rental deposit from the total property price', async () => {
    const modelOutput = {
      intent: 'sell',
      propertyType: 'apartment',
      location: { province: null, city: null, neighborhood: null },
      budget: { maxTotalPriceRial: 2000000000, maxDepositRial: null },
      requirements: {},
      stay: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه آپارتمان دارم، رهن کامل ۲ میلیارد تومن');

    expect(result.budget.maxDepositRial).toBe(20_000_000_000);
    expect(result.budget.maxTotalPriceRial).toBeNull();
    expect(result.intent).toBe('lease_out');
  });

  it('keeps the listed property type when exchange is only an alternative to sale', async () => {
    const modelOutput = {
      intent: 'exchange',
      propertyType: null,
      offeredPropertyType: null,
      wantedPropertyType: null,
      location: { province: null, city: 'رامسر', neighborhood: null },
      area: { targetSqm: 200, minSqm: null, maxSqm: null },
      requirements: { bedrooms: 3 },
      budget: { maxTotalPriceRial: 15000000000 },
      stay: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest(
      'یه ویلای ۲۰۰ متری تو رامسر دارم، سه خواب، قیمت فروش ۱۵ میلیارد؛ اگر تهاتر با آپارتمان هم بشه بررسی می‌کنم',
    );

    expect(result.intent).toBe('sell');
    expect(result.propertyType).toBe('villa');
    expect(result.offeredPropertyType).toBeNull();
    expect(result.wantedPropertyType).toBeNull();
  });

  it('does not treat a negative agricultural-use condition as a positive filter', async () => {
    const modelOutput = {
      intent: 'buy',
      propertyType: 'land',
      location: { province: null, city: null, neighborhood: null },
      requirements: { landUse: 'agricultural', documentType: 'three_dang' },
      stay: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('زمین می‌خوام که سند تک‌برگ داشته باشه و کاربری کشاورزی نباشه');

    expect(result.requirements.landUse).toBeNull();
    expect(result.requirements.documentType).toBe('single_page');
  });

  it('does not invent a seven-night stay for the phrase آخر هفته', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'villa',
      location: { province: null, city: null, neighborhood: null },
      stay: { checkInDate: null, checkOutDate: null, guests: 10, nights: 7 },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('برای آخر هفته ویلا می‌خوام، ما ۸ بزرگسال و ۲ بچه هستیم');

    expect(result.stay.nights).toBeNull();
  });

  it('does not classify a Swiss cottage as an apartment when the model mislabels it', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'apartment',
      location: { province: null, city: 'رامسر', neighborhood: null },
      requirements: {},
      missingInformation: ['propertyType'],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه کلبه سوئیسی استخردار تو رامسر می‌خوام');

    expect(result.propertyType).toBeNull();
    expect(result.features).toContainEqual({
      id: 'accommodation.type',
      value: 'swiss_cottage',
    });
    expect(result.missingInformation).not.toContain('propertyType');
  });

  it('keeps a boulevard in location.street instead of neighborhood', async () => {
    const modelOutput = {
      intent: 'buy',
      propertyType: 'land',
      location: { province: null, city: 'رامسر', neighborhood: null, street: null },
      area: { targetSqm: null, minSqm: 300, maxSqm: 400 },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest(
      'زمین مسکونی بین ۳۰۰ تا ۴۰۰ متر سمت بلوار طالقانی رامسر می‌خواهم',
    );

    expect(result.location.city).toBe('رامسر');
    expect(result.location.street).toBe('بلوار طالقانی');
    expect(result.location.neighborhood).toBeNull();
  });

  it('preserves offered and wanted property types for an exchange request', async () => {
    const modelOutput = {
      intent: 'exchange',
      propertyType: null,
      offeredPropertyType: 'land',
      wantedPropertyType: 'villa',
      rentalMode: null,
      location: { province: null, city: 'رامسر', neighborhood: null },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('زمینم رو با ویلا معاوضه می‌کنم');

    expect(result.intent).toBe('exchange');
    expect(result.offeredPropertyType).toBe('land');
    expect(result.wantedPropertyType).toBe('villa');
  });

  it('clears wanted and offered property types for a short-stay request', async () => {
    const modelOutput = {
      intent: null,
      propertyType: null,
      offeredPropertyType: null,
      wantedPropertyType: 'apartment',
      rentalMode: null,
      location: { province: null, city: 'رامسر', neighborhood: null },
      stay: { checkInDate: null, checkOutDate: null, guests: null, nights: 2 },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest(
      'یه کلبه سوئیسی برای دو شب تو رامسر می‌خوام',
    );

    expect(result.intent).toBe('rent');
    expect(result.rentalMode).toBe('short_term');
    expect(result.wantedPropertyType).toBeNull();
    expect(result.offeredPropertyType).toBeNull();
    expect(result.features).toContainEqual({
      id: 'accommodation.type',
      value: 'swiss_cottage',
    });
  });

  it('preserves villa as the broad type when the user explicitly asks for a villa-style Swiss cottage', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'apartment',
      location: { province: null, city: 'رامسر', neighborhood: null },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه ویلای کلبه سوئیسی تو رامسر می‌خوام');

    expect(result.propertyType).toBe('villa');
    expect(result.features).toContainEqual({
      id: 'accommodation.type',
      value: 'swiss_cottage',
    });
  });

  it('normalizes an incomplete model response for a villa with a claimed eternal view', async () => {
    const modelOutput = {
      intent: 'buy',
      propertyType: 'villa',
      location: { city: null, neighborhood: null },
      requirements: {
        hasView: null,
        viewProtectionClaim: true,
        deedEra: null,
      },
      missingInformation: ['province', 'city'],
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه ویلا با ویو ابدی می‌خوام.');

    expect(result.intent).toBeNull();
    expect(result.propertyType).toBe('villa');
    expect(result.requirements.viewProtectionClaim).toBe(true);
    expect(result.budget.maxRentNightlyRial).toBeNull();
    expect(result.stay.checkInDate).toBeNull();
  });

  it('does not confuse a sea view with physical proximity to the sea', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'villa',
      location: { province: null, city: 'رامسر', neighborhood: null },
      requirements: { nearSea: true, hasView: true },
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('یه ویلا با ویوی دریا تو رامسر می‌خوام');

    expect(result.requirements.hasView).toBe(true);
    expect(result.requirements.nearSea).toBeNull();
    expect(result.features).toContainEqual({
      id: 'view.types',
      value: ['sea'],
    });
    expect(result.features).not.toContainEqual({
      id: 'location.near_sea',
      value: true,
    });
  });

  it('returns deterministic accommodation features alongside the search request', async () => {
    const modelOutput = {
      intent: null,
      propertyType: 'villa',
      location: { province: null, city: 'رامسر', neighborhood: null },
      requirements: {},
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest(
      'یه کلبه سوئیسی استخردار با جکوزی و صبحانه رایگان با ویوی جنگل می‌خوام',
    );

    expect(result.features).toEqual(
      expect.arrayContaining([
        { id: 'accommodation.type', value: 'swiss_cottage' },
        { id: 'amenity.pool', value: true },
        { id: 'amenity.jacuzzi', value: true },
        { id: 'food.breakfast.price', value: 'free' },
        { id: 'view.types', value: ['forest'] },
      ]),
    );
  });


  it('uses recent user/assistant history so follow-up messages keep prior constraints', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(
      async (_input, init) => {
        const requestBody = JSON.parse(String(init?.body)) as {
          messages: Array<{ role: string; content: string }>;
        };
        expect(requestBody.messages[0]).toEqual(
          expect.objectContaining({ role: 'system' }),
        );
        expect(requestBody.messages.slice(1)).toEqual([
          { role: 'user', content: 'یه ویلا تو رامسر می‌خوام' },
          { role: 'assistant', content: 'حتماً؛ بودجه‌ات چقدره؟' },
          { role: 'user', content: 'شبی تا ۵ میلیون' },
          { role: 'assistant', content: 'پس سقف بودجه شبی ۵ میلیون است.' },
          { role: 'user', content: 'نزدیک‌تر به دریا باشه' },
        ]);
        return {
          ok: true,
          json: async () => ({ message: { content: 'حتماً؛ شرط نزدیک دریا را هم اضافه می‌کنم.' } }),
        } as Response;
      },
    );

    const result = await service.chat('نزدیک‌تر به دریا باشه', [
      { role: 'user', content: 'یه ویلا تو رامسر می‌خوام' },
      { role: 'assistant', content: 'حتماً؛ بودجه‌ات چقدره؟' },
      { role: 'user', content: 'شبی تا ۵ میلیون' },
      { role: 'assistant', content: 'پس سقف بودجه شبی ۵ میلیون است.' },
    ]);

    expect(result.reply).toContain('نزدیک دریا');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('bounds chat history to the most recent eight messages and trims oversized turns', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (_input, init) => {
      const requestBody = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      const historyMessages = requestBody.messages.slice(1, -1);
      expect(historyMessages).toHaveLength(8);
      expect(historyMessages[0].content).toBe('turn-2');
      expect(historyMessages[7].content).toHaveLength(1200);
      return {
        ok: true,
        json: async () => ({ message: { content: 'باشه.' } }),
      } as Response;
    });

    const history = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: index === 9 ? 'x'.repeat(1500) : `turn-${index}`,
    }));
    await service.chat('شرط جدید', history);
  });

  it('preserves the earlier property, rental budget and amenities on a follow-up search', async () => {
    const modelOutput = {
      intent: 'rent',
      propertyType: 'villa',
      offeredPropertyType: null,
      wantedPropertyType: null,
      rentalMode: 'short_term',
      location: { province: 'مازندران', city: 'رامسر', neighborhood: null, street: null },
      area: { targetSqm: null, minSqm: null, maxSqm: null },
      budget: {
        maxTotalPriceRial: null,
        maxPricePerSqmRial: null,
        maxDepositRial: null,
        maxRentMonthlyRial: null,
        maxRentNightlyRial: 5000000,
      },
      requirements: {
        bedrooms: null, documentType: null, landUse: null, nearSea: null,
        hasView: null, isInTownship: null, hasMountainView: null,
        hasSeaView: null, viewProtectionClaim: null, deedEra: null,
      },
      stay: { checkInDate: null, checkOutDate: null, guests: 4, nights: 3 },
      features: [{ id: 'amenity.pool', value: true }],
      missingInformation: [],
      clarificationQuestion: null,
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: JSON.stringify(modelOutput) } }),
    } as Response);

    const result = await service.parseSearchRequest('نزدیک‌تر به دریا', [
      { role: 'user', content: 'یه ویلای اجاره‌ای شبی ۵ میلیون تو رامسر برای ۳ شب می‌خوام، استخر هم داشته باشه' },
      { role: 'assistant', content: 'حتماً، نزدیک دریا هم بررسی می‌کنم.' },
    ]);

    expect(result.intent).toBe('rent');
    expect(result.propertyType).toBe('villa');
    expect(result.location.city).toBe('رامسر');
    expect(result.budget.maxRentNightlyRial).toBe(50000000);
    expect(result.stay.nights).toBe(3);
    expect(result.requirements.nearSea).toBe(true);
    expect(result.features).toContainEqual({ id: 'amenity.pool', value: true });
    expect(result.missingInformation).not.toContain('intent');
    expect(result.clarificationQuestion).not.toBe('قصد خرید، فروش، اجاره یا معاوضه دارید؟');
  });

});
