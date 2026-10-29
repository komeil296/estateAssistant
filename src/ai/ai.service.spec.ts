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

});
