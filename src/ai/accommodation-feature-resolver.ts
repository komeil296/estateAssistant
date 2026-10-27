import { ACCOMMODATION_FEATURE_CATALOG } from './property-feature-catalog';

export type ExtractedFeatureValue = string | boolean | number | string[];

export interface ExtractedAccommodationFeature {
  id: string;
  value: ExtractedFeatureValue;
}

/**
 * Deterministically extracts only explicit accommodation preferences.
 * It never infers an amenity from the accommodation type.
 */
export function resolveAccommodationFeaturesFromMessage(
  message: string,
): ExtractedAccommodationFeature[] {
  const text = message
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[‌\u200c]/g, ' ')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  const features = new Map<string, ExtractedFeatureValue>();
  const add = (id: string, value: ExtractedFeatureValue = true) => {
    if (ACCOMMODATION_FEATURE_CATALOG.some((feature) => feature.id === id)) {
      features.set(id, value);
    }
  };

  // Accommodation style.
  if (/کلبه\s*سوئیسی|کلبه\s*سوییسی/.test(text)) {
    add('accommodation.type', 'swiss_cottage');
    add('accommodation.style', ['swiss']);
  }
  if (/کلبه\s*جنگلی/.test(text)) {
    add('accommodation.type', 'forest_cottage');
    add('accommodation.style', ['forest']);
  }
  if (/کلبه\s*شیشه.?ای/.test(text)) {
    add('accommodation.type', 'glass_cottage');
  }
  if (/اقامتگاه\s*سنتی/.test(text)) {
    add('accommodation.type', 'traditional_lodging');
    add('accommodation.style', ['traditional']);
  }
  if (/بوم\s*گردی|بومگردی/.test(text)) {
    add('accommodation.type', 'eco_lodge');
    add('accommodation.style', ['eco_tourism']);
  }
  if (/ویلای?\s*استخردار|استخر/.test(text)) add('amenity.pool');
  if (/استخر\s*(?:خصوصی|اختصاصی)|استخر\s*خصوصی/.test(text)) {
    add('amenity.pool.privacy', 'private');
  } else if (/استخر\s*(?:مشترک|عمومی)/.test(text)) {
    add('amenity.pool.privacy', 'shared');
  }
  if (/استخر\s*(?:سرپوشیده|داخل\s*ساختمان)|سرپوشیده\s*بودن\s*استخر/.test(text)) {
    add('amenity.pool.location', 'indoor');
  } else if (/استخر\s*روباز|استخر\s*بیرونی/.test(text)) {
    add('amenity.pool.location', 'outdoor');
  }
  if (/استخر.{0,12}(?:آب\s*گرم|گرم)|(?:آب\s*گرم|گرم).{0,12}استخر/.test(text)) {
    add('amenity.pool.heating');
  }
  if (/جکوزی/.test(text)) add('amenity.jacuzzi');
  if (/سونا/.test(text)) add('amenity.sauna');
  if (/باربیکیو|منقل|کباب\s*پز/.test(text)) add('amenity.bbq');

  const views: string[] = [];
  if (/(?:ویو|چشم\s*انداز|منظره|دید).{0,12}جنگل|جنگل.{0,12}(?:ویو|چشم\s*انداز|منظره|دید)/.test(text)) views.push('forest');
  if (/(?:ویو|چشم\s*انداز|منظره|دید).{0,12}کوه|کوه.{0,12}(?:ویو|چشم\s*انداز|منظره|دید)/.test(text)) views.push('mountain');
  if (/(?:ویو|چشم\s*انداز|منظره|دید).{0,12}دریا|دریا.{0,12}(?:ویو|چشم\s*انداز|منظره|دید)/.test(text)) views.push('sea');
  if (/(?:ویو|چشم\s*انداز|منظره|دید).{0,12}رودخانه/.test(text)) views.push('river');
  if (views.length) add('view.types', views);
  if (/نزدیک\s*(?:به\s*)?(?:دریا|ساحل)|پیاده.{0,10}(?:تا|به)\s*(?:دریا|ساحل)|فاصله.{0,10}(?:تا|از)\s*(?:دریا|ساحل)/.test(text)) {
    add('location.near_sea');
  }
  const environments: string[] = [];
  if (/جنگلی/.test(text)) environments.push('forest');
  if (/ساحلی/.test(text)) environments.push('coastal');
  if (/کوهستانی/.test(text)) environments.push('mountain');
  if (/روستایی/.test(text)) environments.push('rural');
  if (/داخل\s*شهر|مرکز\s*شهر/.test(text)) environments.push('urban');
  if (/شهرکی/.test(text)) environments.push('township');
  if (environments.length) add('location.environment', [...new Set(environments)]);

  const heating: string[] = [];
  if (/بخاری/.test(text)) heating.push('heater');
  if (/شوفاژ/.test(text)) heating.push('radiator');
  if (/پکیج/.test(text)) heating.push('boiler');
  if (/گرمایش\s*از\s*کف/.test(text)) heating.push('underfloor');
  if (heating.length) add('amenity.heating.types', [...new Set(heating)]);
  const cooling: string[] = [];
  if (/کولر\s*گازی/.test(text)) cooling.push('air_conditioner');
  if (/اسپیلت|اسپلیت/.test(text)) cooling.push('split_ac');
  if (/کولر\s*آبی/.test(text)) cooling.push('evaporative_cooler');
  if (/پنکه/.test(text)) cooling.push('fan');
  if (cooling.length) add('amenity.cooling.types', [...new Set(cooling)]);
  if (/آشپزخانه|امکان\s*آشپزی/.test(text)) add('amenity.kitchen');
  const kitchenEquipment: string[] = [];
  if (/یخچال/.test(text)) kitchenEquipment.push('refrigerator');
  if (/اجاق\s*گاز/.test(text)) kitchenEquipment.push('stove');
  if (/ظروف|وسایل\s*آشپزی/.test(text)) kitchenEquipment.push('cookware');
  if (/کتری/.test(text)) kitchenEquipment.push('kettle');
  if (/مایکروویو/.test(text)) kitchenEquipment.push('microwave');
  if (kitchenEquipment.length) add('amenity.kitchen_equipment', [...new Set(kitchenEquipment)]);
  if (/ماشین\s*لباس\s*شویی|لباسشویی/.test(text)) add('amenity.washing_machine');
  if (/آسانسور/.test(text)) add('amenity.elevator');

  if (/وای\s*فای|وایفای|\bwifi\b|اینترنت\s*بی\s*سیم/.test(text)) add('connectivity.wifi');
  const operators: string[] = [];
  if (/همراه\s*اول/.test(text)) operators.push('hamrah_aval');
  if (/ایرانسل/.test(text)) operators.push('irancell');
  if (/رایتل/.test(text)) operators.push('rightel');
  if (operators.length) add('connectivity.mobile_coverage', [...new Set(operators)]);
  else if (/آنتن\s*دهی\s*(?:موبایل|گوشی)|آنتن\s*موبایل/.test(text)) {
    add('connectivity.mobile_coverage', []);
  }

  if (/پارکینگ|جای\s*پارک/.test(text)) add('amenity.parking');
  if (/پارکینگ\s*(?:اختصاصی|خصوصی)/.test(text)) add('amenity.parking.type', 'private');
  else if (/پارکینگ\s*(?:مشترک|عمومی)/.test(text)) add('amenity.parking.type', 'shared');
  else if (/پارکینگ\s*سرپوشیده/.test(text)) add('amenity.parking.type', 'covered');
  else if (/پارکینگ\s*(?:روباز|باز)/.test(text)) add('amenity.parking.type', 'open_air');
  else if (/پارک(?:ینگ)?\s*(?:داخل|توی)\s*(?:حیاط|محوطه)/.test(text)) add('amenity.parking.type', 'yard');

  if (/صبحانه/.test(text)) add('food.breakfast');
  if (/صبحانه\s*(?:رایگان|مجانی)|رایگان.{0,10}صبحانه/.test(text)) add('food.breakfast.price', 'free');
  else if (/صبحانه\s*(?:با\s*هزینه|پولی)|هزینه\s*صبحانه/.test(text)) add('food.breakfast.price', 'paid');
  const meals: string[] = [];
  if (/صبحانه/.test(text)) meals.push('breakfast');
  if (/ناهار/.test(text)) meals.push('lunch');
  if (/شام/.test(text)) meals.push('dinner');
  if (meals.length) add('food.meals', [...new Set(meals)]);
  const cuisines: string[] = [];
  if (/غذای?\s*محلی|غذاهای\s*محلی/.test(text)) cuisines.push('local');
  if (/غذای?\s*سنتی|غذاهای\s*سنتی/.test(text)) cuisines.push('traditional_iranian');
  if (/غذای?\s*ایرانی/.test(text)) cuisines.push('iranian');
  if (cuisines.length) add('food.cuisine', [...new Set(cuisines)]);
  if (/سفارش\s*غذا|امکان\s*سفارش/.test(text)) add('food.ordering');

  const bathrooms: string[] = [];
  if (/سرویس\s*(?:بهداشتی\s*)?ایرانی|توالت\s*ایرانی/.test(text)) bathrooms.push('iranian');
  if (/سرویس\s*(?:بهداشتی\s*)?فرنگی|توالت\s*فرنگی|ایرانی\s*و\s*فرنگی/.test(text)) bathrooms.push('western');
  if (bathrooms.length) add('bathroom.types', [...new Set(bathrooms)]);
  if (/سرویس.{0,12}(?:اختصاصی|خصوصی)/.test(text)) add('bathroom.sharing', 'private');
  else if (/سرویس.{0,12}(?:اشتراکی|مشترک)/.test(text) && !/سرویس.{0,16}(?:اشتراکی|مشترک).{0,12}(?:نباشه|نباشد|نمی ?خوام|نمی ?خواهم)/.test(text)) add('bathroom.sharing', 'shared');
  if (/حمام/.test(text)) add('bathroom.shower');

  if (/نظافت\s*روزانه/.test(text)) add('service.housekeeping', 'daily');
  else if (/نظافت.{0,10}(?:در\s*صورت\s*درخواست|با\s*درخواست)/.test(text)) add('service.housekeeping', 'on_request');
  if (/پذیرش\s*(?:۲۴|24)\s*ساعته|پذیرش\s*شبانه\s*روزی/.test(text)) add('service.reception', '24_hour');
  else if (/ورود\s*بدون\s*میزبان|تحویل\s*کلید\s*بدون\s*حضور/.test(text)) add('service.reception', 'self_check_in');
  if (/حیوان\s*خانگی|پت\s*فرندلی/.test(text)) add('policy.pets');
  if (/برگزاری\s*مراسم|جشن|مهمانی/.test(text)) add('policy.events');

  return [...features.entries()].map(([id, value]) => ({ id, value }));
}
