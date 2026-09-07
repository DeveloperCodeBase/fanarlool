import React, { useState } from 'react';
import { Language } from '../types';
import { ENERGY_DATA } from '../mockData';
import { 
  Zap, 
  Flame, 
  Wind, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  Leaf,
  Activity,
  Gauge
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';

interface Module6EnergyProps {
  lang: Language;
}

export const Module6Energy: React.FC<Module6EnergyProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [activeCarrier, setActiveCarrier] = useState<'electricity' | 'gas' | 'air'>('electricity');

  // Hourly energy consumption timeline for past 24 hours
  const hourlyEnergyData = [
    { hour: '00:00', powerKw: 280, gasFlow: 140, airPressure: 7.2 },
    { hour: '03:00', powerKw: 260, gasFlow: 135, airPressure: 7.3 },
    { hour: '06:00', powerKw: 340, gasFlow: 155, airPressure: 7.0 },
    { hour: '09:00', powerKw: 460, gasFlow: 195, airPressure: 6.8 }, // Peak production
    { hour: '12:00', powerKw: 480, gasFlow: 205, airPressure: 6.7 },
    { hour: '15:00', powerKw: 440, gasFlow: 185, airPressure: 6.9 },
    { hour: '18:00', powerKw: 390, gasFlow: 165, airPressure: 7.1 },
    { hour: '21:00', powerKw: 350, gasFlow: 150, airPressure: 7.2 },
  ];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۶ پروپوزال: مانیتورینگ هوشمند حامل‌های انرژی' : 'Module 6: Smart Energy Intelligence'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'سامانه مانیتورینگ حامل‌های انرژی و شدت مصرف (SEC)' : 'Multi-Carrier Energy Monitoring & SEC per Ton'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'پایش بلادرنگ برق خطوط و دیماند پیک، گاز طبیعی کوره‌های مداوم آستنیته و تمپر، پایش نشتی هوای فشرده و محاسبه شدت مصرف ویژه انرژی به ازای هر تن محصول.'
              : 'Real-time telemetry for electric power, furnace natural gas, compressed air pneumatic leaks, and specific energy consumption per ton.'}
          </p>
        </div>

        {/* Carrier Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveCarrier('electricity')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeCarrier === 'electricity' ? 'bg-yellow-950 text-yellow-300 border border-yellow-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isFa ? 'برق و توان (kW)' : 'Power'}</span>
          </button>
          <button
            onClick={() => setActiveCarrier('gas')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeCarrier === 'gas' ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isFa ? 'گاز کوره‌ها (m³/h)' : 'Gas'}</span>
          </button>
          <button
            onClick={() => setActiveCarrier('air')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeCarrier === 'air' ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{isFa ? 'هوای فشرده و نشتی' : 'Air Leaks'}</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'توان لحظه‌ای برق کارخانه:' : 'Active Electrical Demand:'}</div>
          <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">{ENERGY_DATA.currentPowerKw} kW</div>
          <span className="text-[10px] text-slate-500 font-mono">دیماند خریداری‌شده: ۵۰۰ kW</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'جریان گاز طبیعی کوره‌ها:' : 'Furnace Natural Gas Flow:'}</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{ENERGY_DATA.furnaceGasFlowM3h} m³/h</div>
          <span className="text-[10px] text-slate-500 font-mono">دمای کوره: ۸۸۵°C</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'فشار شبکه هوای فشرده:' : 'Pneumatic Header Pressure:'}</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{ENERGY_DATA.compressedAirPressureBar} bar</div>
          <span className="text-[10px] text-slate-500 font-mono">محدوده ایمن: ۶.۵ تا ۷.۵ بار</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'شدت مصرف به ازای تن محصول:' : 'Specific Energy (SEC/Ton):'}</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{ENERGY_DATA.specificEnergyKwhPerTon} kWh/t</div>
          <span className="text-[10px] text-emerald-400 font-mono">کاهش ۸.۵٪ مصرف</span>
        </div>
      </div>

      {/* Main Energy Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hourly Consumption Timeline */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span>
                    {activeCarrier === 'electricity' && (isFa ? 'پروفیل بار مصرفی برق ۲۴ ساعت گذشته (kW)' : '24-Hour Active Power Demand (kW)')}
                    {activeCarrier === 'gas' && (isFa ? 'دبی مصرف گاز طبیعی کوره‌ها (m³/h)' : '24-Hour Furnace Gas Flow (m³/h)')}
                    {activeCarrier === 'air' && (isFa ? 'فشار شبکه هوای فشرده کمپرسورخانه (bar)' : 'Compressed Air Pressure Profile (bar)')}
                  </span>
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-800">
                فرکانس قرائت: هر ۱ ثانیه
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyEnergyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  {activeCarrier === 'electricity' && (
                    <Area type="monotone" dataKey="powerKw" stroke="#eab308" fillOpacity={1} fill="url(#energyGrad)" strokeWidth={2} name="توان الکتریکی (kW)" />
                  )}
                  {activeCarrier === 'gas' && (
                    <Area type="monotone" dataKey="gasFlow" stroke="#f59e0b" fillOpacity={1} fill="url(#energyGrad)" strokeWidth={2} name="دبی گاز (m³/h)" />
                  )}
                  {activeCarrier === 'air' && (
                    <Area type="monotone" dataKey="airPressure" stroke="#38bdf8" fillOpacity={1} fill="url(#energyGrad)" strokeWidth={2} name="فشار هوای فشرده (bar)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">{isFa ? 'مدیریت پیک بار دیماند برق:' : 'Peak Shaving Status:'}</span>
            <span className="text-emerald-400 font-bold font-mono">
              {isFa ? 'عاری از جریمه اوج بار دیماند (Peak Power < 500 kW)' : 'Zero peak demand penalty'}
            </span>
          </div>
        </div>

        {/* Compressed Air Leak Detection & Financial Cost Box */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* AI Pneumatic Leak Detector Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                <Wind className="w-4 h-4" />
                <span>{isFa ? 'آشکارساز هوشمند نشتی باد' : 'AI Pneumatic Leak Detector'}</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                ENERGY_DATA.airLeaksDetectedCount > 0 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {ENERGY_DATA.airLeaksDetectedCount} نشتی فعال
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">محل نشتی شناسایی‌شده:</span>
                <span className="text-amber-300 font-bold">کوپلینگ سیلندر شات‌پینینگ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">افت دبی نشتی:</span>
                <span className="text-rose-400 font-mono font-bold">۰.۴۵ m³/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">هزینه اتلاف ماهانه:</span>
                <span className="text-rose-400 font-mono font-bold">۱۴.۵ میلیون تومان</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              {isFa ? 'سنسور اولتراسونیک آکوستیک با فرکانس ۳۸ کیلوهرتز نشتی اتصال شلنگ هوای فشرده را مشخص کرد.' : 'Ultrasonic acoustic signature detected fitting leak.'}
            </p>
          </div>

          {/* Environmental Carbon & Financial Impact */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <Leaf className="w-4 h-4" />
              <span>{isFa ? 'ردپای کربن و صرفه‌جویی ریالی' : 'Carbon Offset & Utility Cost'}</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/80">
                <span className="text-slate-400">کاهش انتشار گازهای گلخانه‌ای:</span>
                <span className="text-emerald-400 font-bold">{ENERGY_DATA.carbonOffsetTons} tCO₂e</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/80">
                <span className="text-slate-400">صرفه‌جویی ماهیانه قبوض انرژی:</span>
                <span className="text-emerald-400 font-bold">۴۸.۵ میلیون تومان</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
