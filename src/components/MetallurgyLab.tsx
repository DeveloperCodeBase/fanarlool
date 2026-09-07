import React, { useState } from 'react';
import { Language } from '../types';
import { ALLOY_MATERIALS } from '../mockData';
import { 
  FlaskConical, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Activity, 
  TrendingUp, 
  Zap, 
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface MetallurgyLabProps {
  lang: Language;
}

export const MetallurgyLab: React.FC<MetallurgyLabProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [selectedAlloyCode, setSelectedAlloyCode] = useState<string>('54SiCr6');
  const [almenIntensity, setAlmenIntensity] = useState<number>(0.35); // 0.20 to 0.50 mmA
  const [shotPeeningCoverage, setShotPeeningCoverage] = useState<number>(200); // 100% to 300%
  const [quenchOilTemp, setQuenchOilTemp] = useState<number>(65); // 50 to 90 °C
  const [temperingTemp, setTemperingTemp] = useState<number>(435); // 400 to 480 °C

  const currentAlloy = ALLOY_MATERIALS.find(a => a.code === selectedAlloyCode) || ALLOY_MATERIALS[0];

  // Calculated metallurgical outputs
  // Hardness decreases if tempering temperature increases
  const calculatedHardnessHrc = Number((54 - (temperingTemp - 400) * 0.075).toFixed(1));
  // Residual stress peak calculation based on Almen intensity
  const peakCompressiveStressMpa = Number((650 + almenIntensity * 850).toFixed(0)); // e.g. -948 MPa
  // Fatigue endurance limit enhancement by shot peening
  const fatigueLimitEnhancementPercent = Number((22 + (almenIntensity - 0.2) * 45 + (shotPeeningCoverage - 100) * 0.08).toFixed(1));

  // Goodman Diagram Data Points (Torsional Mean Stress tau_m vs Max Permissible Stress Amplitude tau_a)
  // DIN EN 13906-1 Fatigue Envelope
  const goodmanData = [
    { tau_m: 0, tau_a_unpeened: 480, tau_a_peened: 620, staticLimit: 1000 },
    { tau_m: 200, tau_a_unpeened: 430, tau_a_peened: 570, staticLimit: 950 },
    { tau_m: 400, tau_a_unpeened: 360, tau_a_peened: 510, staticLimit: 850 },
    { tau_m: 600, tau_a_unpeened: 270, tau_a_peened: 420, staticLimit: 750 },
    { tau_m: 800, tau_a_unpeened: 160, tau_a_peened: 310, staticLimit: 600 },
  ];

  // Residual Stress Depth Profile Data (X-Ray Diffraction XRD depth profile)
  const residualStressProfile = [
    { depthMicrons: 0, stressMpa: -320 },
    { depthMicrons: 25, stressMpa: -780 },
    { depthMicrons: 50, stressMpa: -Number(peakCompressiveStressMpa) }, // Peak compressive layer
    { depthMicrons: 100, stressMpa: -740 },
    { depthMicrons: 150, stressMpa: -510 },
    { depthMicrons: 200, stressMpa: -280 },
    { depthMicrons: 300, stressMpa: -90 },
    { depthMicrons: 400, stressMpa: 40 }, // Transition to core balancing tensile stress
    { depthMicrons: 600, stressMpa: 80 },
  ];

  // S-N Wöhler Curve Data (Cycles to Failure vs Stress Amplitude in MPa)
  const wohlerData = [
    { cyclesLog: '10^4', cyclesNumber: 10000, stressUnpeened: 820, stressPeened: 980 },
    { cyclesLog: '5x10^4', cyclesNumber: 50000, stressUnpeened: 710, stressPeened: 860 },
    { cyclesLog: '10^5', cyclesNumber: 100000, stressUnpeened: 620, stressPeened: 780 },
    { cyclesLog: '5x10^5', cyclesNumber: 500000, stressUnpeened: 530, stressPeened: 690 },
    { cyclesLog: '10^6', cyclesNumber: 1000000, stressUnpeened: 480, stressPeened: 630 },
    { cyclesLog: '5x10^6', cyclesNumber: 5000000, stressUnpeened: 460, stressPeened: 615 },
    { cyclesLog: '10^7', cyclesNumber: 10000000, stressUnpeened: 450, stressPeened: 610 }, // Automotive 10 million cycles requirement
  ];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>{isFa ? 'آزمایشگاه تخصصی متالورژی، عملیات حرارتی و خستگی دینامیکی' : 'Advanced Metallurgy & Dynamic Fatigue Lab'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'شبیه‌ساز دیاگرام گودمن DIN EN 13906-1 و پروفیل تنش پسماند شات‌پینینگ' : 'Goodman Fatigue Limits & Shot Peening Residual Stress'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'تحلیل دقیق متالورژیکی فولادهای فنر ۵۴SiCr6 و ۵۱CrV4، تخمین عمر خستگی با نمودار ولر (S-N Curve)، تنش‌های فشاری پسماند و بهینه‌سازی پارامترهای کوره تمپرینگ و شدت آلمن.'
              : 'DIN EN 13906-1 Goodman torsional envelope, Wöhler fatigue life, and XRD depth compressive stress profile.'}
          </p>
        </div>

        {/* Alloy Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          {ALLOY_MATERIALS.map((a) => (
            <button
              key={a.code}
              onClick={() => setSelectedAlloyCode(a.code)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-mono ${
                selectedAlloyCode === a.code
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {a.code}
            </button>
          ))}
        </div>
      </div>

      {/* Material Technical Sheet Overview */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">{isFa ? 'نام و گرید استاندارد فولاد:' : 'Standard Grade:'}</span>
          <div className="text-sm font-bold text-white font-mono">{currentAlloy.nameFa}</div>
          <span className="text-[11px] text-cyan-400 font-mono">{currentAlloy.standard}</span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">{isFa ? 'استحکام کششی و تسلیم:' : 'Tensile & Yield Strength:'}</span>
          <div className="text-sm font-bold text-emerald-400 font-mono">Rm: {currentAlloy.tensileStrengthRm} MPa</div>
          <span className="text-[11px] text-slate-400 font-mono">Rp0.2: {currentAlloy.yieldStrengthRp02} MPa</span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">{isFa ? 'مدول برشی (G) و الاستیسیته (E):' : 'Moduli (G & E):'}</span>
          <div className="text-sm font-bold text-cyan-300 font-mono">G: {currentAlloy.shearModulusG} MPa</div>
          <span className="text-[11px] text-slate-400 font-mono">E: {currentAlloy.elasticModulusE} MPa</span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">{isFa ? 'کاربرد اصلی در خودروسازی:' : 'OEM Application:'}</span>
          <p className="text-[11px] text-slate-300 leading-tight">{currentAlloy.typicalUse}</p>
        </div>
      </div>

      {/* Interactive Process Simulator Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-2">
            <span>{isFa ? 'شدت آلمن شات‌پینینگ (Almen A):' : 'Almen Intensity:'}</span>
            <span className="font-bold text-indigo-400 font-mono">{almenIntensity.toFixed(2)} mmA</span>
          </div>
          <input
            type="range"
            min="0.20"
            max="0.48"
            step="0.01"
            value={almenIntensity}
            onChange={(e) => setAlmenIntensity(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0.20A (استاندارد)</span>
            <span>0.48A (شدید)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-2">
            <span>{isFa ? 'پوشش سطح شات‌پینینگ (Coverage):' : 'Shot Coverage:'}</span>
            <span className="font-bold text-indigo-400 font-mono">{shotPeeningCoverage}%</span>
          </div>
          <input
            type="range"
            min="100"
            max="300"
            step="10"
            value={shotPeeningCoverage}
            onChange={(e) => setShotPeeningCoverage(parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>100% (تک‌پاس)</span>
            <span>300% (۳ برابر پوشش)</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-2">
            <span>{isFa ? 'دمای کوره تمپرینگ مداوم:' : 'Tempering Temp:'}</span>
            <span className="font-bold text-amber-400 font-mono">{temperingTemp}°C</span>
          </div>
          <input
            type="range"
            min="400"
            max="480"
            step="5"
            value={temperingTemp}
            onChange={(e) => setTemperingTemp(parseInt(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>400°C (سختی بالاتر)</span>
            <span>480°C (انعطاف بالاتر)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center space-y-1">
          <div className="text-[11px] text-slate-400">{isFa ? 'سختی مارتنزیت برگشت‌داده‌شده:' : 'Tempered Hardness:'}</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{calculatedHardnessHrc} HRC</div>
          <div className="text-[10px] text-indigo-300">
            {isFa ? `افزایش عمر خستگی: +${fatigueLimitEnhancementPercent}٪` : `Fatigue Boost: +${fatigueLimitEnhancementPercent}%`}
          </div>
        </div>
      </div>

      {/* Two Deep Metallurgy Charts: Goodman Envelope & Residual Stress XRD Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Goodman Fatigue Diagram */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>{isFa ? 'دیاگرام حد خستگی پیچشی گودمن (DIN EN 13906-1 Goodman Diagram)' : 'Goodman Torsional Fatigue Envelope'}</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  محدوده مجاز دامنه تنش برشی (τ_a) بر حسب تنش میانگین (τ_m) در ۱۰ میلیون سیکل
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                N &gt; 10⁷ Cycles
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={goodmanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="tau_m" stroke="#64748b" fontSize={10} unit=" MPa" />
                  <YAxis stroke="#64748b" fontSize={10} unit=" MPa" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="tau_a_peened" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} name="شات‌پینینگ‌شده (Shot Peened)" />
                  <Line type="monotone" dataKey="tau_a_unpeened" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="بدون شات‌پینینگ (As Quenched & Tempered)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between mt-3">
            <span className="text-slate-400">{isFa ? 'اثر شات‌پینینگ گرم/سرد بر گودمن:' : 'Shot Peening Benefit:'}</span>
            <span className="text-indigo-400 font-bold font-mono">
              {isFa ? 'افزایش ۳۱ درصدی دامنه تنش مجاز و جلوگیری از خستگی ناشی از شیار' : '+31% higher allowable cyclic stress amplitude'}
            </span>
          </div>
        </div>

        {/* Residual Compressive Stress Depth Profile */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'پروفیل عمقی تنش فشاری پسماند (XRD)' : 'Residual Stress Depth Profile'}</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  عمق زیر سطح مفتول (µm) در برابر تنش فشاری (MPa-)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                قله تنش: {peakCompressiveStressMpa}- MPa
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={residualStressProfile} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="depthMicrons" stroke="#64748b" fontSize={10} unit=" µm" />
                  <YAxis stroke="#64748b" fontSize={10} unit=" MPa" />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Zero Stress', fill: '#ef4444', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="stressMpa" stroke="#06b6d4" fillOpacity={1} fill="url(#stressGrad)" strokeWidth={2} name="تنش پسماند (MPa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 mt-3">
            {isFa 
              ? 'تنش فشاری زیرسطحی عمیق (تا عمق ۳۵۰ میکرومتر) مانع رشد میکروترک‌های سطحی در شرایط نوسانی تعلیق خودرو می‌شود.'
              : 'Deep compressive layer (down to 350 µm) arrests surface micro-cracks under rough road vibrations.'}
          </div>
        </div>
      </div>
    </div>
  );
};
