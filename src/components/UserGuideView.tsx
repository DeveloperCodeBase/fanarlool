import React, { useState } from 'react';
import { Language } from '../types';
import { 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  Cpu, 
  Camera, 
  Wrench, 
  Sliders, 
  Search, 
  ChevronRight, 
  FileText, 
  Layers, 
  Compass, 
  ShieldCheck, 
  Download, 
  Printer, 
  Zap, 
  Flame, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface UserGuideViewProps {
  lang: Language;
  onNavigateToTab?: (tab: any) => void;
}

interface GuideSection {
  id: string;
  titleFa: string;
  titleEn: string;
  icon: React.ReactNode;
  contentFa: React.ReactNode;
  contentEn: React.ReactNode;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({ lang, onNavigateToTab }) => {
  const isFa = lang === 'fa';

  const [activeSectionId, setActiveSectionId] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sections: GuideSection[] = [
    {
      id: 'overview',
      titleFa: '۱. آشنایی با پلتفرم دوقلوی دیجیتال و معماری ISA-95',
      titleEn: '1. Platform Overview & ISA-95 Architecture',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      contentFa: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            پلتفرم هوشمند دوقلوی دیجیتال کارخانه فنر لول ایران یک سیستم یکپارچه پایش صنعتی بر اساس معماری استاندارد <strong>ANSI/ISA-95</strong> است که لایه‌های مختلف سخت‌افزار تا تصمیم‌گیری ابری را به یکدیگر متصل می‌کند:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-cyan-400 font-bold mb-1">سطح ۰ و ۱: سنسورها و عملگرهای خط</div>
              <p className="text-slate-400 text-[11px]">سنسورهای ارتعاش IEPE، دوربین‌های Basler خطی، اسکنرهای لیزر آبی ۵ میکرومتر و ترموکوپلهای نوع K کوره سخت‌کاری.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-indigo-400 font-bold mb-1">سطح ۲: کنترل و پی‌ال‌سی (PLC & Edge)</div>
              <p className="text-slate-400 text-[11px]">کنترلرهای زیمنس S7-1500 و ماژول‌های پردازش لبه‌ای NVIDIA Jetson جهت اجرای مدل‌های بینایی ماشین در کسری از میلی‌ثانیه.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-amber-400 font-bold mb-1">سطح ۳: دوقلوی دیجیتال و SCADA</div>
              <p className="text-slate-400 text-[11px]">سامانه بلادرنگ پایش پارامترهای فیزیکی، شبیه‌ساز دینامیک فنر و کنسول آلارم‌های استاندارد ISA-18.2.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-emerald-400 font-bold mb-1">سطح ۴: گزارش‌گیری کیفی و مدیریت ابری</div>
              <p className="text-slate-400 text-[11px]">صدور خودکار سرتیفیکیت‌های ۳.۱ با رمزنگاری SHA-256، داشبورد OEE و یکپارچگی با سیستم ERP ساپکو.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-cyan-300 text-xs">
            <strong>نکته عملیاتی:</strong> از منوی بالای صفحه می‌توانید در هر لحظه وضعیت شبیه‌سازی زنده (Real-time Simulation) را خاموش یا روشن کنید و نقش کاربری خود را متناسب با مسئولیت تغییر دهید.
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The Iran Coil Spring Smart Factory platform operates across all 4 levels of the ANSI/ISA-95 industrial automation hierarchy, linking high-frequency field transducers to strategic cloud ERP systems.
          </p>
        </div>
      )
    },
    {
      id: 'camera_guide',
      titleFa: '۲. راهنمای ایستگاه بینایی ماشین و کالیبراسیون دوربین',
      titleEn: '2. Machine Vision & Camera Calibration SOP',
      icon: <Camera className="w-4 h-4 text-emerald-400" />,
      contentFa: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            سیستم بینایی ماشین خط تولید مجهز به لنز تله‌سنتریک و دوربین مونوکروم ۵ مگاپیکسل با شاتر سراسری (Global Shutter) است که عیوب سطحی فنر را تا سرعت ۳ متر بر ثانیه تشخیص می‌دهد.
          </p>

          <h4 className="font-bold text-white text-xs mt-3">چک‌لیست کالیبراسیون روزانه اپراتور بینایی ماشین:</h4>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-mono">
            <li><strong>تنظیم نور پس‌زمینه (Backlight):</strong> بررسی روشنایی یکنواخت پنل LED و تمیز بودن قاب شیشه‌ای محافظ در برابر غبار کربن و روغن.</li>
            <li><strong>تست تارگت شطرنجی کالیبراسیون:</strong> قرار دادن صفحه شطرنجی ۱۰×۱۰ میلیمتر در مرکز میدان دید و تأیید ضریب مقیاس 0.0125 mm/pixel.</li>
            <li><strong>تنظیم زمان اکسپوژر:</strong> در سرعت نامی خط، زمان اکسپوژر نباید از ۱۲۰۰ میکروثانیه تجاوز کند تا اثر کشیدگی تصویر (Motion Blur) صفر شود.</li>
            <li><strong>تأیید فیلترهای لبه‌سنجی:</strong> انتخاب فیلتر Edges و Sobel جهت اطمینان از وضوح لبه مفتول در لایو استریم.</li>
          </ol>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs">
            <strong>قابلیت ادغام وب‌کم:</strong> در تب «دوربین و بینایی زنده» می‌توانید دوربین فیزیکی متصل به کامپیوتر یا لپ‌تاپ خود را فعال نموده و عملکرد فیلترهای Canny، لبه‌سنجی و ماسک آستانه را روی اشیاء واقعی تست کنید.
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Standard operating procedures for optical inspection, telecentric illumination tuning, and pixel-to-millimeter calibration protocols.
          </p>
        </div>
      )
    },
    {
      id: 'pdm_guide',
      titleFa: '۳. راهنمای نگهداری پیش‌بینانه و تحلیل ارتعاشات FFT',
      titleEn: '3. Predictive PdM & Vibration FFT Analysis',
      icon: <Wrench className="w-4 h-4 text-amber-400" />,
      contentFa: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            پایش سلامت دستگاه‌ها با تحلیل طیف فرکانسی ارتعاشات (FFT Spectrum) و پایش پیوسته شتاب ارتعاش RMS بر اساس استاندارد بین‌المللی <strong>ISO 10816-3</strong> انجام می‌پذیرد.
          </p>

          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs font-mono border border-slate-800 text-center">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-right">ناحیه وضعیت</th>
                  <th className="py-2 px-3">دامنه سرعت ارتعاش RMS</th>
                  <th className="py-2 px-3">اقدام مورد نیاز اپراتور / اکیپ نت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-emerald-950/20 text-emerald-300">
                  <td className="py-2 px-3 text-right font-bold">منطقه A (سبز - عالی)</td>
                  <td className="py-2 px-3">&lt; 1.8 mm/s</td>
                  <td className="py-2 px-3">عملکرد عادی و روان ماشین</td>
                </tr>
                <tr className="bg-cyan-950/20 text-cyan-300">
                  <td className="py-2 px-3 text-right font-bold">منطقه B (آبی - خوب)</td>
                  <td className="py-2 px-3">1.8 - 4.5 mm/s</td>
                  <td className="py-2 px-3">کارکرد مداوم بدون محدودیت</td>
                </tr>
                <tr className="bg-amber-950/20 text-amber-300">
                  <td className="py-2 px-3 text-right font-bold">منطقه C (هشدار زرد)</td>
                  <td className="py-2 px-3">4.5 - 7.1 mm/s</td>
                  <td className="py-2 px-3">برنامه‌ریزی بازرسی، روان‌کاری مجدد و گریس‌کاری یاتاقان</td>
                </tr>
                <tr className="bg-rose-950/20 text-rose-300">
                  <td className="py-2 px-3 text-right font-bold">منطقه D (خطر قرمز)</td>
                  <td className="py-2 px-3">&gt; 7.1 mm/s</td>
                  <td className="py-2 px-3 font-bold">توقف فوری دستگاه جهت جلوگیری از شکست شفت و خسارت سنگین</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400">
            <strong>فرکانس‌های خرابی یاتاقان:</strong> قله‌های فرکانسی در ضریب BPFO بیانگر سایش کنس خارجی، BPFI مربوط به کنس داخلی، و BSF مربوط به آسیب ساچمه‌ها است.
          </p>
        </div>
      ),
      contentEn: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            ISO 10816-3 vibration severity zones and FFT bearing fault harmonics interpretation guide.
          </p>
        </div>
      )
    },
    {
      id: 'troubleshooting_faq',
      titleFa: '۴. ماتریس حل مسئله خط تولید و پرسش‌های متداول (FAQ)',
      titleEn: '4. Line Troubleshooting Matrix & FAQ',
      icon: <HelpCircle className="w-4 h-4 text-rose-400" />,
      contentFa: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            راهکارهای سریع برای متداول‌ترین چالش‌های کیفی و تولیدی فنرهای سیستم تعلیق خودرو:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-white font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>مشکل: انحراف ثابت فنر (k) نسبت به نقشه ساپکو</span>
              </div>
              <p className="text-xs text-slate-400">
                <strong>علت احتمالی:</strong> سایش نازل راهنمای مفتول در دستگاه CNC یا تلرانس غیرمجاز قطر مفتول ورودی فولاد فنر.
                <br />
                <strong>اقدام اصلاحی:</strong> بررسی قطر سیم با میکرومتر در ۳ نقطه، اصلاح آفست تعداد دور مؤثر ($n_a$) در پنل کنترلر CNC.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-white font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>مشکل: شکست فنر در تست دوام و خستگی زودرس قبل از ۵۰۰ هزار سیکل</span>
              </div>
              <p className="text-xs text-slate-400">
                <strong>علت احتمالی:</strong> افت شدت آلمن در شات‌پینینگ (پایین‌تر از ۰.۳۰A) یا وجود کربن‌زدایی سطحی بیش از ۱ درصد قطر سیم در کوره سخت‌کاری.
                <br />
                <strong>اقدام اصلاحی:</strong> به تب «آزمایشگاه متالورژی» مراجعه و شدت آلمن و پوشش ساچمه را به بالای ۲۰۰٪ افزایش دهید.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-white font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
                <span>مشکل: عدم تأیید زاویه عمودی سر فنر (Perpendicularity e1 &gt; 1.5°)</span>
              </div>
              <p className="text-xs text-slate-400">
                <strong>علت احتمالی:</strong> انحراف زاویه سنگ‌زن دوسر یا تنظیم نبودن فید ریت تغذیه دیسک‌های فوقانی و تحتانی.
                <br />
                <strong>اقدام اصلاحی:</strong> بازبینی سنسورهای موقعیت‌سنج سنگ‌زن و اصلاح سرعت پیشروی اسپیندل.
              </p>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Direct troubleshooting matrix for coil spring defects, spring rate discrepancies, and premature dynamic fatigue failures.
          </p>
        </div>
      )
    }
  ];

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>{isFa ? 'راهنمای جامع کاربری، استانداردهای عملیاتی SOP و دستورالعمل‌های صنعتی' : 'Comprehensive User Guide & Industrial SOP Manual'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'کتابچه راهنمای مهندسی کارخانه و پروتکل‌های اپراتوری خط تولید' : 'Factory Operations Manual, Protocols & Operator Checklists'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'مستندات گام‌به‌گام کار با دوقلوی دیجیتال، بینایی ماشین، ابزارهای محاسباتی DIN EN 13906-1، عیب‌یابی ارتعاشی و پروتکل‌های تضمین کیفیت ساپکو.'
              : 'End-to-end guidance for operators, QA engineers, and maintenance teams with full technical and troubleshooting documentation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isFa ? 'پرینت راهنما' : 'Print SOP'}</span>
          </button>
        </div>
      </div>

      {/* Main Guide Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 4 Cols: Navigation Index List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={isFa ? 'جستجو در فصول راهنما...' : 'Search documentation...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {sections
              .filter(s => 
                s.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                    activeSectionId === section.id
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-600 font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {section.icon}
                    <span className="text-xs">{isFa ? section.titleFa : section.titleEn}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isFa ? 'rotate-180' : ''}`} />
                </button>
              ))}
          </div>

          {/* Quick Direct Links to Tools */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mt-4">
            <div className="text-xs font-bold text-slate-300">{isFa ? 'دسترسی سریع به ابزارها:' : 'Quick Tool Links:'}</div>
            
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('live_camera')}
              className="w-full text-right p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs flex items-center justify-between transition-colors font-mono"
            >
              <span>{isFa ? 'دوربین و بینایی زنده (Live Camera)' : 'Live Camera'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => onNavigateToTab && onNavigateToTab('engineering_tools')}
              className="w-full text-right p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs flex items-center justify-between transition-colors font-mono"
            >
              <span>{isFa ? 'محاسبه‌گر مهندسی فنر (CAD/CAE)' : 'Spring Calculator'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => onNavigateToTab && onNavigateToTab('quality_certificate')}
              className="w-full text-right p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs flex items-center justify-between transition-colors font-mono"
            >
              <span>{isFa ? 'صدور سرتیفیکیت ۳.۱ ساپکو' : '3.1 Certificate'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isFa ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Right 8 Cols: Display Active Section Content */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center">
              {currentSection.icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isFa ? currentSection.titleFa : currentSection.titleEn}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">دستورالعمل‌های استاندارد کارخانه فنر لول ایران</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {isFa ? currentSection.contentFa : currentSection.contentEn}
          </div>
        </div>

      </div>
    </div>
  );
};
