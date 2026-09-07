import React, { useState } from 'react';
import { Language } from '../types';
import { SHIFT_DATA, DOWNTIME_PARETO } from '../mockData';
import { 
  BarChart3, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface Module5OEEProps {
  lang: Language;
}

export const Module5OEE: React.FC<Module5OEEProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [selectedShift, setSelectedShift] = useState(SHIFT_DATA[0]); // Morning shift

  // Overall OEE Metrics
  const currentOee = Number(((selectedShift.availability * selectedShift.performance * selectedShift.quality) / 10000).toFixed(1));
  const worldClassOeeTarget = 85.0;

  const COLORS = ['#38bdf8', '#f59e0b', '#f43f5e', '#a855f7', '#10b981', '#64748b'];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۵ پروپوزال: بهره‌وری خطوط و OEE' : 'Module 5: Smart OEE & Production Analytics'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'داشبورد جامع اثربخشی کلی تجهیزات (OEE) و پارتوی توقفات' : 'Overall Equipment Effectiveness (OEE) & Downtime Pareto'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'محاسبه بلادرنگ شاخص‌های دسترس‌پذیری، نرخ کارایی و کیفیت بر اساس استاندارد جهانی، پایش شیفت‌های کاری کارخانه فنر لول و شاخص‌های قابلیت اطمینان MTBF / MTTR.'
              : 'Real-time computation of Availability, Performance, and Quality components across 3 shifts with downtime root cause Pareto.'}
          </p>
        </div>

        {/* Shift Picker */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          {SHIFT_DATA.map((s) => (
            <button
              key={s.shiftId}
              onClick={() => setSelectedShift(s)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedShift.shiftId === s.shiftId
                  ? 'bg-purple-950 text-purple-300 border border-purple-600 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isFa ? s.shiftNameFa : s.shiftNameEn}
            </button>
          ))}
        </div>
      </div>

      {/* The 3 Pillars of OEE + Overall Gauge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall OEE */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/50 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'شاخص جامع اثربخشی (OEE):' : 'Overall OEE:'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              هدف: ۸۵.۰٪
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-purple-300 mt-2">
            {currentOee}%
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {currentOee >= worldClassOeeTarget ? (
              <span className="text-emerald-400 font-medium">سطح کلاس جهانی (World-Class)</span>
            ) : (
              <span className="text-amber-400 font-medium">{isFa ? 'در مسیر رسیدن به هدف کلاس جهانی' : 'Approaching World-Class'}</span>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'دسترس‌پذیری (Availability):' : 'Availability (A):'}</span>
            <span className="text-emerald-400 font-mono">کارکرد / زمان برنامه‌ریزی</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-2">
            {selectedShift.availability}%
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            توقف کل شیفت: <strong>{selectedShift.downtimeMinutes} دقیقه</strong>
          </div>
        </div>

        {/* Performance */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'نرخ عملکرد (Performance):' : 'Performance (P):'}</span>
            <span className="text-cyan-400 font-mono">سرعت واقعی / اسمی</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 mt-2">
            {selectedShift.performance}%
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            تولید: <strong>{selectedShift.productionUnits} از {selectedShift.targetUnits} عدد</strong>
          </div>
        </div>

        {/* Quality */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'نرخ کیفیت (Quality):' : 'Quality (Q):'}</span>
            <span className="text-yellow-400 font-mono">قطعات سالم / کل تولید</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-yellow-400 mt-2">
            {selectedShift.quality}%
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            ضایعات: <strong>{selectedShift.scrapUnits} عدد ({(100 - selectedShift.quality).toFixed(1)}%)</strong>
          </div>
        </div>
      </div>

      {/* Charts Row: Downtime Pareto & Reliability MTBF / MTTR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Downtime Pareto Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'نمودار پارتو علل ریشه‌ای توقفات خطوط (Downtime Pareto)' : 'Downtime Root Cause Pareto'}</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  تفکیک ساعات توقف ماهانه به تفکیک ماشین‌آلات
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                مجموع: ۵۲.۵ ساعت
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DOWNTIME_PARETO} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="causeFa" stroke="#64748b" fontSize={9} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={10} unit=" h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="hoursLost" fill="#a855f7" radius={[4, 4, 0, 0]} name="ساعات توقف (ساعت)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">{isFa ? 'عامل اصلی توقفات:' : 'Major Downtime Bottleneck:'}</span>
            <span className="text-amber-400 font-bold">گیرکردن مفتول کلاف‌بازکن (۳۴.۷٪ کل توقفات)</span>
          </div>
        </div>

        {/* Reliability & Maintenance Metrics (MTBF / MTTR) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'شاخص‌های قابلیت اطمینان و نگهداری (Reliability KPI)' : 'Equipment Reliability & Maintainability'}</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{isFa ? 'میانگین زمان بین خرابی‌ها (MTBF):' : 'Mean Time Between Failures (MTBF):'}</span>
                  <span className="text-base font-bold font-mono text-emerald-400">48.5 {isFa ? 'ساعت' : 'Hours'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isFa ? 'افزایش ۳۲٪ نسبت به پیش از استقرار سنسورهای PdM' : '+32% improvement after PdM setup'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{isFa ? 'میانگین زمان تعمیر (MTTR):' : 'Mean Time To Repair (MTTR):'}</span>
                  <span className="text-base font-bold font-mono text-cyan-300">38.2 {isFa ? 'دقیقه' : 'Minutes'}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isFa ? 'کاهش زمان تعمیر با رزرو خودکار قطعات یدکی و هشدارهای پیش‌بینانه' : 'Faster repair with pre-dispatched parts'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{isFa ? 'ضریب دسترسی ذاتی (Inherent Availability):' : 'Inherent Availability (Ai):'}</span>
                  <span className="text-base font-bold font-mono text-purple-300">98.7%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  MTBF / (MTBF + MTTR)
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-300">
            {isFa 
              ? 'پیش‌بینی هوش مصنوعی: با تعمیر بیرینگ فنرپیچ طی تعطیلات آخر هفته، MTBF به ۵۴ ساعت افزایش خواهد یافت.'
              : 'Proactive weekend bearing replacement will boost MTBF to 54 hours.'}
          </div>
        </div>
      </div>
    </div>
  );
};
