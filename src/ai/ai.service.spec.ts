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

});
