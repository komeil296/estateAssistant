/**
 * Canonical Persian accommodation feature catalog.
 *
 * This is the vocabulary layer for query extraction and future listing filters.
 * It intentionally does not claim that any listing has a feature: values must
 * come from verified listing data.
 */

export type AccommodationFeatureValueType =
  | 'boolean'
  | 'enum'
  | 'multi_enum'
  | 'number'
  | 'text';

export interface AccommodationFeatureDefinition {
  id: string;
  category:
    | 'accommodation_type'
    | 'water_and_recreation'
    | 'view_and_location'
    | 'comfort'
    | 'connectivity'
    | 'parking'
    | 'food'
    | 'bathroom'
    | 'service'
    | 'policies';
  label: string;
  valueType: AccommodationFeatureValueType;
  /** Common Persian phrases mapped to this canonical feature. */
  aliases: readonly string[];
  /** Allowed values for enum/multi_enum features. */
  values?: readonly string[];
  /** Whether this feature is suitable for a strict search filter. */
  filterable: boolean;
}

export const ACCOMMODATION_FEATURE_CATALOG = [
  // Accommodation type is kept separate from amenities.
  {
    id: 'accommodation.type',
    category: 'accommodation_type',
    label: 'نوع اقامتگاه',
    valueType: 'enum',
    aliases: ['نوع اقامتگاه', 'نوع ویلا', 'کلبه', 'سوئیت', 'اقامتگاه'],
    values: [
      'villa',
      'apartment',
      'suite',
      'swiss_cottage',
      'forest_cottage',
      'glass_cottage',
      'traditional_lodging',
      'eco_lodge',
      'rural_house',
      'mansion',
      'hotel',
      'hostel',
    ],
    filterable: true,
  },
  {
    id: 'accommodation.style',
    category: 'accommodation_type',
    label: 'سبک اقامتگاه',
    valueType: 'multi_enum',
    aliases: ['سبک اقامتگاه', 'سبک ویلا', 'کلبه سوئیسی', 'کلبه جنگلی', 'بوم گردی', 'سنتی'],
    values: ['swiss', 'forest', 'traditional', 'eco_tourism', 'luxury', 'rural'],
    filterable: true,
  },

  // Pool and recreation. Privacy, cover, and heating are independent facts.
  {
    id: 'amenity.pool',
    category: 'water_and_recreation',
    label: 'استخر',
    valueType: 'boolean',
    aliases: ['استخر', 'استخردار', 'ویلای استخردار', 'استخر داشته باشد'],
    filterable: true,
  },
  {
    id: 'amenity.pool.location',
    category: 'water_and_recreation',
    label: 'محل استخر',
    valueType: 'enum',
    aliases: ['استخر روباز', 'استخر سرپوشیده', 'استخر داخل ساختمان'],
    values: ['indoor', 'outdoor'],
    filterable: true,
  },
  {
    id: 'amenity.pool.privacy',
    category: 'water_and_recreation',
    label: 'اختصاصی یا مشترک بودن استخر',
    valueType: 'enum',
    aliases: ['استخر خصوصی', 'استخر اختصاصی', 'استخر مشترک', 'استخر عمومی'],
    values: ['private', 'shared'],
    filterable: true,
  },
  {
    id: 'amenity.pool.heating',
    category: 'water_and_recreation',
    label: 'گرمایش استخر',
    valueType: 'boolean',
    aliases: ['استخر آب گرم', 'استخر گرم', 'آب گرم استخر'],
    filterable: true,
  },
  {
    id: 'amenity.jacuzzi',
    category: 'water_and_recreation',
    label: 'جکوزی',
    valueType: 'boolean',
    aliases: ['جکوزی', 'جکوزی داشته باشد'],
    filterable: true,
  },
  {
    id: 'amenity.sauna',
    category: 'water_and_recreation',
    label: 'سونا',
    valueType: 'boolean',
    aliases: ['سونا', 'سونای خشک', 'سونای بخار'],
    filterable: true,
  },
  {
    id: 'amenity.bbq',
    category: 'water_and_recreation',
    label: 'باربیکیو',
    valueType: 'boolean',
    aliases: ['باربیکیو', 'منقل', 'کباب پز'],
    filterable: true,
  },

  // Views and actual geographic relationship must not be conflated.
  {
    id: 'view.types',
    category: 'view_and_location',
    label: 'نوع منظره',
    valueType: 'multi_enum',
    aliases: ['ویو', 'منظره', 'چشم انداز', 'دید'],
    values: ['sea', 'forest', 'mountain', 'river', 'garden', 'paddy_field', 'city'],
    filterable: true,
  },
  {
    id: 'location.near_sea',
    category: 'view_and_location',
    label: 'نزدیکی به دریا',
    valueType: 'boolean',
    aliases: ['نزدیک دریا', 'نزدیک ساحل', 'پیاده تا دریا', 'فاصله کم تا ساحل'],
    filterable: true,
  },
  {
    id: 'location.environment',
    category: 'view_and_location',
    label: 'محیط اقامتگاه',
    valueType: 'multi_enum',
    aliases: ['جنگلی', 'ساحلی', 'کوهستانی', 'روستایی', 'داخل شهر'],
    values: ['forest', 'coastal', 'mountain', 'rural', 'urban', 'township'],
    filterable: true,
  },

  // Comfort and equipment.
  {
    id: 'amenity.heating.types',
    category: 'comfort',
    label: 'سیستم گرمایشی',
    valueType: 'multi_enum',
    aliases: ['سیستم گرمایشی', 'بخاری', 'شوفاژ', 'پکیج', 'گرمایش از کف'],
    values: ['heater', 'radiator', 'boiler', 'underfloor'],
    filterable: true,
  },
  {
    id: 'amenity.cooling.types',
    category: 'comfort',
    label: 'سیستم سرمایشی',
    valueType: 'multi_enum',
    aliases: ['سیستم سرمایشی', 'کولر گازی', 'اسپیلت', 'کولر آبی'],
    values: ['air_conditioner', 'split_ac', 'evaporative_cooler', 'fan'],
    filterable: true,
  },
  {
    id: 'amenity.kitchen',
    category: 'comfort',
    label: 'آشپزخانه',
    valueType: 'boolean',
    aliases: ['آشپزخانه', 'آشپزخانه مجهز', 'امکان آشپزی'],
    filterable: true,
  },
  {
    id: 'amenity.kitchen_equipment',
    category: 'comfort',
    label: 'تجهیزات آشپزخانه',
    valueType: 'multi_enum',
    aliases: ['یخچال', 'اجاق گاز', 'ظروف', 'وسایل آشپزی'],
    values: ['refrigerator', 'stove', 'cookware', 'kettle', 'microwave'],
    filterable: true,
  },
  {
    id: 'amenity.washing_machine',
    category: 'comfort',
    label: 'ماشین لباس‌شویی',
    valueType: 'boolean',
    aliases: ['ماشین لباسشویی', 'لباس شویی'],
    filterable: true,
  },
  {
    id: 'amenity.elevator',
    category: 'comfort',
    label: 'آسانسور',
    valueType: 'boolean',
    aliases: ['آسانسور'],
    filterable: true,
  },

  // Internet access and mobile coverage are not the same thing.
  {
    id: 'connectivity.wifi',
    category: 'connectivity',
    label: 'وای‌فای',
    valueType: 'boolean',
    aliases: ['وای فای', 'وایفای', 'اینترنت وای فای', 'wifi'],
    filterable: true,
  },
  {
    id: 'connectivity.mobile_coverage',
    category: 'connectivity',
    label: 'آنتن‌دهی موبایل',
    valueType: 'multi_enum',
    aliases: ['آنتن دهی موبایل', 'آنتن موبایل', 'آنتن همراه اول', 'آنتن ایرانسل', 'آنتن رایتل'],
    values: ['hamrah_aval', 'irancell', 'rightel'],
    filterable: true,
  },

  // Parking.
  {
    id: 'amenity.parking',
    category: 'parking',
    label: 'پارکینگ',
    valueType: 'boolean',
    aliases: ['پارکینگ', 'جای پارک', 'جای پارک ماشین'],
    filterable: true,
  },
  {
    id: 'amenity.parking.type',
    category: 'parking',
    label: 'نوع پارکینگ',
    valueType: 'enum',
    aliases: ['پارکینگ اختصاصی', 'پارکینگ مشترک', 'پارکینگ سرپوشیده', 'پارکینگ روباز'],
    values: ['private', 'shared', 'covered', 'open_air', 'yard'],
    filterable: true,
  },

  // Meals are offered services, not assumed amenities.
  {
    id: 'food.breakfast',
    category: 'food',
    label: 'ارائه صبحانه',
    valueType: 'boolean',
    aliases: ['صبحانه', 'صبحانه دارد', 'صبحانه ارائه می‌شود'],
    filterable: true,
  },
  {
    id: 'food.breakfast.price',
    category: 'food',
    label: 'هزینه صبحانه',
    valueType: 'enum',
    aliases: ['صبحانه رایگان', 'صبحانه با هزینه', 'صبحانه شامل قیمت'],
    values: ['free', 'paid', 'included'],
    filterable: true,
  },
  {
    id: 'food.meals',
    category: 'food',
    label: 'وعده‌های غذایی',
    valueType: 'multi_enum',
    aliases: ['وعده غذایی', 'ناهار', 'شام', 'صبحانه', 'غذا'],
    values: ['breakfast', 'lunch', 'dinner'],
    filterable: true,
  },
  {
    id: 'food.cuisine',
    category: 'food',
    label: 'نوع غذا',
    valueType: 'multi_enum',
    aliases: ['غذای محلی', 'غذای سنتی', 'غذاهای محلی', 'غذای ایرانی'],
    values: ['local', 'traditional_iranian', 'iranian'],
    filterable: true,
  },
  {
    id: 'food.ordering',
    category: 'food',
    label: 'امکان سفارش غذا',
    valueType: 'boolean',
    aliases: ['امکان سفارش غذا', 'غذا سفارش بدهم', 'سفارش غذا'],
    filterable: true,
  },

  // Bathroom style and sharing are independent attributes.
  {
    id: 'bathroom.types',
    category: 'bathroom',
    label: 'نوع سرویس بهداشتی',
    valueType: 'multi_enum',
    aliases: ['سرویس بهداشتی ایرانی', 'توالت ایرانی', 'سرویس فرنگی', 'توالت فرنگی'],
    values: ['iranian', 'western'],
    filterable: true,
  },
  {
    id: 'bathroom.sharing',
    category: 'bathroom',
    label: 'اختصاصی یا اشتراکی بودن سرویس',
    valueType: 'enum',
    aliases: ['سرویس اختصاصی', 'سرویس اشتراکی', 'سرویس مشترک'],
    values: ['private', 'shared'],
    filterable: true,
  },
  {
    id: 'bathroom.shower',
    category: 'bathroom',
    label: 'حمام',
    valueType: 'boolean',
    aliases: ['حمام', 'حمام اختصاصی'],
    filterable: true,
  },

  // Service and policies.
  {
    id: 'service.housekeeping',
    category: 'service',
    label: 'خدمات نظافت',
    valueType: 'enum',
    aliases: ['نظافت روزانه', 'نظافت', 'خدمات نظافت'],
    values: ['daily', 'on_request', 'none'],
    filterable: true,
  },
  {
    id: 'service.reception',
    category: 'service',
    label: 'پذیرش',
    valueType: 'enum',
    aliases: ['پذیرش شبانه روزی', 'پذیرش ۲۴ ساعته', 'تحویل کلید'],
    values: ['24_hour', 'scheduled', 'self_check_in'],
    filterable: true,
  },
  {
    id: 'policy.pets',
    category: 'policies',
    label: 'پذیرش حیوان خانگی',
    valueType: 'boolean',
    aliases: ['حیوان خانگی', 'پت فرندلی', 'اجازه ورود حیوان'],
    filterable: true,
  },
  {
    id: 'policy.events',
    category: 'policies',
    label: 'اجازه برگزاری مراسم',
    valueType: 'boolean',
    aliases: ['برگزاری مراسم', 'مهمانی', 'جشن'],
    filterable: true,
  },
] as const satisfies readonly AccommodationFeatureDefinition[];

export type AccommodationFeatureId =
  (typeof ACCOMMODATION_FEATURE_CATALOG)[number]['id'];

export function getAccommodationFeatureById(id: string) {
  return ACCOMMODATION_FEATURE_CATALOG.find((feature) => feature.id === id);
}
