import React, { useState } from 'react';
import { Language, TabId } from '../types';
import { 
  Box, 
  Eye, 
  Layers, 
  Network, 
  Wrench, 
  BarChart3, 
  Zap, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Coins,
  Factory,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onSelectTab: (tab: TabId) => void;
  lang: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectTab, lang }) => {
  const isFa = lang === 'fa';

  // Interactive ROI Calculator State
  const [monthlyTonnage, setMonthlyTonnage] = useState<number>(450); // tons/month
  const [springPricePerKg, setSpringPricePerKg] = useState<number>(145000); // Tomans/kg
  const [scrapRateBaseline, setScrapRateBaseline] = useState<number>(4.2); // %
  const [scrapReductionPercent, setScrapReductionPercent] = useState<number>(35); // %
  const [downtimeHoursPerMonth, setDowntimeHoursPerMonth] = useState<number>(55); // hours/month
  const [hourlyDowntimeCostMln, setHourlyDowntimeCostMln] = useState<number>(25); // Million Tomans/hr

  // Calculations
  const scrapSavedTonsPerMonth = (monthlyTonnage * (scrapRateBaseline / 100)) * (scrapReductionPercent / 100);
  const scrapSavingsMlnTomanPerMonth = (scrapSavedTonsPerMonth * 1000 * springPricePerKg) / 1000000;
  
  const downtimeSavedHours = downtimeHoursPerMonth * 0.45; // 45% reduction from PdM
  const downtimeSavingsMlnTomanPerMonth = downtimeSavedHours * hourlyDowntimeCostMln;

  const energySavingsMlnTomanPerMonth = (monthlyTonnage * 340 * 0.09 * 1800) / 1000000; // ~9% energy savings

  const totalMonthlySavingsMlnToman = scrapSavingsMlnTomanPerMonth + downtimeSavingsMlnTomanPerMonth + energySavingsMlnTomanPerMonth;
  const annualSavingsBillionToman = (totalMonthlySavingsMlnToman * 12) / 1000;
  
  // Approximate implementation investment (hardware + software + deployment) ~ 4.2 Billion Tomans
  const estimatedInvestmentBillionToman = 4.2;
  const roiPaybackMonths = Math.max(4, Math.round((estimatedInvestmentBillionToman / (annualSavingsBillionToman / 12)) * 10) / 10);

  const modules = [
    {
      id: 'digital_twin' as TabId,
      num: '۰',
      titleFa: 'دوقلوی دیجیتال تعاملی خط تولید و فنر',
      titleEn: 'Interactive 3D Spring & Line Digital Twin',
      descFa: 'شبیه‌سازی کامل فیزیکی تنش پیچشی وال (Wahl Factor)، کرنش، منحنی بار-تغییر مکان و مانیتورینگ زنده ۸ ایستگاه فرآیند تولید.',
      descEn: 'Full 3D physics-based stress simulation (Wahl factor), load-deflection curve & live 8-stage production flow twin.',
      icon: <Box className="w-6 h-6 text-cyan-400" />,
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
    },
    {
      id: 'module1_vision' as TabId,
      num: '۱',
      titleFa: 'سامانه هوشمند کنترل ابعادی و بصری (بینایی ماشین)',
      titleEn: 'Computer Vision & Deep Learning Quality Inspection',
      descFa: 'دوربین‌های صنعتی Basler/Cognex، کالیبراسیون ساب‌پیکسل و هوش مصنوعی YOLO جهت تشخیص ترک، خط و خش، کربن‌زدایی و جداسازی پنوماتیک.',
      descEn: 'Industrial Basler/Cognex cameras, sub-pixel calibration, and deep learning for micro-crack detection & pneumatic sorting.',
      icon: <Eye className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
    },
    {
      id: 'module2_profilometry' as TabId,
      num: '۲',
      titleFa: 'سامانه اندازه‌گیری سه‌بعدی و پروفیل‌سنجی لیزری',
      titleEn: '3D Laser Profilometry & Helical Scanning',
      descFa: 'پروفیل‌سنجی لیزری خطی (Keyence LJ/Gocator) برای استخراج نقشه ارتفاع، گام متغیر هلیکال، گونیایی انتها و زاویه سنگ‌زنی دوسر طبق DIN EN 13906.',
      descEn: 'Laser line profilometry for 3D height mapping, pitch uniformity, squareness, and grinding parallelism.',
      icon: <Layers className="w-6 h-6 text-indigo-400" />,
      color: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300'
    },
    {
      id: 'module3_central_qc' as TabId,
      num: '۳',
      titleFa: 'پلتفرم مرکزی کنترل کیفیت صنایع استان سمنان',
      titleEn: 'Central Industrial QC Platform for Semnan Province',
      descFa: 'مخزن ابری مدل‌های هوش مصنوعی (MLOps)، بنچ‌مارکینگ بین خطوط و کارخانه‌های عضو استان و نمودارهای آماری فرایند (SPC, Cp, Cpk).',
      descEn: 'Centralized MLOps registry, cross-plant provincial benchmarking, and real-time Statistical Process Control (SPC).',
      icon: <Network className="w-6 h-6 text-blue-400" />,
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-300'
    },
    {
      id: 'module4_pdm' as TabId,
      num: '۴',
      titleFa: 'نگهداری و تعمیرات پیش‌بینانه تجهیزات (PdM)',
      titleEn: 'Predictive Maintenance & Condition Monitoring',
      descFa: 'سنسورهای شتاب‌سنج سه‌محوره IEPE، آنالیز فوریه FFT ارتعاشات، تشخیص زودهنگام عیوب بیرینگ/گیربکس، تخمین عمر باقی‌مانده (RUL) و صدور خودکار دستور کار.',
      descEn: 'Tri-axial vibration sensors, FFT spectral harmonics, RUL degradation tracking, and automated predictive work orders.',
      icon: <Wrench className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300'
    },
    {
      id: 'module5_oee' as TabId,
      num: '۵',
      titleFa: 'داشبورد هوشمند بهره‌وری خطوط و شاخص‌های OEE',
      titleEn: 'Smart Productivity & OEE Dashboard',
      descFa: 'محاسبه برخط دسترس‌پذیری، نرخ عملکرد و کیفیت (OEE)، تفکیک شیفت‌های کاری، پارتوی توقفات ماشین‌آلات و شاخص‌های MTBF و MTTR.',
      descEn: 'Real-time OEE breakdown (Availability, Performance, Quality), shift analytics, downtime Pareto, MTBF and MTTR.',
      icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/50 bg-purple-950/20 text-purple-300'
    },
    {
      id: 'module6_energy' as TabId,
      num: '۶',
      titleFa: 'سامانه مانیتورینگ هوشمند حامل‌های انرژی',
      titleEn: 'Multi-Carrier Smart Energy Monitoring',
      descFa: 'پاورمیترهای اشنایدر، کنتورهای گاز کوره‌های عملیات حرارتی، سنسورهای فشار باد، هوش مصنوعی تشخیص نشتی هوای فشرده و محاسبه شدت مصرف انرژی به ازای هر تن.',
      descEn: 'Power meters, furnace gas flow, compressed air leakage AI detector, and specific energy consumption (SEC) per ton.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: 'border-yellow-500/50 bg-yellow-950/20 text-yellow-300'
    },
  ];

  return (
    <div className="space-y-12 pb-16" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl">
          {/* Tag & Province Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60">
              <Cpu className="w-3.5 h-3.5" />
              {isFa ? 'صنعت نسل چهارم (Industry 4.0)' : 'Industry 4.0 Transformation'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700">
              <Factory className="w-3.5 h-3.5 text-amber-400" />
              {isFa ? 'کارخانه فنر لول ایران - استان سمنان' : 'Iran Coil Spring Co. - Semnan'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isFa ? 'طراحی: شبکه هوشمند ابتکار ویستا' : 'By: Vesta Smart Network'}
            </span>
          </div>

          {/* Main Title & Logo */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {isFa ? (
                  <>
                    پلتفرم یکپارچه <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">تولید هوشمند و دوقلوی دیجیتال</span> کارخانه فنر لول ایران
                  </>
                ) : (
                  <>
                    Unified <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Smart Manufacturing & Digital Twin</span> for Iran Coil Spring Co.
                  </>
                )}
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                {isFa ? (
                  'سامانه تحول دیجیتال مبتنی بر هوش مصنوعی، بینایی ماشین، پروفیل‌سنجی سه‌بعدی لیزری، نگهداری پیش‌بینانه (PdM)، پایش OEE و مدیریت مصرف انرژی، طراحی‌شده جهت جهش بهره‌وری در کارخانه فنر لول ایران و استقرار به عنوان هاب مرکزی کنترل کیفیت صنایع استان سمنان.'
                ) : (
                  'Next-generation industrial digital twin featuring AI vision quality control, 3D laser profilometry, condition-based predictive maintenance, OEE optimization, and multi-carrier energy intelligence.'
                )}
              </p>
            </div>

            {/* Prominent Logo Box */}
            <div className="shrink-0 p-3 bg-white/95 rounded-2xl shadow-xl border border-slate-700/60 flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
              <img 
                src="/logo.png" 
                alt="لوگوی فنر لول ایران" 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }}
              />
            </div>
          </div>

          {/* Key Metric Highlights Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-8">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">۳۰٪+</div>
              <div className="text-xs text-slate-400 mt-1">
                {isFa ? 'کاهش ضایعات ابعادی و ظاهری' : 'Scrap Rate Reduction'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">۴۵٪</div>
              <div className="text-xs text-slate-400 mt-1">
                {isFa ? 'کاهش توقفات اضطراری (PdM)' : 'Unplanned Downtime Cut'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">۱۲ الی ۱۸</div>
              <div className="text-xs text-slate-400 mt-1">
                {isFa ? 'ماه دوره بازگشت سرمایه (ROI)' : 'Months Full ROI Payback'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">۱۰:۱ تا ۳۰:۱</div>
              <div className="text-xs text-slate-400 mt-1">
                {isFa ? 'نسبت سود به هزینه (مک‌کنزی)' : 'Benefit-to-Cost Ratio'}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="cta-open-twin"
              onClick={() => onSelectTab('digital_twin')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <Box className="w-5 h-5" />
              <span>{isFa ? 'ورود به دوقلوی دیجیتال ۳بعدی' : 'Launch 3D Digital Twin'}</span>
              {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              id="cta-open-vision"
              onClick={() => onSelectTab('module1_vision')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'مشاهده سامانه بینایی ماشین' : 'Computer Vision Demo'}</span>
            </button>

            <button
              id="cta-open-scada"
              onClick={() => onSelectTab('factory_scada')}
              className="px-5 py-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 font-semibold text-sm border border-cyan-500/40 flex items-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'توپولوژی خط و SCADA صنعتی' : 'Factory SCADA Topology'}</span>
            </button>

            <button
              id="cta-open-spc"
              onClick={() => onSelectTab('spc_control')}
              className="px-5 py-3 rounded-xl bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 font-semibold text-sm border border-indigo-500/40 flex items-center gap-2 transition-all"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'کنترل آماری و شش سیگما (SPC)' : 'SPC & Six Sigma Control'}</span>
            </button>

            <button
              id="cta-open-proposals"
              onClick={() => onSelectTab('proposals_roadmap')}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-sm border border-slate-800 flex items-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{isFa ? 'مطالعه پروپوزال و نقشه راه فنی' : 'Technical Proposals'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive ROI & Economic Justification Calculator */}
      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Coins className="w-4 h-4" />
              <span>{isFa ? 'توجیه اقتصادی و مدل مالی (بخش ۸ پروپوزال)' : 'Economic Justification & Financial Model (Proposal Section 8)'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {isFa ? 'ماشین‌حساب برآورد سودآوری و بازگشت سرمایه (ROI)' : 'Dynamic Factory ROI & Savings Simulator'}
            </h2>
          </div>
          <div className="text-xs text-slate-400 max-w-sm">
            {isFa 
              ? 'بر اساس ظرفیت تولید ماهانه و هزینه توقفات کارخانه فنر لول ایران، صرفه‌جویی سالانه و دوره بازگشت سرمایه را محاسبه کنید:'
              : 'Calculate annual cost reduction based on Iran Coil Spring plant production scale:'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders Input Area */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{isFa ? 'ظرفیت تولید ماهانه کارخانه:' : 'Monthly Production Tonnage:'}</span>
                <span className="text-cyan-400 font-mono font-bold">{monthlyTonnage.toLocaleString()} {isFa ? 'تن در ماه' : 'Tons/Month'}</span>
              </div>
              <input
                type="range"
                min="150"
                max="1200"
                step="25"
                value={monthlyTonnage}
                onChange={(e) => setMonthlyTonnage(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{isFa ? 'نرخ ضایعات فعلی خطوط قبل از استقرار هوش مصنوعی:' : 'Baseline Scrap Rate (Pre-AI):'}</span>
                <span className="text-rose-400 font-mono font-bold">{scrapRateBaseline}%</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.1"
                value={scrapRateBaseline}
                onChange={(e) => setScrapRateBaseline(Number(e.target.value))}
                className="w-full accent-rose-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{isFa ? 'هدف کاهش ضایعات با بینایی ماشین و پروفیل‌سنجی:' : 'Target Scrap Reduction with Vision/Laser:'}</span>
                <span className="text-emerald-400 font-mono font-bold">{scrapReductionPercent}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="55"
                step="5"
                value={scrapReductionPercent}
                onChange={(e) => setScrapReductionPercent(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{isFa ? 'ساعات توقف ناگهانی در ماه (خطوط فنرپیچ و کوره‌ها):' : 'Unplanned Downtime (Hours/Month):'}</span>
                <span className="text-amber-400 font-mono font-bold">{downtimeHoursPerMonth} {isFa ? 'ساعت' : 'Hours'}</span>
              </div>
              <input
                type="range"
                min="20"
                max="140"
                step="5"
                value={downtimeHoursPerMonth}
                onChange={(e) => setDowntimeHoursPerMonth(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
                <span>{isFa ? 'ارزش میانگین هر کیلوگرم فنر فولادی آلیاژی:' : 'Average Spring Steel Value (Tomans/Kg):'}</span>
                <span className="text-purple-400 font-mono font-bold">{springPricePerKg.toLocaleString()} {isFa ? 'تومان' : 'Tomans'}</span>
              </div>
              <input
                type="range"
                min="80000"
                max="250000"
                step="5000"
                value={springPricePerKg}
                onChange={(e) => setSpringPricePerKg(Number(e.target.value))}
                className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 p-5 sm:p-6 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-cyan-400 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>{isFa ? 'خروجی تحلیلی ارزش اقتصادی سالانه:' : 'Projected Annual Financial Impact:'}</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-300">{isFa ? 'صرفه‌جویی کاهش ضایعات فولاد:' : 'Steel Scrap Savings:'}</span>
                  <span className="text-emerald-400 font-bold">{(scrapSavingsMlnTomanPerMonth * 12 / 1000).toFixed(2)} {isFa ? 'میلیارد تومان/سال' : 'Billion Tomans/Yr'}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-300">{isFa ? 'کاهش خسارت توقفات با نت پیش‌بینانه:' : 'PdM Downtime Savings:'}</span>
                  <span className="text-amber-400 font-bold">{(downtimeSavingsMlnTomanPerMonth * 12 / 1000).toFixed(2)} {isFa ? 'میلیارد تومان/سال' : 'Billion Tomans/Yr'}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-300">{isFa ? 'صرفه‌جویی انرژی و رفع نشتی هوا:' : 'Energy & Pneumatics Savings:'}</span>
                  <span className="text-yellow-400 font-bold">{(energySavingsMlnTomanPerMonth * 12 / 1000).toFixed(2)} {isFa ? 'میلیارد تومان/سال' : 'Billion Tomans/Yr'}</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/40 to-slate-900 border border-emerald-500/40">
                <div className="text-xs text-slate-300">{isFa ? 'کل صرفه‌جویی اقتصادی مستقیم سالانه:' : 'Total Direct Annual Cost Savings:'}</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono mt-1">
                  {annualSavingsBillionToman.toFixed(2)} <span className="text-sm font-sans font-normal">{isFa ? 'میلیارد تومان در سال' : 'Billion Tomans / Year'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {isFa 
                    ? `معادل ماهانه ${(totalMonthlySavingsMlnToman).toFixed(0)} میلیون تومان سود خالص افزوده`
                    : `Equivalent to ${(totalMonthlySavingsMlnToman).toFixed(0)} Million Tomans monthly net value`}
                </div>
              </div>
            </div>

            {/* Payback period indicator */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">{isFa ? 'دوره بازگشت کامل سرمایه‌گذاری:' : 'Estimated Payback Period:'}</div>
                <div className="text-lg font-bold text-cyan-300 font-mono">{roiPaybackMonths} {isFa ? 'ماه' : 'Months'}</div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-xs font-semibold">
                {roiPaybackMonths <= 12 ? (isFa ? 'فوق‌العاده توجیه‌پذیر' : 'Highly Viable') : (isFa ? 'استاندارد صنعتی' : 'Industrial Standard')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 6 Proposal Modules Showcase */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            {isFa ? 'دامنه فنی پروپوزال‌های ابتکار ویستا' : 'Core Architecture Modules'}
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-white mt-1">
            {isFa ? 'ارکان ۶گانه پلتفرم یکپارچه هوشمند فنر لول' : '6 Integrated Pillars of the Manufacturing Platform'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {isFa 
              ? 'ترکیب کامل ویژگی‌های فنی مندرج در پروپوزال‌های ۱ و ۲ با استاندارد بین‌المللی DIN EN 13906-1 و معماری لبه تا ابر (Edge to Cloud)'
              : 'Complete synthesis of proposal specifications, German automotive DIN standards, and edge-to-cloud computing.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectTab(m.id)}
              className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:bg-slate-900/90 shadow-lg hover:shadow-cyan-950/20"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${m.color}`}>
                    {m.icon}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {isFa ? `ماژول ${m.num}` : `Module ${m.num}`}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                  {isFa ? m.titleFa : m.titleEn}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {isFa ? m.descFa : m.descEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium group-hover:translate-x-[-2px] transition-transform">
                <span>{isFa ? 'مشاهده سامانه و دیتای زنده' : 'Inspect Live Subsystem'}</span>
                <ChevronRight className={`w-4 h-4 ${isFa ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industrial Architecture / System Flow Diagram */}
      <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          <span>{isFa ? 'معماری فنی و جریان داده‌های صنعتی (ISA-95 & Edge-to-Cloud)' : 'Technical Architecture & Industrial Data Flow'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs font-mono text-cyan-400 font-bold mb-1">L0 - L1: لایه تجهیزات و سنسورها</div>
            <p className="text-xs text-slate-300">
              دوربین‌های صنعتی Basler، اسکنرهای ۳بعدی Keyence، سنسورهای شتاب‌سنج سه‌محوره IEPE، ترموکوپل‌های PT100 کوره و کنتورهای برق Schneider.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs font-mono text-emerald-400 font-bold mb-1">L2: پردازش لبه و اتوماسیون (Edge IPC)</div>
            <p className="text-xs text-slate-300">
              کامپیوترهای صنعتی زیمنس و ادونتک با کارت گرافیک Nvidia Jetson، اجرای الگوریتم‌های بلادرنگ بینایی با تأخیر زیر ۲۰ میلی‌ثانیه و فیدبک مستقیم به PLC.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs font-mono text-amber-400 font-bold mb-1">L3: نرم‌افزار و دوقلوی دیجیتال کارخانه</div>
            <p className="text-xs text-slate-300">
              سرور مرکزی مستقر در کارخانه فنر لول، پروتکل‌های OPC-UA و MQTT، دوقلوی دیجیتال ۳بعدی با محاسبه تنش‌های وال و موتور پیش‌بینی خرابی ماشین‌آلات.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs font-mono text-purple-400 font-bold mb-1">L4: پلتفرم ابری صنایع استان سمنان</div>
            <p className="text-xs text-slate-300">
              مخزن MLOps برای توزیع خودکار وزن‌های هوش مصنوعی، بنچ‌مارکینگ کیفی بین واحدهای صنعتی و یکپارچگی با سامانه‌های مدیریت کارخانه (ERP).
            </p>
          </div>
        </div>
      </section>

      {/* Project Execution Team Profile (Vesta Smart Network) */}
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            {isFa ? 'تیم فنی و مجری پروژه' : 'Executing Consortium'}
          </div>
          <h3 className="text-xl font-bold text-white">
            {isFa ? 'شرکت شبکه هوشمند ابتکار ویستا' : 'Vesta Smart Network Co.'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isFa ? (
              'عضو پارک علم و فناوری استان سمنان و سازمان نظام صنفی رایانه‌ای. تیم تخصصی مجری سامانه‌های بینایی ماشین، اینترنت اشیاء صنعتی (IIoT)، الگوریتم‌های پیشرفته یادگیری عمیق و نگهداری پیش‌بینانه در کارخانجات کشور.'
            ) : (
              'Member of Semnan Science and Technology Park. Specialized in industrial computer vision, edge AI, IoT architectures, and condition monitoring.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <span>مدیرعامل: آقای مسعود بخشی</span>
            <span>•</span>
            <span>هیئت‌مدیره: آقای محمدرضا یوسفی</span>
            <span>•</span>
            <span>آقای محمد بخشی</span>
            <span>•</span>
            <span>Devcodebase.dev@gmail.com</span>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('proposals_roadmap')}
          className="shrink-0 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-700/50 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <span>{isFa ? 'مشاهده سند کامل پروپوزال و فازبندی' : 'View Full Roadmap'}</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
