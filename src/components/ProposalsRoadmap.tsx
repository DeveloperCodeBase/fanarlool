import React, { useState } from 'react';
import { Language } from '../types';
import { 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Coins, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Download,
  Building,
  Sparkles,
  Zap,
  Clock
} from 'lucide-react';

interface ProposalsRoadmapProps {
  lang: Language;
}

export const ProposalsRoadmap: React.FC<ProposalsRoadmapProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [activeSection, setActiveSection] = useState<'summary' | 'wbs' | 'hardware' | 'team'>('summary');

  // 4 Implementation Phases (WBS Timeline)
  const phases = [
    {
      phase: 'فاز ۱',
      titleFa: 'شناخت، مهندسی نیازمندی‌ها، طراحی معماری و انتخاب سخت‌افزار',
      titleEn: 'Phase 1: Factory Audit, System Architecture & Sensor Selection',
      durationFa: 'ماه‌های ۱ الی ۳ (۳ ماه)',
      durationEn: 'Months 1-3',
      color: 'border-cyan-500 bg-cyan-950/30',
      milestones: [
        'ممیزی فیزیکی و داده‌ای خطوط تولید فنر لول و استخراج گپ‌ها',
        'طراحی دقیق دیاگرام شبکه صنعتی L0 تا L4 مبتنی بر استاندارد ISA-95',
        'تست نوری آزمایشگاهی با دوربین‌های Basler و تعیین لنز تله‌سنتریک متناسب',
        'طراحی مکانیکی استراکچر ضد ارتعاش برای محفظه بازرسی خط تولید',
      ],
    },
    {
      phase: 'فاز ۲',
      titleFa: 'توسعه و استقرار پایلوت ماژول‌های بینایی و پروفیل‌سنجی در خط شماره ۱',
      titleEn: 'Phase 2: Pilot Deployment of Machine Vision & Profilometry',
      durationFa: 'ماه‌های ۴ الی ۷ (۴ ماه)',
      durationEn: 'Months 4-7',
      color: 'border-emerald-500 bg-emerald-950/30',
      milestones: [
        'نصب فیزیکی ایستگاه بینایی ماشین و اسکنر لیزری بعد از سنگ‌زنی دوسر',
        'جمع‌آوری دیتاست تصویری ۵۰,۰۰۰ فنر و آموزش مدل یادگیری عمیق YOLOv10',
        'پیاده‌سازی الگوریتم‌های ساب‌پیکسل و کالیبراسیون با دقت ۰.۰۵ میلیمتر',
        'ارتباط بلادرنگ با PLC زیمنس S7-1500 و فرمان به جک پنوماتیک اجکتور',
      ],
    },
    {
      phase: 'فاز ۳',
      titleFa: 'توسعه ماژول‌های PdM، مانیتورینگ OEE و سیستم انرژی در سراسر کارخانه',
      titleEn: 'Phase 3: Plant-Wide PdM, OEE Dashboards & Energy Telemetry',
      durationFa: 'ماه‌های ۸ الی ۱۲ (۵ ماه)',
      durationEn: 'Months 8-12',
      color: 'border-amber-500 bg-amber-950/30',
      milestones: [
        'نصب سنسورهای ارتعاش‌سنج سه‌محوره IEPE روی ۸ ماشین کلیدی خط تولید',
        'راه‌اندازی ماژول تحلیل طیف فوریه FFT و پیاده‌سازی مدل تخمین RUL',
        'نصب پاورمیترهای هوشمند اشنایدر و کنتورهای گاز کوره‌های آستنیته و تمپر',
        'راه‌اندازی داشبورد یکپارچه OEE، MTBF و MTTR بر روی سرور مرکزی کارخانه',
      ],
    },
    {
      phase: 'فاز ۴',
      titleFa: 'اتصال ابری هاب مرکزی کیفیت استان سمنان و خط‌مشی MLOps',
      titleEn: 'Phase 4: Provincial Central Quality Hub & Cloud MLOps Integration',
      durationFa: 'ماه‌های ۱۳ الی ۱۶ (۴ ماه)',
      durationEn: 'Months 13-16',
      color: 'border-purple-500 bg-purple-950/30',
      milestones: [
        'راه‌اندازی سرور ابری پلتفرم مرکزی کنترل کیفیت صنایع استان سمنان',
        'توسعه ماژول مقایسه کیفی، رتبه‌بندی و بنچ‌مارکینگ بین کارخانجات همکار',
        'اتصال خودکار MLOps جهت بازآموزی و توزیع نسخه‌های جدید مدل‌های هوش مصنوعی',
        'آموزش جامع پرسنل مهندسی، تضمین کیفیت و نگهداری تعمیرات فنر لول ایران',
      ],
    },
  ];

  // Hardware & Tech Stack Reference Table
  const techStackItems = [
    {
      subsystem: 'سامانه بینایی ماشین (ماژول ۱)',
      equipment: 'دوربین‌های صنعتی Basler ace 2 Pro (5MP Sony IMX) + لنزهای تله‌سنتریک لنزویژن + نورپردازی تله‌سنتریک کواکسیال CCS ژاپن',
      edgePlatform: 'کامپیوتر صنعتی Siemens Microbox IPC با کارت پردازش گرافیکی NVIDIA RTX A4000',
    },
    {
      subsystem: 'پروفیل‌سنجی ۳بعدی لیزری (ماژول ۲)',
      equipment: 'اسکنر خطی لیزری آبی Keyence سری LJ-X8000 (رزولوشن Z معادل ۰.۵ میکرومتر، پهنای اسکن ۱۵۰ میلیمتر)',
      edgePlatform: 'کنترلر پردازش تصویر ۳D اختصاصی با خروجی شبکه اترنت گیگابیتی و پروتکل OPC-UA',
    },
    {
      subsystem: 'نگهداری و تعمیرات پیش‌بینانه (ماژول ۴)',
      equipment: 'شتاب‌سنج‌های صنعتی پیزوالکتریک سه‌محوره IEPE رنج 50g + سنسورهای صوتی آکوستیک التراسونیک UE Systems',
      edgePlatform: 'ماژول داده‌برداری ارتعاشاتی پرسرعت Advantech با نرخ نمونه‌برداری ۱۰۰ کیلوهرتز در کانال',
    },
    {
      subsystem: 'مانیتورینگ انرژی (ماژول ۶)',
      equipment: 'پاورمیترهای تابلویی کلاس 0.2S اشنایدر Electric PM8000 + فلومتر توربینی گاز کوره + سنسورهای فشار پیزومقاومتی',
      edgePlatform: 'گیت‌وی صنعتی Modbus-RTU به MQTT بر بستر اترنت صنعتی ایزوله',
    },
  ];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>{isFa ? 'سنتز جامع اسناد پروپوزال ۱ و ۲' : 'Comprehensive Proposals Synthesis & Roadmap'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'طرح توجیهی فنی-اقتصادی، نقشه راه اجرایی (WBS) و تیم مجری' : 'Technical Feasibility, WBS Roadmap & Execution Consortium'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'مستندات کامل تلفیق‌شده از دو پروپوزال شبکه هوشمند ابتکار ویستا، همگام با نیازمندی‌های کارخانه فنر لول ایران، استانداردهای DIN و پارک علم و فناوری استان سمنان.'
              : 'Synthesized proposal documents, Work Breakdown Structure, hardware specifications, and industrial team roster.'}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSection('summary')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'summary' ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'اهداف و چشم‌انداز' : 'Vision & Goals'}
          </button>
          <button
            onClick={() => setActiveSection('wbs')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'wbs' ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'فازبندی WBS' : 'WBS Roadmap'}
          </button>
          <button
            onClick={() => setActiveSection('hardware')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'hardware' ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'مشخصات سخت‌افزار' : 'Hardware Specs'}
          </button>
          <button
            onClick={() => setActiveSection('team')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSection === 'team' ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'تیم مجری و ارتباط' : 'Consortium Team'}
          </button>
        </div>
      </div>

      {/* Section 1: Summary & Goals */}
      {activeSection === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base">کاهش حداقل ۳۰ درصدی ضایعات</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                حذف خطای انسانی اپراتور در بازرسی ابعادی و سطحی فنرها، ممانعت از ارسال قطعات معیوب به خطوط خودروسازان (ایران‌خودرو و سایپا) و بازگشت هزینه مستقیم فولاد آلیاژی.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base">کاهش ۴۵ درصدی توقفات غیرمنتظره</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                گذار از نت سنتی واکنشی به نت هوشمند پیش‌بینانه (PdM) از طریق کشف زودهنگام عیوب بیرینگ و گیربکس ماشین‌های فنرپیچ و سنگ‌زنی پیش از بروز شکست فاجعه‌بار.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-400">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base">هاب مرکزی کیفیت استان سمنان</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                استقرار زیرساخت کنترل کیفیت داده‌محور به عنوان مرجع صنعتی و آزمایشگاهی استان، اتصال صنایع قطعه‌سازی همجوار و به اشتراک‌گذاری مدل‌های بهینه‌شده هوش مصنوعی.
              </p>
            </div>
          </div>

          {/* Standards & Methodologies Box */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>استانداردهای مهندسی و متدولوژی‌های حاکم بر پروژه</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-cyan-400 font-bold">DIN EN 13906-1</div>
                <div className="text-slate-400 text-[11px] mt-1">محاسبه و طراحی فنرهای فشاری استوانه‌ای فولادی</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-emerald-400 font-bold">DIN 2095 (Grade 1/2)</div>
                <div className="text-slate-400 text-[11px] mt-1">تلرانس‌های ابعادی و هندسی فنرهای فولادی سردپیچ</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-amber-400 font-bold">ISO 10816-3</div>
                <div className="text-slate-400 text-[11px] mt-1">حدود مجاز ارتعاشات مکانیکی ماشین‌آلات صنعتی</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-purple-400 font-bold">ANSI/ISA-95</div>
                <div className="text-slate-400 text-[11px] mt-1">یکپارچه‌سازی سیستم‌های کنترل لبه با پلتفرم ERP</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: WBS Roadmap */}
      {activeSection === 'wbs' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 mb-2">
            ساختار شکست کار (WBS) در چهار فاز ۱۶ ماهه به همراه مایلستون‌های کلیدی تصویب پروژه:
          </div>

          <div className="space-y-4">
            {phases.map((ph, idx) => (
              <div 
                key={idx}
                className={`p-5 rounded-2xl border ${ph.color} space-y-3 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-slate-950 font-bold text-xs font-mono text-white border border-slate-700">
                      {ph.phase}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      {isFa ? ph.titleFa : ph.titleEn}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {isFa ? ph.durationFa : ph.durationEn}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  {ph.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Hardware Specifications */}
      {activeSection === 'hardware' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>فهرست تجهیزات صنعتی، حسگرها و لایه محاسباتی لبه (Edge Computing)</span>
          </h3>

          <div className="space-y-3">
            {techStackItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-xs sm:text-sm text-cyan-300 font-mono">{item.subsystem}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">تجهیزات حسگری و اپتیکی:</span>
                    <p className="text-slate-300">{item.equipment}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block mb-0.5">پلتفرم محاسباتی و کنترل صنعتی:</span>
                    <p className="text-slate-300">{item.edgePlatform}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Consortium Team Profile */}
      {activeSection === 'team' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">شرکت شبکه هوشمند ابتکار ویستا</h3>
                <p className="text-xs text-slate-400">عضو پارک علم و فناوری استان سمنان و سازمان نظام صنفی رایانه‌ای کشور</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              این شرکت با تکیه بر سال‌ها تجربه نخبگان دانشگاهی و مهندسی در حوزه بینایی ماشین، سیستم‌های نهفته صنعتی (Embedded AI)، اینترنت اشیاء صنعتی (IIoT) و الگوریتم‌های هوش مصنوعی، مجری تخصصی پروژه‌های تحول دیجیتال در صنایع خودروسازی و قطعه‌سازی کشور است.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white">مهندس مسعود بخشی</div>
                <div className="text-cyan-400 text-[11px] mt-0.5">مدیرعامل و رهبر تیم فنی هوش مصنوعی</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white">مهندس محمدرضا یوسفی</div>
                <div className="text-emerald-400 text-[11px] mt-0.5">عضو هیئت‌مدیره و مدیر سامانه‌های IIoT</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white">مهندس محمد بخشی</div>
                <div className="text-purple-400 text-[11px] mt-0.5">عضو هیئت‌مدیره و ناظر کنترل پروژه</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <span>پست الکترونیکی: <strong>Devcodebase.dev@gmail.com</strong></span>
              <span>کد اقتصادی و ثبت: <strong>پارک علم و فناوری سمنان</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
