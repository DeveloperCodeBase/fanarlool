export const roles = {
  admin: 'مدیر سامانه', executive: 'مدیر کارخانه', production: 'مسئول تولید', quality: 'کنترل کیفیت',
  maintenance: 'نگهداری و تعمیرات', energy: 'کارشناس انرژی', engineering: 'مهندسی و توسعه', auditor: 'ناظر و ارزیاب',
};
const all = Object.keys(roles);
const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
export const schemas = {
  production: { title: 'تولید و بهره‌وری', description: 'ثبت بچ و شیفت، زمان کار و ضایعات؛ محاسبه OEE از داده ثبت‌شده', read: all, write: ['production','executive'], approve: ['executive'], fields: [field('batch','شناسه بچ'),field('line','خط تولید'),field('product','کد محصول'),field('date','تاریخ شیفت','date'),field('shift','شیفت','select',{options:['صبح','عصر','شب']}),field('plannedMinutes','زمان برنامه‌ریزی‌شده دقیقه','number',{min:1,max:1440}),field('runMinutes','زمان کارکرد دقیقه','number',{min:0,max:1440}),field('idealCycleSeconds','سیکل ایده‌آل ثانیه','number',{min:0.01,max:86400}),field('total','تعداد تولید','number',{min:0,max:1e7,integer:true}),field('good','تعداد سالم','number',{min:0,max:1e7,integer:true}),field('downtimeReason','علت توقف','text',{optional:true})] },
  inspection: { title: 'بازرسی کیفیت و ردیابی', description: 'اندازه‌گیری دستی مستند؛ پذیرش توسط شخص دوم و حفظ ردیابی بچ', read: ['admin','executive','quality','production','engineering','auditor'], write: ['quality'], approve: ['quality','executive'], fields: [field('batch','شناسه بچ'),field('part','کد قطعه'),field('sampleCount','تعداد نمونه','number',{min:1,max:10000,integer:true}),field('dimension','پارامتر اندازه‌گیری'),field('nominal','مقدار اسمی mm','number',{min:0,max:10000}),field('tolerance','تلرانس ± mm','number',{min:0,max:1000}),field('measured','میانگین اندازه‌گیری mm','number',{min:0,max:10000}),field('defects','تعداد معیوب','number',{min:0,max:10000,integer:true}),field('instrument','شناسه ابزار کالیبره'),field('notes','شرح عیب و روش','textarea',{optional:true})] },
  maintenance: { title: 'دستورکار نگهداری', description: 'ثبت درخواست، اولویت و اقدام؛ بدون پیش‌بینی ساختگی عمر تجهیز', read: all, write: ['maintenance','production'], approve: ['maintenance','executive'], fields: [field('asset','شناسه تجهیز'),field('title','عنوان درخواست'),field('priority','اولویت','select',{options:['عادی','بالا','بحرانی']}),field('due','موعد رسیدگی','date'),field('symptom','علائم و اقدام پیشنهادی','textarea'),field('downtimeMinutes','مدت توقف دقیقه','number',{min:0,max:100000}),field('resolution','شرح رفع عیب','textarea',{optional:true})] },
  energy: { title: 'پایش انرژی', description: 'قرائت واقعی کنتور؛ تفکیک برق، گاز و هوای فشرده و شدت مصرف', read: ['admin','executive','energy','engineering','auditor'], write: ['energy'], approve: ['executive'], fields: [field('meter','شناسه کنتور'),field('line','خط یا مصرف‌کننده'),field('date','تاریخ قرائت','date'),field('carrier','حامل','select',{options:['برق kWh','گاز m³','هوای فشرده m³']}),field('readingStart','قرائت ابتدا','number',{min:0,max:1e12}),field('readingEnd','قرائت انتها','number',{min:0,max:1e12}),field('tonnage','تناژ تولید','number',{min:0,max:1e6}),field('outageMinutes','قطعی یا محدودیت دقیقه','number',{min:0,max:1440}),field('notes','شرح وضعیت','textarea',{optional:true})] },
  asset: { title: 'شناسنامه تجهیزات', description: 'دارایی، ریسک، محل نصب و دوره سرویس با قابلیت تأمین داخل', read: all, write: ['engineering','maintenance'], approve: ['executive'], fields: [field('code','شناسه تجهیز'),field('name','نام تجهیز'),field('line','خط و محل'),field('criticality','بحرانی بودن','select',{options:['کم','متوسط','زیاد']}),field('manufacturer','سازنده'),field('serviceIntervalDays','دوره سرویس روز','number',{min:1,max:3650,integer:true}),field('lastService','آخرین سرویس','date'),field('spareSource','منبع قطعات یدکی','text',{optional:true})] },
  recipe: { title: 'دستور ساخت و نسخه مهندسی', description: 'هندسه فنر، شناسه مواد و بازنگری؛ انتشار با تأیید مستقل', read: ['admin','executive','engineering','quality','production','auditor'], write: ['engineering'], approve: ['quality','executive'], fields: [field('part','کد محصول'),field('revision','بازنگری'),field('material','گرید مفتول'),field('wireDiameter','قطر مفتول mm','number',{min:0.1,max:100}),field('meanDiameter','قطر میانگین حلقه mm','number',{min:1,max:10000}),field('activeCoils','تعداد حلقه فعال','number',{min:1,max:1000}),field('freeLength','طول آزاد mm','number',{min:1,max:10000}),field('standard','مرجع معیار پذیرش'),field('notes','پارامترهای فرآیند و محدودیت','textarea')] },
  calibration: { title: 'کنترل کالیبراسیون', description: 'تاریخ اعتبار ابزار و مرجع گواهی؛ جلوگیری از ادعای گواهی خودکار', read: ['admin','executive','quality','engineering','auditor'], write: ['quality','engineering'], approve: ['quality','executive'], fields: [field('instrument','شناسه ابزار'),field('name','نام ابزار'),field('certificate','شماره گواهی آزمایشگاه'),field('calibratedAt','تاریخ کالیبراسیون','date'),field('expiresAt','اعتبار تا','date'),field('lab','آزمایشگاه'),field('uncertainty','عدم قطعیت و واحد'),field('notes','شرح کنترل','textarea',{optional:true})] },
  ncr: { title: 'عدم انطباق و اقدام اصلاحی', description: 'قرنطینه، علت ریشه‌ای و اثربخشی اقدام اصلاحی با مسئول مشخص', read: ['admin','executive','quality','production','engineering','auditor'], write: ['quality','production'], approve: ['quality','executive'], fields: [field('batch','شناسه بچ'),field('title','عنوان عدم انطباق'),field('severity','شدت','select',{options:['جزئی','عمده','بحرانی']}),field('containment','اقدام مهار و قرنطینه','textarea'),field('rootCause','علت ریشه‌ای','textarea',{optional:true}),field('action','اقدام اصلاحی','textarea',{optional:true}),field('owner','مسئول پیگیری'),field('due','مهلت','date')] },
  inventory: { title: 'مواد و قطعات یدکی', description: 'موجودی ثبت‌شده، حد سفارش و ردیابی ذوب؛ بدون اتصال ادعایی ERP', read: ['admin','executive','production','maintenance','engineering','quality','auditor'], write: ['production','maintenance'], approve: ['executive'], fields: [field('code','کد قلم'),field('name','نام قلم'),field('lot','بچ یا شماره ذوب'),field('unit','واحد','select',{options:['kg','عدد','لیتر']}),field('quantity','موجودی','number',{min:0,max:1e12}),field('minimum','حد سفارش','number',{min:0,max:1e12}),field('supplier','تأمین‌کننده'),field('location','محل نگهداری')] },
};
export function can(role, kind, action = 'read') {
  return !!schemas[kind] && (role === 'admin' || schemas[kind][action]?.includes(role));
}
export function validateRecord(kind, data) {
  const schema = schemas[kind];
  if (!schema || !data || typeof data !== 'object' || Array.isArray(data)) throw new Error('نوع یا محتوای رکورد معتبر نیست');
  const clean = {};
  for (const f of schema.fields) {
    const v = data[f.key];
    if (f.optional && (v === undefined || v === '')) { clean[f.key] = ''; continue; }
    if (f.type === 'number') {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < f.min || v > f.max || (f.integer && !Number.isInteger(v))) throw new Error(`${f.label} خارج از محدوده است`);
      clean[f.key] = v;
    } else {
      if (typeof v !== 'string' || !v.trim() || v.length > (f.type === 'textarea' ? 2500 : 250)) throw new Error(`${f.label} معتبر نیست`);
      clean[f.key] = v.trim();
      if (f.options && !f.options.includes(v)) throw new Error(`${f.label} انتخاب معتبر نیست`);
      if (f.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v).toISOString().slice(0,10) !== v)) throw new Error(`${f.label} تاریخ معتبر نیست`);
    }
  }
  if (kind === 'production' && (clean.good > clean.total || clean.runMinutes > clean.plannedMinutes || (clean.total > 0 && clean.runMinutes === 0) || clean.idealCycleSeconds * clean.total > clean.runMinutes * 60 * 1.001)) throw new Error('تعداد سالم، زمان کارکرد یا سیکل ایده‌آل با تولید سازگار نیست');
  if (kind === 'inspection' && clean.defects > clean.sampleCount) throw new Error('تعداد معیوب بیش از نمونه است');
  if (kind === 'energy' && clean.readingEnd < clean.readingStart) throw new Error('قرائت انتها کمتر از ابتدا است');
  if (kind === 'calibration' && clean.expiresAt <= clean.calibratedAt) throw new Error('اعتبار باید پس از کالیبراسیون باشد');
  if (kind === 'recipe' && clean.meanDiameter <= clean.wireDiameter) throw new Error('قطر حلقه باید بیش از قطر مفتول باشد');
  return clean;
}
export function productionKpis(records) {
  const rows = records.filter(r => r.kind === 'production' && r.status === 'approved').map(r => r.data);
  const planned = rows.reduce((a,r) => a+r.plannedMinutes,0), run = rows.reduce((a,r)=>a+r.runMinutes,0);
  const total = rows.reduce((a,r)=>a+r.total,0), good = rows.reduce((a,r)=>a+r.good,0);
  const ideal = rows.reduce((a,r)=>a+r.idealCycleSeconds*r.total/60,0);
  const availability = planned ? run/planned : null, performance = run ? ideal/run : null, quality = total ? good/total : null;
  return { planned, run, total, good, scrap:total-good, availability, performance, quality, oee: availability !== null && performance !== null && quality !== null ? availability*performance*quality : null, shifts:rows.length };
}
