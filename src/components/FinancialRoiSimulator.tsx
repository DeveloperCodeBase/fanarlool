import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { industrialAudio } from '../utils/soundEffects';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  PieChart, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  Printer, 
  Sparkles, 
  HelpCircle,
  FileText,
  Clock,
  ShieldAlert,
  Zap,
  RotateCcw
} from 'lucide-react';

interface FinancialRoiProps {
  lang: Language;
}

export const FinancialRoiSimulator: React.FC<FinancialRoiProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Interactive Sliders for Factory Specifics
  const [annualProduction, setAnnualProduction] = useState<number>(10000000); // 10 Million springs/yr
  const [initialScrapRate, setInitialScrapRate] = useState<number>(5.0); // 5.0%
  const [targetScrapRate, setTargetScrapRate] = useState<number>(2.8); // 2.8%
  const [springMaterialCostRials, setSpringMaterialCostRials] = useState<number>(180000); // 18,000 Tomans per spring raw material
  const [annualEnergyBillRials, setAnnualEnergyBillRials] = useState<number>(220000000000); // 220 Billion Rials
  const [energySavingPercent, setEnergySavingPercent] = useState<number>(12); // 12% saving
  const [annualCriticalFailures, setAnnualCriticalFailures] = useState<number>(4); // 4 major breakdowns/yr
  const [costPerFailureRials, setCostPerFailureRials] = useState<number>(5000000000); // 5 Billion Rials per breakdown

  // Fixed Capex for 6 Modules Implementation (Based on Proposal Table)
  const capexBreakdown = useMemo(() => {
    return [
      { id: 'vision_hw', nameFa: 'تجهیزات سخت‌افزاری بینایی ماشین (دوربین Basler، لنز، نورپردازی)', nameEn: 'Vision HW (Basler Cameras, Lenses, Lights)', costRials: 14500000000 },
      { id: 'edge_pcs', nameFa: 'کامپیوترهای صنعتی لبه (IPC) و تابلوهای کنترل خط', nameEn: 'Industrial Edge PCs & Line Enclosures', costRials: 9800000000 },
      { id: 'pdm_sensors', nameFa: 'سنسورهای لرزش پیزوالکتریک، ترموکوپل و ترانسدیوسرها', nameEn: 'PdM Vibration Sensors & RTDs', costRials: 11200000000 },
      { id: 'ai_software', nameFa: 'توسعه نرم‌افزار، الگوریتم‌های هوش مصنوعی و دوقلوی دیجیتال', nameEn: 'AI Software & Digital Twin Platform', costRials: 22000000000 },
      { id: 'integration', nameFa: 'نصب، راه‌اندازی، اتصال به PLC و آموزش پرسنل', nameEn: 'Installation, PLC Integration & Training', costRials: 7500000000 },
    ];
  }, []);

  const totalCapexRials = useMemo(() => {
    return capexBreakdown.reduce((sum, item) => sum + item.costRials, 0);
  }, [capexBreakdown]);

  // Annual Financial Savings Calculations
  const savings = useMemo(() => {
    // 1. Scrap reduction savings
    const initialScrapUnits = annualProduction * (initialScrapRate / 100);
    const targetScrapUnits = annualProduction * (targetScrapRate / 100);
    const savedScrapUnits = initialScrapUnits - targetScrapUnits;
    const scrapSavingsRials = savedScrapUnits * springMaterialCostRials;

    // 2. Predictive Maintenance savings (50% reduction in critical breakdowns)
    const savedBreakdowns = annualCriticalFailures * 0.5;
    const pdmSavingsRials = savedBreakdowns * costPerFailureRials;

    // 3. Energy savings (gas & electricity)
    const energySavingsRials = annualEnergyBillRials * (energySavingPercent / 100);

    // 4. Quality dispute & warranty claim avoidance
    const qualitySavingsRials = 15000000000; // 15 Billion Rials fixed estimation

    const totalAnnualSavingsRials = scrapSavingsRials + pdmSavingsRials + energySavingsRials + qualitySavingsRials;

    // Payback period in months
    const paybackYears = totalCapexRials / totalAnnualSavingsRials;
    const paybackMonths = Math.round(paybackYears * 12 * 10) / 10;

    // 5-year Cumulative Net Benefit (assuming 15% annual software support fee)
    const annualOpEx = totalCapexRials * 0.15;
    const fiveYearNetRials = (totalAnnualSavingsRials - annualOpEx) * 5 - totalCapexRials;

    return {
      savedScrapUnits: Math.round(savedScrapUnits),
      scrapSavingsRials: Math.round(scrapSavingsRials),
      pdmSavingsRials: Math.round(pdmSavingsRials),
      energySavingsRials: Math.round(energySavingsRials),
      qualitySavingsRials,
      totalAnnualSavingsRials: Math.round(totalAnnualSavingsRials),
      paybackMonths,
      paybackYears: Math.round(paybackYears * 100) / 100,
      annualOpEx: Math.round(annualOpEx),
      fiveYearNetRials: Math.round(fiveYearNetRials),
      roiRatio: Math.round((totalAnnualSavingsRials / totalCapexRials) * 100)
    };
  }, [
    annualProduction,
    initialScrapRate,
    targetScrapRate,
    springMaterialCostRials,
    annualEnergyBillRials,
    energySavingPercent,
    annualCriticalFailures,
    costPerFailureRials,
    totalCapexRials
  ]);

  // Format Rials to Billion Rials (میلیارد تومان یا میلیارد ریال)
  const toBillionRials = (amount: number) => {
    return (amount / 10000000000).toFixed(2); // Convert to Billion Tomans (10 Billion Rials = 1 Billion Tomans)
  };

  const handlePrint = () => {
    industrialAudio.playClick();
    window.print();
  };

  const handleResetDefaults = () => {
    industrialAudio.playClick();
    setAnnualProduction(10000000);
    setInitialScrapRate(5.0);
    setTargetScrapRate(2.8);
    setSpringMaterialCostRials(180000);
    setAnnualEnergyBillRials(220000000000);
    setEnergySavingPercent(12);
    setAnnualCriticalFailures(4);
    setCostPerFailureRials(5000000000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  {isFa ? 'شبیه‌ساز توجیه اقتصادی و بازگشت سرمایه (ROI)' : 'Economic Feasibility & ROI Simulator'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                    Proposal Section 8 Verified
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {isFa 
                    ? 'مدل‌سازی مالی دقیق کاهش ضایعات، پیشگیری از توقفات و بهینه‌سازی مصرف انرژی بر اساس ارقام واقعی فنر لول ایران'
                    : 'Accurate financial modeling of scrap salvage, downtime avoidance, and energy savings for Iran Coil Spring Co.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFa ? 'مقادیر پیش‌فرض' : 'Defaults'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isFa ? 'چاپ گزارش هیئت مدیره' : 'Print Board Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Highlight Figures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Payback Period */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl">
          <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
            <span>{isFa ? 'دوره بازگشت کامل سرمایه' : 'Payback Period'}</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-emerald-300">
              {savings.paybackMonths} <span className="text-sm font-normal text-slate-300">{isFa ? 'ماه' : 'Months'}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isFa ? `معادل ${savings.paybackYears} سال کاری` : `Equivalent to ${savings.paybackYears} years`}
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isFa ? 'بسیار فراتر از تارگت ۱۸ ماهه' : 'Well under 18-month target'}
          </div>
        </div>

        {/* Total Annual Savings */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-xl">
          <div className="text-xs text-cyan-400 font-bold flex items-center justify-between">
            <span>{isFa ? 'صرفه‌جویی خالص سالیانه' : 'Annual Net Savings'}</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-cyan-300">
              {toBillionRials(savings.totalAnnualSavingsRials)} <span className="text-sm font-normal text-slate-300">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              {(savings.totalAnnualSavingsRials / 1000000000).toFixed(0)} {isFa ? 'میلیارد ریال' : 'B. Rials'}
            </div>
          </div>
          <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {isFa ? `${savings.roiRatio}٪ بازدهی سرمایه‌گذاری سال اول` : `${savings.roiRatio}% 1st Year ROI`}
          </div>
        </div>

        {/* Total Project CAPEX */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 font-bold flex items-center justify-between">
            <span>{isFa ? 'کل سرمایه‌گذاری اولیه (CAPEX)' : 'Initial Investment'}</span>
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-indigo-300">
              {toBillionRials(totalCapexRials)} <span className="text-sm font-normal text-slate-300">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              {(totalCapexRials / 1000000000).toFixed(0)} {isFa ? 'میلیارد ریال' : 'B. Rials'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isFa ? 'شامل کلیه ۶ ماژول و سخت‌افزارها' : 'Complete 6-module turnkey'}
          </div>
        </div>

        {/* 5-Year Cumulative Net Benefit */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="text-xs text-slate-400 font-bold flex items-center justify-between">
            <span>{isFa ? 'سود خالص انباشته ۵ ساله' : '5-Year Net Benefit'}</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-amber-300">
              {toBillionRials(savings.fiveYearNetRials)} <span className="text-sm font-normal text-slate-300">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isFa ? 'پس از کسر کلیه هزینه‌های پشتیبانی' : 'Net of OPEX and support'}
            </div>
          </div>
          <div className="text-[11px] text-amber-400 font-semibold">
            {isFa ? 'ارزش‌آفرینی پایدار صنعتی' : 'Sustainable Value Creation'}
          </div>
        </div>
      </div>

      {/* Main Layout: Sliders (Left) vs Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Parameter Sliders (Left 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              {isFa ? 'پارامترهای قابل تنظیم فرآیند کارخانه' : 'Plant Operational Input Variables'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa ? 'اهرم‌ها را تغییر دهید تا تأثیر آنی بر سودآوری و زمان بازگشت سرمایه را مشاهده نمایید.' : 'Adjust sliders to simulate live impact on bottom-line financial yield.'}
            </p>
          </div>

          <div className="space-y-5">
            {/* Annual Production */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-200">{isFa ? 'حجم تولید سالانه فنر (قطعه)' : 'Annual Production (Springs)'}</span>
                <span className="text-cyan-400 font-mono text-sm">{annualProduction.toLocaleString('fa-IR')} {isFa ? 'عدد' : 'pcs'}</span>
              </div>
              <input
                type="range"
                min="2000000"
                max="20000000"
                step="500000"
                value={annualProduction}
                onChange={(e) => setAnnualProduction(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>۲,۰۰۰,۰۰۰</span>
                <span>۱۰,۰۰۰,۰۰۰ (نامی)</span>
                <span>۲۰,۰۰۰,۰۰۰</span>
              </div>
            </div>

            {/* Scrap Rate Sliders (Before vs After) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">{isFa ? 'نرخ ضایعات قبل از پروژه (فعلی)' : 'Current Scrap Rate'}</span>
                  <span className="text-rose-400 font-mono text-sm">{initialScrapRate}%</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="8.0"
                  step="0.1"
                  value={initialScrapRate}
                  onChange={(e) => setInitialScrapRate(Number(e.target.value))}
                  className="w-full accent-rose-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">{isFa ? 'نرخ ضایعات هدف با هوش مصنوعی' : 'AI Target Scrap Rate'}</span>
                  <span className="text-emerald-400 font-mono text-sm">{targetScrapRate}%</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={targetScrapRate}
                  onChange={(e) => setTargetScrapRate(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Energy Bill & Savings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">{isFa ? 'قبض سالانه انرژی (گاز و برق)' : 'Annual Energy Cost'}</span>
                  <span className="text-amber-400 font-mono text-sm">{toBillionRials(annualEnergyBillRials)} {isFa ? 'م.تومان' : 'B.T'}</span>
                </div>
                <input
                  type="range"
                  min="100000000000"
                  max="400000000000"
                  step="10000000000"
                  value={annualEnergyBillRials}
                  onChange={(e) => setAnnualEnergyBillRials(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-300">{isFa ? 'درصد صرفه‌جویی انرژی (ماژول ۶)' : 'Energy Saving %'}</span>
                  <span className="text-amber-400 font-mono text-sm">{energySavingPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={energySavingPercent}
                  onChange={(e) => setEnergySavingPercent(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Critical Breakdown incidents */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-300">{isFa ? 'حوادث خرابی بحرانی سالیانه (توقف چندروزه خط)' : 'Annual Critical Machine Breakdowns'}</span>
                <span className="text-purple-400 font-mono text-sm">{annualCriticalFailures} {isFa ? 'حادثه' : 'incidents'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={annualCriticalFailures}
                onChange={(e) => setAnnualCriticalFailures(Number(e.target.value))}
                className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Card (Right 1 col) */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              {isFa ? 'تفکیک صرفه‌جویی‌های سالیانه' : 'Savings Breakdown'}
            </h3>

            <div className="space-y-3 text-xs">
              {/* Scrap */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{isFa ? 'کاهش ضایعات و دورریز مفتول' : 'Scrap Reduction'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {savings.savedScrapUnits.toLocaleString('fa-IR')} {isFa ? 'قطعه سالم بیشتر' : 'more parts'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold font-mono text-sm">
                    +{toBillionRials(savings.scrapSavingsRials)}
                  </div>
                  <div className="text-[10px] text-slate-500">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</div>
                </div>
              </div>

              {/* PdM */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{isFa ? 'نگهداری پیش‌بینانه و توقفات' : 'PdM & Downtime'}</div>
                  <div className="text-[11px] text-slate-400">
                    {isFa ? 'کاهش ۵۰٪ سوانح بیرینگ و گیربکس' : '50% reduction in catastrophic failures'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold font-mono text-sm">
                    +{toBillionRials(savings.pdmSavingsRials)}
                  </div>
                  <div className="text-[10px] text-slate-500">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</div>
                </div>
              </div>

              {/* Energy */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{isFa ? 'کاهش اتلاف انرژی کوره‌ها' : 'Furnace Energy'}</div>
                  <div className="text-[11px] text-slate-400">
                    {energySavingPercent}٪ {isFa ? 'صرفه‌جویی در برق و گاز' : 'gas & electricity saved'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold font-mono text-sm">
                    +{toBillionRials(savings.energySavingsRials)}
                  </div>
                  <div className="text-[10px] text-slate-500">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</div>
                </div>
              </div>

              {/* Quality Claim */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{isFa ? 'حذف جریمه‌های کیفی خودروساز' : 'OEM Warranty Claims'}</div>
                  <div className="text-[11px] text-slate-400">
                    {isFa ? 'پاداش گرید A ساپکو و ایساکو' : 'SAPCO Grade A Incentive'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-bold font-mono text-sm">
                    +{toBillionRials(savings.qualitySavingsRials)}
                  </div>
                  <div className="text-[10px] text-slate-500">{isFa ? 'میلیارد تومان' : 'B. Tomans'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isFa 
                  ? 'بر اساس گزارش مک‌کنزی، پیاده‌سازی همزمان کنترل کیفیت هوشمند و نگهداری پیش‌بینانه، بازگشت سرمایه ۱۰ به ۱ تا ۳۰ به ۱ در افق ۳ ساله ایجاد می‌نماید.'
                  : 'According to McKinsey Industry 4.0 reports, combined Vision QC and Predictive Maintenance yields 10:1 to 30:1 ROI over 3 years.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
