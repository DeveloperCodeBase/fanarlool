import {translate as t, useLocale, LanguageSelector} from './i18n';
import {useEffect,useState} from 'react';
import {UserRound,Save,Activity,Settings,ShieldCheck,Server,RefreshCw} from 'lucide-react';
import {api,faDateTime,faNumber,type User,type Catalog} from './api';
import {w} from './copy';

export type Preferences={density:'comfortable'|'compact';startPage:string;notifications:boolean};
type Profile={user:User;department:string;jobTitle:string;email:string;phone:string;preferences:Preferences};
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
  'profile.updated':w('ویرایش پروفایل و تنظیمات','Profile and preferences updated','تحديث الملف الشخصي والإعدادات','Profil ve tercihler güncellendi'),
  'demo.record.seeded':w('آماده‌سازی نمونه آموزشی','Training sample prepared','إعداد نموذج تدريبي','Eğitim örneği hazırlandı'),
 };
 const statuses:Record<string,string>={draft:w('پیش‌نویس','Draft','مسودة','Taslak'),submitted:w('در انتظار بررسی','Awaiting review','بانتظار المراجعة','İnceleme bekliyor'),approved:w('تأیید شده','Approved','معتمد','Onaylandı'),rejected:w('رد شده','Rejected','مرفوض','Reddedildi')};
 const kinds:Record<string,string>={production:t('تولید و بهره‌وری'),inspection:t('بازرسی کیفیت و ردیابی'),maintenance:t('دستورکار نگهداری'),energy:t('پایش انرژی'),asset:t('شناسنامه تجهیزات'),recipe:t('دستور ساخت و نسخه مهندسی'),calibration:t('کنترل کالیبراسیون'),ncr:t('عدم انطباق و اقدام اصلاحی'),inventory:t('مواد و قطعات یدکی')};
 const roles:Record<string,string>={admin:t('مدیر سامانه'),executive:t('مدیر کارخانه'),production:t('مسئول تولید'),quality:t('کنترل کیفیت'),maintenance:t('نگهداری و تعمیرات'),energy:t('کارشناس انرژی'),engineering:t('مهندسی و توسعه'),auditor:t('ناظر و ارزیاب')};
 const label=(code:string)=>actions[code]||code;
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
  const note=typeof details.note==='string'?details.note:'';
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
 const[profile,setProfile]=useState<Profile|null>(null),[events,setEvents]=useState<any[]>([]),[error,setError]=useState(''),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{setError('');setSaved(false);if(page==='activity')api<any>('/activity').then(r=>setEvents(r.events)).catch(e=>setError(e.message));else api<Profile>('/profile').then(setProfile).catch(e=>setError(e.message));},[page,user.id]);
 async function save(e:React.FormEvent){e.preventDefault();if(!profile)return;setBusy(true);setError('');setSaved(false);try{const next=await api<Profile>('/profile','PATCH',{...profile,name:profile.user.name});setProfile(next);onUpdate(next.user,next.preferences);setSaved(true);}catch(e){setError(e instanceof Error?e.message:t('ذخیره انجام نشد'));}finally{setBusy(false);}}
 const field=(key:'department'|'jobTitle'|'email'|'phone',label:string,type='text')=>profile&&<label>{t(label)}<input type={type} maxLength={key==='phone'?30:key==='email'?120:100} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})}/></label>;
 return <section className="panel personal-panel">{error&&<div className="notice error" role="alert">{t(error)}</div>}{saved&&<div className="notice success" role="status">{t("اطلاعات شخصی شما ذخیره شد.")}</div>}{page==='activity'?<><div className="panel-title"><h2>{t("فعالیت‌های حساب من")}</h2><Activity size={20}/></div><p className="section-caption">{t("۲۰۰ رویداد آخر حساب شما؛ سوابق سایر کاربران در این بخش نمایش داده نمی‌شوند.")}</p><EventTable events={events}/></>:profile?<><div className="profile-summary"><div className="profile-avatar"><UserRound size={33}/></div><div><h2>{profile.user.name}</h2><p>{t(profile.user.roleLabel)} · <span dir="ltr">{profile.user.username}</span></p><span className="badge approved">{t("حساب سازمانی فعال")}</span></div><ShieldCheck size={28}/></div><form onSubmit={save} className="record-modal inline-form">{page==='profile'?<><h3>{t("اطلاعات فردی و سازمانی")}</h3><div className="form-grid"><label>{t("نام و نام خانوادگی")}<input required minLength={2} maxLength={100} value={profile.user.name} onChange={e=>setProfile({...profile,user:{...profile.user,name:e.target.value}})}/></label>{field('jobTitle',t('عنوان شغلی'))}{field('department',t('واحد سازمانی'))}{field('email',t('ایمیل'),'email')}{field('phone',t('شماره تماس'),'tel')}<label>{t("نقش و سطح دسترسی")}<input value={t(profile.user.roleLabel)} disabled/><small>{t("تغییر نقش فقط توسط مدیر سامانه انجام می‌شود.")}</small></label></div></>:<><h3><Settings size={18}/>{t("تنظیمات فضای کاری من")}</h3><div className="form-grid"><label>{t("تراکم نمایش")}<select value={profile.preferences.density} onChange={e=>setProfile({...profile,preferences:{...profile.preferences,density:e.target.value as Preferences['density']}})}><option value="comfortable">{t("خوانا و استاندارد")}</option><option value="compact">{t("فشرده برای نمایشگر عملیات")}</option></select></label><label>{t("صفحه شروع پس از ورود")}<select value={profile.preferences.startPage} onChange={e=>setProfile({...profile,preferences:{...profile.preferences,startPage:e.target.value}})}><option value="overview">{t("نمای کلی")}</option>{catalog.map(c=><option key={c.kind} value={c.kind}>{t(c.title)}</option>)}</select></label><label>{t("پیام تأیید عملیات")}<select value={String(profile.preferences.notifications)} onChange={e=>setProfile({...profile,preferences:{...profile.preferences,notifications:e.target.value==='true'}})}><option value="true">{t("نمایش پیام موفقیت")}</option><option value="false">{t("بدون پیام موفقیت")}</option></select><small>{t("خطاها و پیام‌های امنیتی همیشه نمایش داده می‌شوند.")}</small></label><div className="locale-settings"><LanguageSelector/><small>{t("منطقه زمانی تهران")}</small></div></div><div className="notice subtle">{t("تنظیمات به حساب شما وابسته است و برای کاربران دیگر تغییر نمی‌کند.")}</div></>}<div className="form-actions"><button className="primary" disabled={busy}><Save size={17}/>{busy?t('در حال ذخیره…'):t('ذخیره تغییرات')}</button></div></form></>:<p className="section-caption">{t("در حال دریافت پروفایل…")}</p>}</section>;
}
export function SystemMonitor(){
 const[data,setData]=useState<any>(null),[error,setError]=useState('');
 const load=()=>api<any>('/system').then(setData).catch(e=>setError(e.message));useEffect(()=>{load();},[]);
 return <>{error&&<div className="notice error">{t(error)}</div>}<section className="panel"><div className="panel-title"><h2><Server size={20}/>{t("مانیتورینگ اختصاصی پلتفرم")}</h2><button className="secondary" onClick={load}><RefreshCw size={16}/>{t("دریافت وضعیت")}</button></div>{data?<><div className="metric-grid">{[[t('کاربران فعال'),data.counts.activeUsers],[t('نشست‌های معتبر'),data.counts.sessions],[t('رکوردهای سامانه'),data.counts.records],[t('رویدادهای ثبت‌شده'),data.counts.audit]].map(([title,value])=><article className="metric-card" key={t(title)}><span>{t(title)}</span><strong>{faNumber(value)}</strong></article>)}</div><div className="system-facts"><span>{t("دیتابیس")} <b>{data.database==='ok'?t('سالم'):data.database}</b></span><span>{t("حافظه فرآیند")} <b>{faNumber(data.memoryMb)} MB</b></span><span>{t("زمان فعالیت")} <b>{faNumber(data.uptimeSeconds)} {t('ثانیه')}</b></span><span>{t("اتصال API")} <b>{data.transport}</b></span><span>{t("نسخه")} <code>{data.sha.slice(0,12)}</code></span></div><p className="section-caption">{t("وضعیت فرآیند پلتفرم و ۱۰۰ درخواست اخیر همین فضای کاری. لاگ خام میزبان و سرویس‌های سایر پروژه‌ها از وب ارائه نمی‌شود.")}</p><div className="table-scroll"><table><thead><tr><th>{t("زمان")}</th><th>{t("متد")}</th><th>{t("مسیر")}</th><th>{t("پاسخ")}</th><th>{t("زمان پاسخ")}</th></tr></thead><tbody>{data.requests.map((r:any,i:number)=><tr key={i}><td>{faDateTime(r.at)}</td><td dir="ltr">{r.method}</td><td dir="ltr" className="mono">{r.path}</td><td><span className={`badge ${r.status>=400?'rejected':'approved'}`}>{r.status}</span></td><td>{faNumber(r.durationMs)} ms</td></tr>)}</tbody></table></div></>:<p>{t("در حال دریافت وضعیت…")}</p>}</section></>;
}
