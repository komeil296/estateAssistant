import { resolveAccommodationFeaturesFromMessage } from './accommodation-feature-resolver';

describe('resolveAccommodationFeaturesFromMessage', () => {
  it('extracts multiple explicitly requested amenities from a Persian query', () => {
    expect(
      resolveAccommodationFeaturesFromMessage(
        'یه کلبه سوئیسی استخردار با جکوزی، صبحانه رایگان و ویوی جنگل می‌خوام',
      ),
    ).toEqual(
      expect.arrayContaining([
        { id: 'accommodation.type', value: 'swiss_cottage' },
        { id: 'accommodation.style', value: ['swiss'] },
        { id: 'amenity.pool', value: true },
        { id: 'amenity.jacuzzi', value: true },
        { id: 'food.breakfast', value: true },
        { id: 'food.breakfast.price', value: 'free' },
        { id: 'food.meals', value: ['breakfast'] },
        { id: 'view.types', value: ['forest'] },
      ]),
    );
  });

  it('distinguishes a sea view from physical proximity to the sea', () => {
    const viewOnly = resolveAccommodationFeaturesFromMessage('ویلایی با ویوی دریا می‌خوام');
    expect(viewOnly).toContainEqual({ id: 'view.types', value: ['sea'] });
    expect(viewOnly).not.toContainEqual({ id: 'location.near_sea', value: true });

    const nearbyOnly = resolveAccommodationFeaturesFromMessage('یه ویلا نزدیک دریا می‌خوام');
    expect(nearbyOnly).toContainEqual({ id: 'location.near_sea', value: true });
    expect(nearbyOnly).not.toContainEqual({ id: 'view.types', value: ['sea'] });
  });

  it('extracts bathroom type and sharing separately', () => {
    expect(
      resolveAccommodationFeaturesFromMessage('سرویس ایرانی و فرنگی داشته باشه و سرویس اشتراکی نباشه'),
    ).toContainEqual({ id: 'bathroom.types', value: ['iranian', 'western'] });
  });

  it('does not infer a pool from the word villa alone', () => {
    expect(resolveAccommodationFeaturesFromMessage('یه ویلا توی رامسر می‌خوام')).not.toContainEqual({
      id: 'amenity.pool',
      value: true,
    });
  });

  it('extracts explicit parking, mobile carrier, and heating details', () => {
    expect(
      resolveAccommodationFeaturesFromMessage(
        'پارکینگ اختصاصی، آنتن همراه اول و شوفاژ داشته باشه',
      ),
    ).toEqual(
      expect.arrayContaining([
        { id: 'amenity.parking', value: true },
        { id: 'amenity.parking.type', value: 'private' },
        { id: 'connectivity.mobile_coverage', value: ['hamrah_aval'] },
        { id: 'amenity.heating.types', value: ['radiator'] },
      ]),
    );
  });
});
