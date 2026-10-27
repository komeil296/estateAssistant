/**
 * Curated place-name catalog for the first Estate Assistant pilot area.
 *
 * Canonical labels are used in API output; aliases cover common historical
 * names, local spellings and spacing variants. This is a practical search
 * catalog, not an authoritative administrative-boundary dataset.
 */
export type PlaceEntry = {
  canonical: string;
  kind: 'city' | 'locality' | 'street';
  city: string;
  aliases: string[];
};

export const PLACE_CATALOG: PlaceEntry[] = [
  { canonical: 'رامسر', kind: 'city', city: 'رامسر', aliases: ['رامسر', 'سخت سر', 'سخت‌سر', 'سختسر'] },
  { canonical: 'تنکابن', kind: 'city', city: 'تنکابن', aliases: ['تنکابن', 'شهسوار', 'شهسواران'] },
  { canonical: 'نشتارود', kind: 'city', city: 'نشتارود', aliases: ['نشتارود', 'نشتا رود', 'نشتا‌رود'] },
  { canonical: 'سلمان‌شهر', kind: 'city', city: 'سلمان‌شهر', aliases: ['سلمان شهر', 'سلمان‌شهر', 'سلمانشهر', 'متل قو', 'متل‌قو', 'موتل قو', 'موتل‌قو', 'ساقی‌کلایه', 'ساقی کلایه'] },
  { canonical: 'کتالم', kind: 'locality', city: 'رامسر', aliases: ['کتالم', 'کتالم و سادات شهر', 'کتالم و سادات‌شهر', 'گتل لم', 'گَتِ لَم'] },
  { canonical: 'سادات‌شهر', kind: 'locality', city: 'رامسر', aliases: ['سادات شهر', 'سادات‌شهر', 'ساداتشهر', 'سادات محله', 'سادات‌محله'] },
  { canonical: 'اربه‌کله', kind: 'locality', city: 'رامسر', aliases: ['اربه کله', 'اربه‌کله', 'اربهکله', 'اربه گله', 'اربه‌گله'] },
  { canonical: 'جواهرده', kind: 'locality', city: 'رامسر', aliases: ['جواهرده'] },
  { canonical: 'دالخانی', kind: 'locality', city: 'رامسر', aliases: ['دالخانی', 'دال خانی', 'دال‌خانی'] },
  { canonical: 'جنت‌رودبار', kind: 'locality', city: 'رامسر', aliases: ['جنت رودبار', 'جنت‌رودبار'] },
  { canonical: 'کتالم', kind: 'locality', city: 'رامسر', aliases: ['کتالم'] },
  { canonical: 'سادات‌شهر', kind: 'locality', city: 'رامسر', aliases: ['سادات شهر', 'سادات‌شهر', 'ساداتشهر'] },
  { canonical: 'ابریشم‌محله', kind: 'locality', city: 'رامسر', aliases: ['ابریشم محله', 'ابریشم‌محله', 'ابریشممحله'] },
  { canonical: 'آخوند‌محله', kind: 'locality', city: 'رامسر', aliases: ['آخوند محله', 'آخوند‌محله', 'اخوندمحله'] },
  { canonical: 'آزادی', kind: 'locality', city: 'رامسر', aliases: ['آزادی'] },
  { canonical: 'آسیابسر', kind: 'locality', city: 'رامسر', aliases: ['آسیابسر', 'آسیاب سر'] },
  { canonical: 'استل‌کنار', kind: 'locality', city: 'رامسر', aliases: ['استل کنار', 'استل‌کنار'] },
  { canonical: 'اشکورات', kind: 'locality', city: 'رامسر', aliases: ['اشکورات'] },
  { canonical: 'باغ‌صفا', kind: 'locality', city: 'رامسر', aliases: ['باغ صفا', 'باغ‌صفا'] },
  { canonical: 'باغ‌ملی', kind: 'locality', city: 'رامسر', aliases: ['باغ ملی', 'باغ‌ملی'] },
  { canonical: 'بلوار معلم', kind: 'street', city: 'رامسر', aliases: ['بلوار معلم'] },
  { canonical: 'پیازکش', kind: 'locality', city: 'رامسر', aliases: ['پیازکش'] },
  { canonical: 'چالکرود', kind: 'locality', city: 'رامسر', aliases: ['چالکرود', 'چال کرود'] },
  { canonical: 'چهارباغ', kind: 'locality', city: 'رامسر', aliases: ['چهار باغ', 'چهارباغ'] },
  { canonical: 'دریاپشته', kind: 'locality', city: 'رامسر', aliases: ['دریاپشته', 'دریا پشته'] },
  { canonical: 'دهکده ساحلی', kind: 'locality', city: 'رامسر', aliases: ['دهکده ساحلی'] },
  { canonical: 'دیسر', kind: 'locality', city: 'رامسر', aliases: ['دیسر'] },
  { canonical: 'راجوب', kind: 'locality', city: 'رامسر', aliases: ['راجوب'] },
  { canonical: 'رضی‌محله', kind: 'locality', city: 'رامسر', aliases: ['رضی محله', 'رضی‌محله'] },
  { canonical: 'رمک', kind: 'locality', city: 'رامسر', aliases: ['رمک'] },
  { canonical: 'سرلیماک', kind: 'locality', city: 'رامسر', aliases: ['سرلیماک', 'سر لیماک'] },
  { canonical: 'سفیدتمشک', kind: 'locality', city: 'رامسر', aliases: ['سفیدتمشک', 'سفید تمشک'] },
  { canonical: 'سنگ‌پشته', kind: 'locality', city: 'رامسر', aliases: ['سنگ پشته', 'سنگ‌پشته'] },
  { canonical: 'سیاسان', kind: 'locality', city: 'رامسر', aliases: ['سیاسان'] },
  { canonical: 'شادمرادمحله', kind: 'locality', city: 'رامسر', aliases: ['شادمرادمحله', 'شاد مراد محله', 'شادمراد محله'] },
  { canonical: 'شاه‌منصورمحله', kind: 'locality', city: 'رامسر', aliases: ['شاه منصور محله', 'شاه‌منصورمحله'] },
  { canonical: 'طالش‌محله', kind: 'locality', city: 'رامسر', aliases: ['طالش محله', 'طالش‌محله'] },
  { canonical: 'قلعه‌گردن', kind: 'locality', city: 'رامسر', aliases: ['قلعه گردن', 'قلعه‌گردن'] },
  { canonical: 'گاورمک', kind: 'locality', city: 'رامسر', aliases: ['گاورمک'] },
  { canonical: 'گاولیماک', kind: 'locality', city: 'رامسر', aliases: ['گاولیماک'] },
  { canonical: 'لات‌محله', kind: 'locality', city: 'رامسر', aliases: ['لات محله', 'لات‌محله'] },
  { canonical: 'لپاسرک', kind: 'locality', city: 'رامسر', aliases: ['لپاسرک'] },
  { canonical: 'لتر', kind: 'locality', city: 'رامسر', aliases: ['لتر'] },
  { canonical: 'لوسر', kind: 'locality', city: 'رامسر', aliases: ['لوسر'] },
  { canonical: 'لیدو', kind: 'locality', city: 'رامسر', aliases: ['لیدو'] },
  { canonical: 'مازوباغسر', kind: 'locality', city: 'رامسر', aliases: ['مازوباغسر', 'مازو باغسر', 'مازو‌باغسر'] },
  { canonical: 'میان‌لات', kind: 'locality', city: 'رامسر', aliases: ['میان لات', 'میان‌لات'] },
  { canonical: 'نارنج‌باغ', kind: 'locality', city: 'رامسر', aliases: ['نارنج باغ', 'نارنج‌باغ'] },
  { canonical: 'نیاوران', kind: 'locality', city: 'رامسر', aliases: ['نیاوران'] },
  { canonical: 'لپاسر', kind: 'locality', city: 'رامسر', aliases: ['لپاسر'] },
  { canonical: 'نی‌استه', kind: 'locality', city: 'رامسر', aliases: ['نیاسه', 'نیاسته', 'نی‌استه'] },
  { canonical: 'تلارسر', kind: 'locality', city: 'رامسر', aliases: ['تلارسر', 'تلار سر'] },
  { canonical: 'کردمحله', kind: 'locality', city: 'رامسر', aliases: ['کردمحله', 'کرد محله'] },
  { canonical: 'طالش‌محله کتالم', kind: 'locality', city: 'رامسر', aliases: ['طالش محله کتالم', 'طالش‌محله کتالم'] },
  { canonical: 'کوزه‌گرمحله', kind: 'locality', city: 'رامسر', aliases: ['کوزه گر محله', 'کوزه‌گرمحله'] },
  { canonical: 'مشاکلایه', kind: 'locality', city: 'رامسر', aliases: ['مشاکلایه', 'مشاءکلايه', 'مشا کلايه'] },
  { canonical: 'خانسر', kind: 'locality', city: 'رامسر', aliases: ['خانسر'] },
  { canonical: 'دشت‌جلم', kind: 'locality', city: 'رامسر', aliases: ['دشت جلم', 'دشت‌جلم'] },
  { canonical: 'پوده', kind: 'locality', city: 'رامسر', aliases: ['پوده'] },
  { canonical: 'میانحاله', kind: 'locality', city: 'رامسر', aliases: ['میانحاله', 'میان حاله'] },
  { canonical: 'کندسر', kind: 'locality', city: 'رامسر', aliases: ['کندسر'] },
  { canonical: 'پایین‌محله', kind: 'locality', city: 'رامسر', aliases: ['پایین محله', 'پایین‌محله'] },
  { canonical: 'شیعه‌کلایه', kind: 'locality', city: 'رامسر', aliases: ['شیعه کلایه', 'شیعه‌کلایه'] },
  { canonical: 'بریشی', kind: 'locality', city: 'رامسر', aliases: ['بریشی'] },

  { canonical: 'آبکله‌سر', kind: 'locality', city: 'تنکابن', aliases: ['آبکله سر', 'آبکله‌سر'] },
  { canonical: 'آرود', kind: 'locality', city: 'تنکابن', aliases: ['آرود'] },
  { canonical: 'آسیابانسرا', kind: 'locality', city: 'تنکابن', aliases: ['آسیابانسرا', 'آسیابان سرا'] },
  { canonical: 'آش‌محله', kind: 'locality', city: 'تنکابن', aliases: ['آش محله', 'آش‌محله'] },
  { canonical: 'احمدسرا', kind: 'locality', city: 'تنکابن', aliases: ['احمدسرا', 'احمد سرا'] },
  { canonical: 'آخوندمحله', kind: 'locality', city: 'تنکابن', aliases: ['اخوندمحله', 'آخوندمحله', 'آخوند محله'] },
  { canonical: 'استخرسر', kind: 'locality', city: 'تنکابن', aliases: ['استخرسر', 'استخر سر'] },
  { canonical: 'اسدآباد', kind: 'locality', city: 'تنکابن', aliases: ['اسدآباد', 'اسد آباد'] },
  { canonical: 'اشکورمحله', kind: 'locality', city: 'تنکابن', aliases: ['اشکورمحله', 'اشکور محله'] },
  { canonical: 'اغوزکتی', kind: 'locality', city: 'تنکابن', aliases: ['اغوزکتی'] },
  { canonical: 'اغوزکله', kind: 'locality', city: 'تنکابن', aliases: ['اغوزکله'] },
  { canonical: 'اقامقیم‌محله', kind: 'locality', city: 'تنکابن', aliases: ['اقامقیم محله', 'اقامقیم‌محله'] },
  { canonical: 'الکله', kind: 'locality', city: 'تنکابن', aliases: ['الکله', 'آلکله'] },
  { canonical: 'امام‌زمین', kind: 'locality', city: 'تنکابن', aliases: ['امام زمین', 'امام‌زمین'] },
  { canonical: 'امامزاده قاسم', kind: 'locality', city: 'تنکابن', aliases: ['امامزاده قاسم'] },
  { canonical: 'امیرآباد', kind: 'locality', city: 'تنکابن', aliases: ['امیرآباد', 'امیر آباد'] },
  { canonical: 'امین‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['امین آباد', 'امین‌آباد'] },
  { canonical: 'آهک‌چال', kind: 'locality', city: 'تنکابن', aliases: ['اهک چال', 'آهک چال', 'آهک‌چال'] },
  { canonical: 'اکبرآباد', kind: 'locality', city: 'تنکابن', aliases: ['اکبرآباد', 'اکبر آباد'] },
  { canonical: 'ایثارده', kind: 'locality', city: 'تنکابن', aliases: ['ایثارده'] },
  { canonical: 'بابولات', kind: 'locality', city: 'تنکابن', aliases: ['بابولات'] },
  { canonical: 'بازارمحله', kind: 'locality', city: 'تنکابن', aliases: ['بازارمحله', 'بازار محله'] },
  { canonical: 'باغ‌نظر', kind: 'locality', city: 'تنکابن', aliases: ['باغ نظر', 'باغ‌نظر'] },
  { canonical: 'بالااشتوج', kind: 'locality', city: 'تنکابن', aliases: ['بالا اشتوج', 'بالااشتوج'] },
  { canonical: 'بالاشیرود', kind: 'locality', city: 'تنکابن', aliases: ['بالاشیرود', 'بالا شیرود'] },
  { canonical: 'برامسر', kind: 'locality', city: 'تنکابن', aliases: ['برامسر'] },
  { canonical: 'برسه', kind: 'locality', city: 'تنکابن', aliases: ['برسه'] },
  { canonical: 'بندبن', kind: 'locality', city: 'تنکابن', aliases: ['بندبن', 'بند بن'] },
  { canonical: 'بهکله', kind: 'locality', city: 'تنکابن', aliases: ['بهکله'] },
  { canonical: 'پایین‌اشتوج', kind: 'locality', city: 'تنکابن', aliases: ['پایین اشتوج', 'پایین‌اشتوج'] },
  { canonical: 'پایین‌شیرود', kind: 'locality', city: 'تنکابن', aliases: ['پایین شیرود', 'پایین‌شیرود'] },
  { canonical: 'پرده‌سر', kind: 'locality', city: 'تنکابن', aliases: ['پرده سر', 'پرده‌سر'] },
  { canonical: 'پل‌سرا', kind: 'locality', city: 'تنکابن', aliases: ['پل سرا', 'پل‌سرا', 'پلسرا'] },
  { canonical: 'پلهمدشت', kind: 'locality', city: 'تنکابن', aliases: ['پلهمدشت'] },
  { canonical: 'تازه‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['تازه آباد', 'تازه‌آباد'] },
  { canonical: 'تسکا', kind: 'locality', city: 'تنکابن', aliases: ['تسکا'] },
  { canonical: 'تشکون', kind: 'locality', city: 'تنکابن', aliases: ['تشکون'] },
  { canonical: 'تقی‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['تقی آباد', 'تقی‌آباد'] },
  { canonical: 'تلوسرمحله', kind: 'locality', city: 'تنکابن', aliases: ['تلوسرمحله', 'تلوسر محله'] },
  { canonical: 'تلوسرک', kind: 'locality', city: 'تنکابن', aliases: ['تلوسرک'] },
  { canonical: 'تمشکل', kind: 'locality', city: 'تنکابن', aliases: ['تمشکل'] },
  { canonical: 'تمی‌جانک', kind: 'locality', city: 'تنکابن', aliases: ['تمی جانک', 'تمی‌جانک'] },
  { canonical: 'تنگدشت', kind: 'locality', city: 'تنکابن', aliases: ['تنگدشت'] },
  { canonical: 'توبن', kind: 'locality', city: 'تنکابن', aliases: ['توبن'] },
  { canonical: 'تودارک', kind: 'locality', city: 'تنکابن', aliases: ['تودارک'] },
  { canonical: 'توساکتی', kind: 'locality', city: 'تنکابن', aliases: ['توساکتی'] },
  { canonical: 'توساکله', kind: 'locality', city: 'تنکابن', aliases: ['توساکله'] },
  { canonical: 'توکله', kind: 'locality', city: 'تنکابن', aliases: ['توکله'] },
  { canonical: 'تیل‌پردسر', kind: 'locality', city: 'تنکابن', aliases: ['تیل پرده سر', 'تیل پردسر', 'تیل‌پرده‌سر'] },
  { canonical: 'جاده دوهزار', kind: 'locality', city: 'تنکابن', aliases: ['جاده دوهزار', 'جاده دو هزار'] },
  { canonical: 'چالدره', kind: 'locality', city: 'تنکابن', aliases: ['چال دره', 'چالدره'] },
  { canonical: 'چالو', kind: 'locality', city: 'تنکابن', aliases: ['چالو'] },
  { canonical: 'چرخچی‌محله', kind: 'locality', city: 'تنکابن', aliases: ['چرخچی محله', 'چرخچی‌محله'] },
  { canonical: 'چرستان', kind: 'locality', city: 'تنکابن', aliases: ['چرستان'] },
  { canonical: 'چلاسر', kind: 'locality', city: 'تنکابن', aliases: ['چلاسر'] },
  { canonical: 'چناربن', kind: 'locality', city: 'تنکابن', aliases: ['چناربن', 'چنار بن'] },
  { canonical: 'حاتم‌سرا', kind: 'locality', city: 'تنکابن', aliases: ['حاتم سرا', 'حاتم‌سرا'] },
  { canonical: 'حاجی‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['حاجی آباد', 'حاجی‌آباد'] },
  { canonical: 'حبیب‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['حبیب آباد', 'حبیب‌آباد'] },
  { canonical: 'خانیان', kind: 'locality', city: 'تنکابن', aliases: ['خانیان'] },
  { canonical: 'خرماکله', kind: 'locality', city: 'تنکابن', aliases: ['خرماکله'] },
  { canonical: 'خزرکنار', kind: 'locality', city: 'تنکابن', aliases: ['خزرکنار'] },
  { canonical: 'خشکبور', kind: 'locality', city: 'تنکابن', aliases: ['خشکبور'] },
  { canonical: 'خشکرود', kind: 'locality', city: 'تنکابن', aliases: ['خشکرود'] },
  { canonical: 'خلخال‌محله', kind: 'locality', city: 'تنکابن', aliases: ['خلخال محله', 'خلخال‌محله', 'خلخال محله جدید', 'خلخال محله قدیم'] },
  { canonical: 'داربار', kind: 'locality', city: 'تنکابن', aliases: ['داربار'] },
  { canonical: 'درازلات', kind: 'locality', city: 'تنکابن', aliases: ['درازلات'] },
  { canonical: 'درجان', kind: 'locality', city: 'تنکابن', aliases: ['درجان'] },
  { canonical: 'درویش‌سرا', kind: 'locality', city: 'تنکابن', aliases: ['درویش سرا', 'درویش‌سرا'] },
  { canonical: 'دریاسر', kind: 'locality', city: 'تنکابن', aliases: ['دریاسر'] },
  { canonical: 'دهگاه', kind: 'locality', city: 'تنکابن', aliases: ['دهگاه'] },
  { canonical: 'دیزپشت', kind: 'locality', city: 'تنکابن', aliases: ['دیزپشت'] },
  { canonical: 'دینارسرا', kind: 'locality', city: 'تنکابن', aliases: ['دینارسرا', 'دینار سرا'] },
  { canonical: 'رستم‌پشته', kind: 'locality', city: 'تنکابن', aliases: ['رستم پشته', 'رستم‌پشته'] },
  { canonical: 'رضامحله', kind: 'locality', city: 'تنکابن', aliases: ['رضامحله', 'رضا محله'] },
  { canonical: 'رودپشت', kind: 'locality', city: 'تنکابن', aliases: ['رودپشت'] },
  { canonical: 'رودگرمحله', kind: 'locality', city: 'تنکابن', aliases: ['رودگرمحله', 'رودگر محله'] },
  { canonical: 'زوار', kind: 'locality', city: 'تنکابن', aliases: ['زوار'] },
  { canonical: 'سرپل', kind: 'locality', city: 'تنکابن', aliases: ['سرپل'] },
  { canonical: 'سرفقیه‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['سرفقیه آباد', 'سرفقیه‌آباد'] },
  { canonical: 'سفیدآب', kind: 'locality', city: 'تنکابن', aliases: ['سفید آب', 'سفیدآب'] },
  { canonical: 'سلیم‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['سلیم آباد', 'سلیم‌آباد'] },
  { canonical: 'سلیمان‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['سلیمان آباد', 'سلیمان‌آباد'] },
  { canonical: 'سنگرمال', kind: 'locality', city: 'تنکابن', aliases: ['سنگرمال'] },
  { canonical: 'سیاه‌بند', kind: 'locality', city: 'تنکابن', aliases: ['سیاه بند', 'سیاه‌بند'] },
  { canonical: 'سیف‌محله', kind: 'locality', city: 'تنکابن', aliases: ['سیف محله', 'سیف‌محله'] },
  { canonical: 'شریف‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['شریف آباد', 'شریف‌آباد'] },
  { canonical: 'شمس‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['شمس آباد', 'شمس‌آباد'] },
  { canonical: 'شهرستانک', kind: 'locality', city: 'تنکابن', aliases: ['شهرستانک'] },
  { canonical: 'شیرج‌محله بزرگ', kind: 'locality', city: 'تنکابن', aliases: ['شیرج محله بزرگ', 'شیرج‌محله بزرگ'] },
  { canonical: 'شیرج‌محله کوچک', kind: 'locality', city: 'تنکابن', aliases: ['شیرج محله کوچک', 'شیرج‌محله کوچک'] },
  { canonical: 'شیروان‌محله', kind: 'locality', city: 'تنکابن', aliases: ['شیروان محله', 'شیروان‌محله'] },
  { canonical: 'صادق‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['صادق آباد', 'صادق‌آباد'] },
  { canonical: 'طالش‌محله', kind: 'locality', city: 'تنکابن', aliases: ['طالش محله', 'طالش‌محله'] },
  { canonical: 'طاهرک‌محله', kind: 'locality', city: 'تنکابن', aliases: ['طاهرک محله', 'طاهرک‌محله'] },
  { canonical: 'عبدالله‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['عبدالله آباد', 'عبدالله‌آباد', 'عبداله آباد'] },
  { canonical: 'عزیزآباد', kind: 'locality', city: 'تنکابن', aliases: ['عزیزآباد', 'عزیز آباد'] },
  { canonical: 'عسل‌محله', kind: 'locality', city: 'تنکابن', aliases: ['عسل محله', 'عسل‌محله'] },
  { canonical: 'علی‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['علی اباد', 'علی‌آباد', 'علی آباد'] },
  { canonical: 'عماریه', kind: 'locality', city: 'تنکابن', aliases: ['عماریه'] },
  { canonical: 'فقیه‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['فقیه آباد', 'فقیه‌آباد'] },
  { canonical: 'فقیه‌محله', kind: 'locality', city: 'تنکابن', aliases: ['فقیه محله', 'فقیه‌محله'] },
  { canonical: 'قلعه‌سر', kind: 'locality', city: 'تنکابن', aliases: ['قلعه سر', 'قلعه‌سر'] },
  { canonical: 'قلعه‌گردن', kind: 'locality', city: 'تنکابن', aliases: ['قلعه گردن', 'قلعه‌گردن'] },
  { canonical: 'گاوپل', kind: 'locality', city: 'تنکابن', aliases: ['گاوپل'] },
  { canonical: 'گراکو', kind: 'locality', city: 'تنکابن', aliases: ['گراکو'] },
  { canonical: 'گرماپشته', kind: 'locality', city: 'تنکابن', aliases: ['گرماپشته'] },
  { canonical: 'گلستان‌محله', kind: 'locality', city: 'تنکابن', aliases: ['گلستان محله', 'گلستان‌محله'] },
  { canonical: 'گلیجان', kind: 'locality', city: 'تنکابن', aliases: ['گلیجان'] },
  { canonical: 'گیل‌محله', kind: 'locality', city: 'تنکابن', aliases: ['گیل محله', 'گیل‌محله'] },
  { canonical: 'لات‌کنار', kind: 'locality', city: 'تنکابن', aliases: ['لات کنار', 'لات‌کنار'] },
  { canonical: 'لاکتراشان', kind: 'locality', city: 'تنکابن', aliases: ['لاکتراشان'] },
  { canonical: 'لپاسر', kind: 'locality', city: 'تنکابن', aliases: ['لپاسر'] },
  { canonical: 'لتاک', kind: 'locality', city: 'تنکابن', aliases: ['لتاک'] },
  { canonical: 'لزربن', kind: 'locality', city: 'تنکابن', aliases: ['لزربن'] },
  { canonical: 'لشتو', kind: 'locality', city: 'تنکابن', aliases: ['لشتو'] },
  { canonical: 'لشگرک', kind: 'locality', city: 'تنکابن', aliases: ['لشگرک'] },
  { canonical: 'لوله‌ده', kind: 'locality', city: 'تنکابن', aliases: ['لوله ده', 'لوله‌ده'] },
  { canonical: 'لیه', kind: 'locality', city: 'تنکابن', aliases: ['لیه'] },
  { canonical: 'مازندران‌محله', kind: 'locality', city: 'تنکابن', aliases: ['مازندران محله', 'مازندران‌محله'] },
  { canonical: 'مازوبن سفلی', kind: 'locality', city: 'تنکابن', aliases: ['مازوبن سفلی'] },
  { canonical: 'مازوبن علیا', kind: 'locality', city: 'تنکابن', aliases: ['مازوبن علیا'] },
  { canonical: 'مازوچال', kind: 'locality', city: 'تنکابن', aliases: ['مازوچال'] },
  { canonical: 'محمدآباد', kind: 'locality', city: 'تنکابن', aliases: ['محمدآباد', 'محمد آباد'] },
  { canonical: 'مران', kind: 'locality', city: 'تنکابن', aliases: ['مران'] },
  { canonical: 'مرکز شهر', kind: 'locality', city: 'تنکابن', aliases: ['مرکز شهر تنکابن', 'مرکز شهر شهسوار'] },
  { canonical: 'مسلم‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['مسلم آباد', 'مسلم‌آباد'] },
  { canonical: 'معلم‌کوه', kind: 'locality', city: 'تنکابن', aliases: ['معلم کوه', 'معلم‌کوه'] },
  { canonical: 'ملاحاجی‌محله', kind: 'locality', city: 'تنکابن', aliases: ['ملاحاجی محله', 'ملاحاجی‌محله'] },
  { canonical: 'منصورآباد', kind: 'locality', city: 'تنکابن', aliases: ['منصورآباد', 'منصور آباد'] },
  { canonical: 'مهاجرآباد', kind: 'locality', city: 'تنکابن', aliases: ['مهاجر آباد', 'مهاجرآباد'] },
  { canonical: 'مهدی‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['مهدی آباد', 'مهدی‌آباد'] },
  { canonical: 'مکرود', kind: 'locality', city: 'تنکابن', aliases: ['مکرود'] },
  { canonical: 'میان‌رود', kind: 'locality', city: 'تنکابن', aliases: ['میان رود', 'میان‌رود'] },
  { canonical: 'میانکوه', kind: 'locality', city: 'تنکابن', aliases: ['میانکوه'] },
  { canonical: 'نارنج‌داربن', kind: 'locality', city: 'تنکابن', aliases: ['نارنج داربن', 'نارنج‌داربن'] },
  { canonical: 'نصیرآباد', kind: 'locality', city: 'تنکابن', aliases: ['نصیرآباد', 'نصیر آباد'] },
  { canonical: 'نعمت‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['نعمت آباد', 'نعمت‌آباد'] },
  { canonical: 'نورالدین‌محله', kind: 'locality', city: 'تنکابن', aliases: ['نورالدین محله', 'نورالدین‌محله'] },
  { canonical: 'نیل‌کلایه', kind: 'locality', city: 'تنکابن', aliases: ['نیل کلایه', 'نیل‌کلایه'] },
  { canonical: 'هراتبر', kind: 'locality', city: 'تنکابن', aliases: ['هراتبر'] },
  { canonical: 'هلوکله', kind: 'locality', city: 'تنکابن', aliases: ['هلوکله'] },
  { canonical: 'همت‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['همت آباد', 'همت‌آباد'] },
  { canonical: 'کاردگرمحله', kind: 'locality', city: 'تنکابن', aliases: ['کاردگرمحله', 'کاردگر محله'] },
  { canonical: 'کاظم‌آباد', kind: 'locality', city: 'تنکابن', aliases: ['کاظم آباد', 'کاظم‌آباد'] },
  { canonical: 'کبودکلایه', kind: 'locality', city: 'تنکابن', aliases: ['کبودکلایه'] },
  { canonical: 'کترا', kind: 'locality', city: 'نشتارود', aliases: ['کترا'] },
  { canonical: 'پلنگ‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['پلنگ آباد', 'پلنگ‌آباد'] },
  { canonical: 'علی‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['علی آباد نشتارود', 'علی‌آباد نشتارود'] },
  { canonical: 'باغ‌ملی', kind: 'locality', city: 'نشتارود', aliases: ['باغ ملی نشتارود', 'باغ‌ملی نشتارود'] },
  { canonical: 'شالیزارک', kind: 'locality', city: 'نشتارود', aliases: ['شالیزارک'] },
  { canonical: 'دینارسرا', kind: 'locality', city: 'نشتارود', aliases: ['دینارسرا نشتارود', 'دینارسرای نشتارود'] },
  { canonical: 'ملاحاجی', kind: 'locality', city: 'نشتارود', aliases: ['ملاحاجی نشتارود'] },
  { canonical: 'نشتارودمحله', kind: 'locality', city: 'نشتارود', aliases: ['نشتارود محله', 'نشتارودمحله'] },
  { canonical: 'تمشکل', kind: 'locality', city: 'نشتارود', aliases: ['تمشکل نشتارود'] },
  { canonical: 'پلت‌کله', kind: 'locality', city: 'نشتارود', aliases: ['پلت کله', 'پلت‌کله'] },
  { canonical: 'کپورکله', kind: 'locality', city: 'نشتارود', aliases: ['کپور کله', 'کپورکله'] },
  { canonical: 'کرات‌کوتی', kind: 'locality', city: 'نشتارود', aliases: ['کراتکوتی', 'کرات‌کوتی'] },
  { canonical: 'سفیدآب‌جوکندان', kind: 'locality', city: 'نشتارود', aliases: ['سفیدآب جوکندان', 'سفیدآب‌جوکندان'] },
  { canonical: 'مازوبن علیا', kind: 'locality', city: 'نشتارود', aliases: ['مازوبن علیا نشتارود'] },
  { canonical: 'مازوبن سفلی', kind: 'locality', city: 'نشتارود', aliases: ['مازوبن سفلی نشتارود'] },
  { canonical: 'کوتی‌بازار', kind: 'locality', city: 'نشتارود', aliases: ['کوتی بازار', 'کوتی‌بازار'] },
  { canonical: 'سربود', kind: 'locality', city: 'نشتارود', aliases: ['سربود'] },
  { canonical: 'زوار', kind: 'locality', city: 'نشتارود', aliases: ['زوار نشتارود'] },
  { canonical: 'رودپشت', kind: 'locality', city: 'نشتارود', aliases: ['رودپشت نشتارود'] },
  { canonical: 'شمس‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['شمس آباد نشتارود', 'شمس‌آباد نشتارود'] },
  { canonical: 'همرودبن', kind: 'locality', city: 'نشتارود', aliases: ['همرودبن', 'کرسمال'] },
  { canonical: 'سرفقیه‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['سرفقیه آباد نشتارود', 'سرفقیه‌آباد نشتارود'] },
  { canonical: 'فقیه‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['فقیه آباد نشتارود', 'فقیه‌آباد نشتارود'] },
  { canonical: 'کاظم‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['کاظم آباد نشتارود', 'پلنگ آباد سفلی'] },
  { canonical: 'چالو', kind: 'locality', city: 'نشتارود', aliases: ['چالو نشتارود'] },
  { canonical: 'بندبن', kind: 'locality', city: 'نشتارود', aliases: ['بندبن نشتارود'] },
  { canonical: 'پلسرا', kind: 'locality', city: 'نشتارود', aliases: ['پلسرا نشتارود'] },
  { canonical: 'کلنگه', kind: 'locality', city: 'نشتارود', aliases: ['کلنگه نشتارود'] },
  { canonical: 'عبدالله‌آباد', kind: 'locality', city: 'نشتارود', aliases: ['عبدالله آباد نشتارود', 'هنگو'] },
  { canonical: 'سلمان‌شهر', kind: 'locality', city: 'سلمان‌شهر', aliases: ['دریاگوشه', 'دریا گوشه', 'جمشیدآباد', 'جمشید آباد', 'خرک‌آبرود', 'خرک آبرود'] },
  { canonical: 'دانیال', kind: 'locality', city: 'سلمان‌شهر', aliases: ['غار دانیال', 'دانیال'] },
  { canonical: 'امیردشت', kind: 'locality', city: 'سلمان‌شهر', aliases: ['امیردشت', 'امیر دشت'] },
  { canonical: 'ساقی‌کلایه', kind: 'locality', city: 'سلمان‌شهر', aliases: ['ساقی کلایه', 'ساقی‌کلایه'] },
  { canonical: 'کلارآباد', kind: 'city', city: 'کلارآباد', aliases: ['کلارآباد', 'کلار آباد'] },
  { canonical: 'بلوار ساحل طلایی', kind: 'street', city: 'تنکابن', aliases: ['ساحل طلایی'] },
  { canonical: 'خیابان تختی', kind: 'street', city: 'تنکابن', aliases: ['خیابان جهان‌پهلوان تختی'] },
  { canonical: 'خیابان چشمه‌کیله شرقی', kind: 'street', city: 'تنکابن', aliases: ['چشمه کیله شرقی'] },
  { canonical: 'خیابان چشمه‌کیله غربی', kind: 'street', city: 'تنکابن', aliases: ['چشمه کیله غربی'] },
  { canonical: 'خیابان میرزای تنکابنی', kind: 'street', city: 'تنکابن', aliases: ['میرزای تنکابنی'] },
  { canonical: 'کوچه ایرج', kind: 'street', city: 'تنکابن', aliases: ['ایرج'] },
  { canonical: 'کوچه بهار', kind: 'street', city: 'تنکابن', aliases: ['بهار'] },
  { canonical: 'کوچه بهارستان', kind: 'street', city: 'تنکابن', aliases: ['بهارستان'] },
  { canonical: 'کوچه پامچال', kind: 'street', city: 'تنکابن', aliases: ['پامچال'] },
  { canonical: 'کوچه ساحل', kind: 'street', city: 'تنکابن', aliases: ['ساحل'] },
  { canonical: 'کوچه سروستان', kind: 'street', city: 'تنکابن', aliases: ['سروستان'] },
  { canonical: 'کوچه شقایق دریایی', kind: 'street', city: 'تنکابن', aliases: ['شقایق دریایی'] },
  { canonical: 'کوچه شهید تندگویان', kind: 'street', city: 'تنکابن', aliases: ['شهید تندگویان'] },
  { canonical: 'کوچه فرهنگ', kind: 'street', city: 'تنکابن', aliases: ['فرهنگ'] },
  { canonical: 'کوچه کانون صالحی', kind: 'street', city: 'تنکابن', aliases: ['کانون صالحی ۱', 'کانون صالحی ۲'] },
  { canonical: 'کوچه گل ارکیده', kind: 'street', city: 'تنکابن', aliases: ['گل ارکیده'] },
  { canonical: 'کوچه گل ختمی', kind: 'street', city: 'تنکابن', aliases: ['گل ختمی ۱', 'گل ختمی ۲'] },
  { canonical: 'کوچه لادن', kind: 'street', city: 'تنکابن', aliases: ['لادن'] },
  { canonical: 'کوچه مجتمع امپراتور', kind: 'street', city: 'تنکابن', aliases: ['مجتمع امپراتور'] },
  { canonical: 'کوچه مرجان', kind: 'street', city: 'تنکابن', aliases: ['مرجان'] },
  { canonical: 'کوچه مروارید', kind: 'street', city: 'تنکابن', aliases: ['مروارید'] },
  { canonical: 'کوچه مهتاب', kind: 'street', city: 'تنکابن', aliases: ['مهتاب'] },
  { canonical: 'کوچه مهستان', kind: 'street', city: 'تنکابن', aliases: ['مهستان'] },
  { canonical: 'کوچه میدان کریم‌آباد', kind: 'street', city: 'تنکابن', aliases: ['میدان کریم آباد ۱', 'میدان کریم آباد ۲'] },
  { canonical: 'کوچه نسترن', kind: 'street', city: 'تنکابن', aliases: ['نسترن', 'کوچه نسترن سبزه میدان'] },
  { canonical: 'کوچه یاسمن', kind: 'street', city: 'تنکابن', aliases: ['یاسمن'] },
  { canonical: 'بلوار امام خمینی', kind: 'street', city: 'رامسر', aliases: ['خیابان امام خمینی'] },
  { canonical: 'بلوار شهید باهنر', kind: 'street', city: 'رامسر', aliases: ['خیابان شهید باهنر', 'بلوار باهنر'] },
  { canonical: 'بلوار طالقانی', kind: 'street', city: 'رامسر', aliases: ['خیابان طالقانی', 'بلوار آیت‌الله طالقانی'] },
  { canonical: 'خیابان شهدا', kind: 'street', city: 'رامسر', aliases: [] },
  { canonical: 'خیابان شهید رزاقی', kind: 'street', city: 'رامسر', aliases: ['خیابان رزاقی', 'شهید رزاقی'] },
  { canonical: 'خیابان شهید عباس مفرد', kind: 'street', city: 'رامسر', aliases: ['خیابان عباس مفرد', 'خیابان شهدای عباس مفرد'] },
  { canonical: 'خیابان شهید مطهری', kind: 'street', city: 'رامسر', aliases: ['خیابان مطهری', 'بلوار مطهری'] },
  { canonical: 'خیابان فردوسی', kind: 'street', city: 'رامسر', aliases: [] },
  { canonical: 'خیابان کشاورزی', kind: 'street', city: 'رامسر', aliases: [] },
  { canonical: 'خیابان ولیعصر', kind: 'street', city: 'رامسر', aliases: ['ولی عصر'] },
  { canonical: 'آزادگان', kind: 'locality', city: 'سلمان‌شهر', aliases: ['شهرک آزادگان'] },
  { canonical: 'اسبچین', kind: 'locality', city: 'سلمان‌شهر', aliases: ['اسب چین', 'اسب‌چین'] },
  { canonical: 'بلوار تختی', kind: 'street', city: 'سلمان‌شهر', aliases: ['تختی'] },
  { canonical: 'بلوار مطهری', kind: 'street', city: 'سلمان‌شهر', aliases: ['بلوار شهید مطهری', 'مطهری'] },
  { canonical: 'تیلاکنار', kind: 'locality', city: 'سلمان‌شهر', aliases: ['تیلا کنار'] },
  { canonical: 'جیسا', kind: 'locality', city: 'سلمان‌شهر', aliases: ['جیسای سلمان‌شهر'] },
  { canonical: 'خیابان آرا', kind: 'street', city: 'سلمان‌شهر', aliases: ['آرا', 'کوی آرا'] },
  { canonical: 'خیابان امام خمینی', kind: 'street', city: 'سلمان‌شهر', aliases: ['امام خمینی'] },
  { canonical: 'خیابان توسکا', kind: 'street', city: 'سلمان‌شهر', aliases: ['توسکا'] },
  { canonical: 'خیابان دریاگوشه', kind: 'street', city: 'سلمان‌شهر', aliases: ['دریا گوشه', 'دریاگوشه'] },
  { canonical: 'خیابان شالیزار', kind: 'street', city: 'سلمان‌شهر', aliases: ['شالیزار'] },
  { canonical: 'خیابان طالقانی', kind: 'street', city: 'سلمان‌شهر', aliases: ['آیت الله طالقانی', 'آیت‌الله طالقانی'] },
  { canonical: 'خیابان گل', kind: 'street', city: 'سلمان‌شهر', aliases: [] },
  { canonical: 'خیابان هتل قدیم', kind: 'street', city: 'سلمان‌شهر', aliases: ['هتل قدیمی', 'هتل قدیم'] },
  { canonical: 'دریاگوشه', kind: 'locality', city: 'سلمان‌شهر', aliases: ['دریا گوشه', 'شهرک دریاگوشه'] },
  { canonical: 'سلامت‌سرا', kind: 'locality', city: 'سلمان‌شهر', aliases: ['سلامت سرا'] },
  { canonical: 'شمس‌آباد', kind: 'locality', city: 'سلمان‌شهر', aliases: ['شمس آباد'] },
  { canonical: 'شهرک الهیه', kind: 'locality', city: 'سلمان‌شهر', aliases: ['الهیه'] },
  { canonical: 'شهرک امیردشت', kind: 'locality', city: 'سلمان‌شهر', aliases: ['امیردشت'] },
  { canonical: 'شهرک پالم', kind: 'locality', city: 'سلمان‌شهر', aliases: ['پالم'] },
  { canonical: 'شهرک توسکا', kind: 'locality', city: 'سلمان‌شهر', aliases: ['توسکا'] },
  { canonical: 'شهرک شقایق', kind: 'locality', city: 'سلمان‌شهر', aliases: ['شقایق'] },
  { canonical: 'شهرک شیرین', kind: 'locality', city: 'سلمان‌شهر', aliases: ['دهکده شیرین', 'شیرین'] },
  { canonical: 'شهرک صنعتی سلمان‌شهر', kind: 'locality', city: 'سلمان‌شهر', aliases: ['شهرک صنعتی'] },
  { canonical: 'توبن', kind: 'locality', city: 'نشتارود', aliases: [] },
  { canonical: 'خشکداران', kind: 'locality', city: 'نشتارود', aliases: [] },
  { canonical: 'خیابان ۱۵ خرداد', kind: 'street', city: 'نشتارود', aliases: ['۱۵خرداد', 'پانزده خرداد'] },
  { canonical: 'خیابان ۱۷ شهریور', kind: 'street', city: 'نشتارود', aliases: ['۱۷شهریور', 'هفده شهریور'] },
  { canonical: 'خیابان خشکداران', kind: 'street', city: 'نشتارود', aliases: ['خشکداران'] },
  { canonical: 'خیابان گاز شرقی', kind: 'street', city: 'نشتارود', aliases: ['گاز شرقی'] },
  { canonical: 'رودگر', kind: 'locality', city: 'نشتارود', aliases: ['رودگرمحله', 'رودگر محله'] },
  { canonical: 'ستاره خزر', kind: 'locality', city: 'نشتارود', aliases: ['شهرک ستاره خزر'] },
  { canonical: 'کوچه میرچی', kind: 'street', city: 'نشتارود', aliases: ['میرچی'] },
  { canonical: 'کوچه وحدت', kind: 'street', city: 'نشتارود', aliases: ['وحدت'] },
  { canonical: 'کوچه ولیعصر', kind: 'street', city: 'نشتارود', aliases: ['ولیعصر', 'ولی عصر'] },
  { canonical: 'مکارود', kind: 'locality', city: 'نشتارود', aliases: [] },
];

function normalizePlaceText(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[‌\u200c]/g, ' ')
    .replace(/[\-ـ_،,؛;.!؟?()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Resolve known aliases from the original message after model extraction.
 * Match whole words/phrases so a locality such as «لیه» cannot match inside
 * an unrelated word such as «نقلیه». Prefer the longest explicit place name.
 */
export function normalizeKnownLocation<T extends {
  location?: {
    city?: unknown;
    neighborhood?: unknown;
    street?: unknown;
    province?: unknown;
  };
}>(result: T, originalMessage: string): T {
  if (!result.location || typeof result.location !== 'object') return result;

  const normalizedMessage = ` ${normalizePlaceText(originalMessage)} `;
  const matches = PLACE_CATALOG
    .flatMap((entry) => {
      const names = [...new Set([entry.canonical, ...entry.aliases])];
      return names.map((alias) => ({
        entry,
        normalizedAlias: normalizePlaceText(alias),
      }));
    })
    .filter((item) =>
      item.normalizedAlias.length >= 3 &&
      normalizedMessage.includes(` ${item.normalizedAlias} `),
    )
    .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);

  const bestOfKind = (kind: PlaceEntry['kind']) =>
    matches.find((item) => item.entry.kind === kind);

  const cityMatch = bestOfKind('city');
  const localityMatch = bestOfKind('locality');
  const streetMatch = bestOfKind('street');

  const resolvedCity =
    cityMatch?.entry.canonical ??
    localityMatch?.entry.city ??
    streetMatch?.entry.city ??
    null;

  if (resolvedCity) {
    result.location.city = resolvedCity;
    result.location.province = 'مازندران';
  }

  if (cityMatch) {
    result.location.neighborhood = null;
    result.location.street = null;
  } else {
    if (localityMatch && (!resolvedCity || localityMatch.entry.city === resolvedCity)) {
      result.location.neighborhood = localityMatch.entry.canonical;
    }
    if (streetMatch && (!resolvedCity || streetMatch.entry.city === resolvedCity)) {
      result.location.street = streetMatch.entry.canonical;
    }
  }

  return result;
}
