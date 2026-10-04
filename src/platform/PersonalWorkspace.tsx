import {translate as t, useLocale} from './i18n';
import {useEffect,useState,lazy,Suspense} from 'react';
import {Activity} from 'lucide-react';
import {api,faDateTime,faNumber,type User,type Catalog} from './api';
import {w} from './copy';

export type Preferences={density:'comfortable'|'compact';startPage:string;notifications:boolean};
const ProfileWorkspace=lazy(()=>import('./ProfileWorkspace'));
const MonitoringWorkspace=lazy(()=>import('./MonitoringWorkspace'));
export const eventLabels:Record<string,string>={'auth.login':'ورود به سامانه','auth.logout':'خروج از سامانه','auth.failed':'تلاش ورود ناموفق','auth.password':'تغییر رمز','record.created':'ثبت رکورد','record.updated':'تغییر یا بررسی رکورد','user.created':'ایجاد حساب','user.updated':'تغییر دسترسی حساب','profile.updated':'ویرایش پروفایل و تنظیمات','demo.record.seeded':'آماده‌سازی نمونه آموزشی'};
export function EventTable({events}:{events:any[]}){
 const{dir}=useLocale();
 const[query,setQuery]=useState(''),[action,setAction]=useState('');
 const actions:Record<string,string>={
  'auth.login':w('ورود به سامانه','Signed in','تسجيل الدخول','Oturum açıldı'),
  'auth.logout':w('خروج از سامانه','Signed out','تسجيل الخروج','Oturum kapatıldı'),
  'auth.failed':w('تلاش ورود ناموفق','Sign-in attempt failed','محاولة دخول فاشلة','Oturum açma başarısız'),
  'auth.password':w('تغییر رمز','Password changed','تغيير كلمة المرور','Parola değiştirildi'),
  'record.created':w('ثبت پیش‌نویس جدید','Draft created','إنشاء مسودة','Taslak oluşturuldu'),
  'record.updated':w('ویرایش یا بررسی رکورد','Record edited or reviewed','تعديل السجل أو مراجعته','Kayıt düzenlendi veya incelendi'),
  'user.created':w('ایجاد حساب','Account created','إنشاء حساب','Hesap oluşturuldu'),
  'user.updated':w('تغییر دسترسی حساب','Account access changed','تغيير صلاحيات الحساب','Hesap erişimi değiştirildi'),
  'auth.session_revoked':w('ابطال نشست','Session revoked','إبطال جلسة','Oturum iptal edildi'),
  'auth.sessions_revoked':w('خروج نشست‌های دیگر','Other sessions revoked','إبطال الجلسات الأخرى','Diğer oturumlar iptal edildi'),
  'auth.owner_recovery':w('بازیابی امن مدیر','Administrator securely recovered','استرداد آمن لحساب المدير','Yönetici güvenle kurtarıldı'),
  'user.password_reset':w('بازنشانی رمز کاربر','User password reset','إعادة تعيين كلمة مرور المستخدم','Kullanıcı parolası sıfırlandı'),
  'profile.updated':w('ویرایش پروفایل و تنظیمات','Profile and preferences updated','تحديث الملف الشخصي والإعدادات','Profil ve tercihler güncellendi'),
  'twin.created':w('ثبت سناریوی دوقلوی مهندسی','Engineering twin scenario saved','حفظ سيناريو التوأم الهندسي','Mühendislik ikizi senaryosu kaydedildi'),
  'twin.updated':w('ثبت بازنگری دوقلوی مهندسی','Engineering twin revision saved','حفظ مراجعة التوأم الهندسي','Mühendislik ikizi sürümü kaydedildi'),
  'demo.record.seeded':w('آماده‌سازی نمونه آموزشی','Training sample prepared','إعداد نموذج تدريبي','Eğitim örneği hazırlandı'),
 };
 const statuses:Record<string,string>={draft:w('پیش‌نویس','Draft','مسودة','Taslak'),submitted:w('در انتظار بررسی','Awaiting review','بانتظار المراجعة','İnceleme bekliyor'),approved:w('تأیید شده','Approved','معتمد','Onaylandı'),rejected:w('رد شده','Rejected','مرفوض','Reddedildi')};
 const kinds:Record<string,string>={production:t('تولید و بهره‌وری'),inspection:t('بازرسی کیفیت و ردیابی'),maintenance:t('دستورکار نگهداری'),energy:t('پایش انرژی'),asset:t('شناسنامه تجهیزات'),recipe:t('دستور ساخت و نسخه مهندسی'),calibration:t('کنترل کالیبراسیون'),ncr:t('عدم انطباق و اقدام اصلاحی'),inventory:t('مواد و قطعات یدکی')};
 const roles:Record<string,string>={admin:t('مدیر سامانه'),executive:t('مدیر کارخانه'),production:t('مسئول تولید'),quality:t('کنترل کیفیت'),maintenance:t('نگهداری و تعمیرات'),energy:t('کارشناس انرژی'),engineering:t('مهندسی و توسعه'),auditor:t('ناظر و ارزیاب')};
 const entityLabels:Record<string,string>={order:w('سفارش تولید','Production order','أمر إنتاج','Üretim emri'),lot:w('بچ تولید','Production lot','دفعة إنتاج','Üretim partisi'),task:w('کار اجرایی','Execution task','مهمة تنفيذ','Yürütme görevi'),movement:w('گردش مواد','Material movement','حركة مواد','Malzeme hareketi')};
 const verbLabels:Record<string,string>={edit:w('ویرایش پیش‌نویس','Draft edited','تعديل المسودة','Taslak düzenlendi'),assign:w('تخصیص مجدد مسئول','Owner reassigned','إعادة إسناد المسؤول','Sorumlu yeniden atandı'),created:w('ثبت','Created','إنشاء','Oluşturuldu'),release:w('آزادسازی','Released','إطلاق','Serbest bırakıldı'),cancel:w('لغو','Cancelled','إلغاء','İptal edildi'),completed:w('تکمیل سفارش','Order completed','إكمال الأمر','Emir tamamlandı'),start:w('شروع','Started','بدء','Başlatıldı'),finish:w('پایان تولید','Production finished','انتهاء الإنتاج','Üretim bitirildi'),block:w('قرنطینه','Held','حجر','Bekletildi'),rework:w('بازکاری','Rework','إعادة تشغيل','Yeniden işleme'),complete:w('انجام اقدام','Action completed','إكمال الإجراء','İşlem tamamlandı'),verify:w('راستی‌آزمایی مستقل','Independently verified','تحقق مستقل','Bağımsız doğrulandı'),reopen:w('بازگشایی','Reopened','إعادة فتح','Yeniden açıldı')};
 const label=(code:string)=>{if(actions[code])return actions[code];const parts=code.split('.');if(parts[0]==='operations'&&entityLabels[parts[1]]&&verbLabels[parts[2]])return entityLabels[parts[1]]+' · '+verbLabels[parts[2]];return w('رخداد ثبت‌شده سامانه','Recorded system event','حدث نظام مسجل','Kaydedilmiş sistem olayı');};
 const rows=events.map(event=>{
  let details:Record<string,unknown>={};
  try{const parsed=typeof event.details==='string'?JSON.parse(event.details):event.details;if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))details=parsed;}catch{}
  const date=event.created_at||event.createdAt;
  const dateLabel=date&&Number.isFinite(new Date(date).getTime())?faDateTime(date):w('زمان ثبت نشده','Time unavailable','الوقت غير متاح','Zaman mevcut değil');
  const actor=event.actor_name||event.actorName||w('سامانه','System','النظام','Sistem');
  const actionCode=String(event.action||'');
  const kind=typeof details.kind==='string'?(kinds[details.kind]||details.kind):'';
  const from=typeof details.from==='string'?details.from:typeof details.previous==='string'?details.previous:'';
  const to=typeof details.to==='string'?details.to:typeof details.status==='string'?details.status:'';
  const note=typeof details.note==='string'?details.note:typeof details.reason==='string'?details.reason:'';
  const sourceId=typeof details.sourceId==='string'?details.sourceId:'';
  const version=typeof details.version==='number'?details.version:null;
  const actorRole=event.actor_role||event.actorRole;
  const target=String(event.target||'');
  const role=typeof details.role==='string'?(roles[details.role]||details.role):'';
  const searchable=[label(actionCode),kind,actor,actorRole?roles[actorRole]||actorRole:'',dateLabel,date,target,note,sourceId,role,from?statuses[from]||from:'',to?statuses[to]||to:''].join(' ').normalize('NFKC').toLocaleLowerCase();
  return{event,details,date,dateLabel,actor,actionCode,kind,from,to,note,sourceId,version,actorRole,target,role,searchable};
 });
 const normalizedQuery=query.trim().normalize('NFKC').toLocaleLowerCase();
 const filtered=rows.filter(row=>(!action||row.actionCode===action)&&(!normalizedQuery||row.searchable.includes(normalizedQuery)));
 const eventTypes=Array.from(new Set(rows.map(row=>row.actionCode))).sort();
 if(!events.length)return <div className="event-empty empty-state"><Activity/><h3>{w('هنوز فعالیتی ثبت نشده است','No activity recorded yet','لا توجد أنشطة مسجلة بعد','Henüz etkinlik kaydedilmedi')}</h3><p>{w('رخدادهای مجاز این بخش پس از انجام عملیات نمایش داده می‌شوند.','Authorized events appear here after an operation.','تظهر أحداث هذا القسم المسموح بها بعد تنفيذ عملية.','İzin verilen olaylar işlem sonrasında burada görünür.')}</p></div>;
 return <div className="event-workspace">
  <div className="event-toolbar">
   <label className="event-search">{w('جستجوی فعالیت','Search activity','البحث في الأنشطة','Etkinlik ara')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={w('نام عامل، شرح تصمیم یا مرجع…','Actor, decision note or reference…','اسم المستخدم، سبب القرار أو المرجع…','Kişi, karar açıklaması veya referans…')}/></label>
   <label className="event-filter">{w('نوع فعالیت','Event type','نوع النشاط','Etkinlik türü')}<select value={action} onChange={e=>setAction(e.target.value)}><option value="">{w('همه فعالیت‌ها','All events','كل الأنشطة','Tüm etkinlikler')}</option>{eventTypes.map(code=><option key={code} value={code}>{label(code)}</option>)}</select></label>
   {(query||action)&&<button type="button" className="event-clear" onClick={()=>{setQuery('');setAction('');}}>{w('پاک کردن فیلتر','Clear filters','مسح الفلاتر','Filtreleri temizle')}</button>}
  </div>
  <p className="event-count" role="status">{faNumber(filtered.length)} / {faNumber(events.length)} · {w('رخداد نمایش داده شده','events shown','أحداث معروضة','olay gösteriliyor')}</p>
  {filtered.length?<ol className="event-list">{filtered.map(row=><li key={row.event.id} className="event-item">
   <div className="event-meta"><span className="event-actor">{row.actor}{row.actorRole&&<small> · {roles[row.actorRole]||row.actorRole}</small>}</span><time dateTime={row.date&&Number.isFinite(new Date(row.date).getTime())?new Date(row.date).toISOString():undefined}>{row.dateLabel}</time></div>
   <div className="event-title"><strong>{label(row.actionCode)}</strong>{row.kind&&<span className="event-kind">{row.kind}</span>}</div>
   {(row.from||row.to||row.version!==null)&&<div className="event-summary event-status-line">{row.from&&<span className={'badge '+row.from}>{statuses[row.from]||row.from}</span>}{row.from&&row.to&&<span aria-label={w('تغییر وضعیت به','Status changed to','تغيّرت الحالة إلى','Durum değişti')}>{dir==='rtl'?'←':'→'}</span>}{row.to&&<span className={'badge '+row.to}>{statuses[row.to]||row.to}</span>}{row.version!==null&&<span>{w('نسخه','Version','الإصدار','Sürüm')} {faNumber(row.version)}</span>}</div>}
   {row.sourceId&&<p className="event-summary">{w('پیش‌نویس اصلاحی از رکورد','Correction draft from record','مسودة تصحيح من السجل','Kayıttan düzeltme taslağı')} <code dir="ltr">{row.sourceId}</code></p>}
   {row.role&&<p className="event-summary">{w('نقش حساب','Account role','دور الحساب','Hesap rolü')}: {row.role}</p>}
   {typeof row.details.active==='boolean'&&<p className="event-summary">{row.details.active?w('حساب فعال','Account enabled','الحساب مفعّل','Hesap etkin'):w('حساب غیرفعال','Account disabled','الحساب معطّل','Hesap devre dışı')}</p>}
   {row.note&&<div className="event-note"><strong>{w('شرح تصمیم','Decision note','سبب القرار','Karar açıklaması')}</strong><p dir="auto">{row.note}</p></div>}
   <details className="event-technical"><summary>{w('مرجع و جزئیات فنی','Reference and technical details','المرجع والتفاصيل التقنية','Referans ve teknik ayrıntılar')}</summary><dl>{row.target&&<><dt>{w('مرجع','Reference','المرجع','Referans')}</dt><dd><code dir="ltr">{row.target}</code></dd></>}<dt>{w('کد رخداد','Event code','رمز الحدث','Olay kodu')}</dt><dd><code dir="ltr">{row.actionCode}</code></dd></dl><pre dir="ltr">{Object.keys(row.details).length?JSON.stringify(row.details,null,2):typeof row.event.details==='string'?row.event.details:'{}'}</pre></details>
  </li>)}</ol>:<div className="event-empty empty-state"><Activity/><h3>{w('فعالیتی مطابق فیلتر پیدا نشد','No matching activity','لم يتم العثور على نشاط مطابق','Eşleşen etkinlik bulunamadı')}</h3><p>{w('عبارت جستجو یا نوع فعالیت را تغییر دهید.','Change the search text or event type.','غيّر نص البحث أو نوع النشاط.','Arama metnini veya etkinlik türünü değiştirin.')}</p></div>}
 </div>;
}
export function PersonalWorkspace({page,user,catalog,onUpdate}:{page:string;user:User;catalog:Catalog[];onUpdate:(user:User,preferences:Preferences)=>void}){
 const [events,setEvents]=useState<any[]>([]),[error,setError]=useState('');
 useEffect(()=>{if(page!=='activity')return;let live=true;setError('');setEvents([]);api<any>('/activity').then(r=>{if(live)setEvents(r.events);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[page,user.id]);
 if(page==='activity')return <section className="panel personal-panel">{error&&<div className="notice error" role="alert">{t(error)}</div>}<div className="panel-title"><h2>{t('فعالیت‌های حساب من')}</h2><Activity size={20}/></div><p className="section-caption">{t('۲۰۰ رویداد آخر حساب شما؛ سوابق سایر کاربران در این بخش نمایش داده نمی‌شوند.')}</p><EventTable events={events}/></section>;
 return <Suspense fallback={<div className="panel">{t('در حال دریافت پروفایل…')}</div>}><ProfileWorkspace page={page} user={user} catalog={catalog} onUpdate={onUpdate}/></Suspense>;
}
export function SystemMonitor(){return <Suspense fallback={<div className="panel">{t('در حال دریافت وضعیت…')}</div>}><MonitoringWorkspace/></Suspense>;}
