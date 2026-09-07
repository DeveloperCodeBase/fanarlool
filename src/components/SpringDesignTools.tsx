import React, { useState } from 'react';
import { Language } from '../types';
import { ALLOY_MATERIALS, SPRING_CATALOG } from '../mockData';
import { 
  Calculator, 
  Layers, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Sliders, 
  Zap, 
  Compass, 
  Sparkles, 
  TrendingUp, 
  FileText,
  RotateCcw,
  CheckCircle2,
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
  ReferenceDot,
  AreaChart,
  Area
} from 'recharts';

interface SpringDesignToolsProps {
  lang: Language;
}

export const SpringDesignTools: React.FC<SpringDesignToolsProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Input States
  const [wireDiameterD, setWireDiameterD] = useState<number>(12.25); // mm (d)
  const [outerDiameterDo, setOuterDiameterDo] = useState<number>(144.0); // mm (Do)
  const [freeLengthL0, setFreeLengthL0] = useState<number>(412.0); // mm (L0)
  const [activeCoilsNa, setActiveCoilsNa] = useState<number>(6.5); // (na)
  const [totalCoilsNt, setTotalCoilsNt] = useState<number>(8.0); // (nt)
  const [selectedAlloyCode, setSelectedAlloyCode] = useState<string>('54SiCr6');
  const [workingLoadF2, setWorkingLoadF2] = useState<number>(5500); // N (F2)

  // Current Alloy Properties
  const currentAlloy = ALLOY_MATERIALS.find(a => a.code === selectedAlloyCode) || ALLOY_MATERIALS[0];
  const G = currentAlloy.shearModulusG; // MPa (N/mm²)
  const Rm = currentAlloy.tensileStrengthRm; // MPa

  // DIN EN 13906-1 Mechanical Calculations
  const meanDiameterD = outerDiameterDo - wireDiameterD; // D = Do - d
  const innerDiameterDi = outerDiameterDo - 2 * wireDiameterD; // Di = Do - 2d
  const springIndexC = meanDiameterD / wireDiameterD; // C = D / d

  // Bergsträsser / Wahl Stress Correction Factor (kw)
  const wahlFactorKw = (4 * springIndexC - 1) / (4 * springIndexC - 4) + (0.615 / springIndexC);

  // Spring Rate / Stiffness (k in N/mm)
  // k = (G * d^4) / (8 * D^3 * na)
  const springRateK = (G * Math.pow(wireDiameterD, 4)) / (8 * Math.pow(meanDiameterD, 3) * activeCoilsNa);

  // Solid Length / Block Height (Hs in mm)
  const solidLengthHs = totalCoilsNt * wireDiameterD;

  // Maximum Deflection to Solid Block (sc in mm)
  const deflectionToBlockSc = Math.max(0, freeLengthL0 - solidLengthHs);

  // Solid Test Force (Fc in N)
  const solidForceFc = springRateK * deflectionToBlockSc;

  // Torsional Shear Stress at Solid Length (tau_c in MPa)
  // tau_c = kw * (8 * Fc * D) / (pi * d^3)
  const stressAtBlockTauC = wahlFactorKw * (8 * solidForceFc * meanDiameterD) / (Math.PI * Math.pow(wireDiameterD, 3));

  // Permissible Torsional Stress (tau_allow = 0.56 * Rm for shot-peened high-grade spring steel)
  const permissibleStressTau = 0.56 * Rm;

  // Safety Factor against Plastic Setting (نشست دائم)
  const safetyFactorSetting = permissibleStressTau / stressAtBlockTauC;

  // Natural Surge Frequency (f0 in Hz) to prevent surge resonance
  // f0 = (3560 * d) / (na * D^2) * sqrt(G / rho) -> approx for steel: (d / (na * D^2)) * 3.56e5
  const naturalFrequencyHz = (356000 * wireDiameterD) / (activeCoilsNa * Math.pow(meanDiameterD, 2));

  // Buckling Slenderness Ratio (L0 / D)
  const slendernessRatio = freeLengthL0 / meanDiameterD;
  const isBucklingRisk = slendernessRatio > 3.7;

  // Deflection at Working Load F2
  const deflectionAtF2 = workingLoadF2 / springRateK;
  const loadedLengthL2 = freeLengthL0 - deflectionAtF2;
  const stressAtF2 = wahlFactorKw * (8 * workingLoadF2 * meanDiameterD) / (Math.PI * Math.pow(wireDiameterD, 3));

  // Load-Deflection Curve Points (0 to sc)
  const loadDeflectionPoints = [
    { deflectionMm: 0, loadN: 0, lengthMm: freeLengthL0, label: 'L0' },
    { deflectionMm: Number((deflectionToBlockSc * 0.25).toFixed(1)), loadN: Number((springRateK * deflectionToBlockSc * 0.25).toFixed(0)), lengthMm: Number((freeLengthL0 - deflectionToBlockSc * 0.25).toFixed(1)), label: 'F1' },
    { deflectionMm: Number(deflectionAtF2.toFixed(1)), loadN: Number(workingLoadF2.toFixed(0)), lengthMm: Number(loadedLengthL2.toFixed(1)), label: 'F2 (Working)' },
    { deflectionMm: Number((deflectionToBlockSc * 0.75).toFixed(1)), loadN: Number((springRateK * deflectionToBlockSc * 0.75).toFixed(0)), lengthMm: Number((freeLengthL0 - deflectionToBlockSc * 0.75).toFixed(1)), label: 'F_test' },
    { deflectionMm: Number(deflectionToBlockSc.toFixed(1)), loadN: Number(solidForceFc.toFixed(0)), lengthMm: Number(solidLengthHs.toFixed(1)), label: 'Fc (Solid)' },
  ];

  const handleLoadPreset = (modelId: string) => {
    const found = SPRING_CATALOG.find(m => m.id === modelId);
    if (found) {
      setWireDiameterD(found.wireDiameter_d);
      setOuterDiameterDo(found.outerDiameter_Do);
      setFreeLengthL0(found.freeLength_L0);
      setActiveCoilsNa(found.activeCoils_na);
      setTotalCoilsNt(found.totalCoils_nt);
    }
  };

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>{isFa ? 'مجموعه ابزارهای حرفه‌ای محاسبات و طراحی مهندسی فنر' : 'Advanced DIN EN 13906-1 Spring Engineering CAD/CAE Suite'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'محاسبه‌گر پیشرفته ابعادی، تنش پیچشی وال و فرکانس تشدید طبیعی' : 'Coil Spring Parameter Calculator & Natural Frequency Surge Analysis'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'محاسبه دقیق ثابت فنر (k)، ضریب تصحیح تنش وال (kw)، تنش در وضعیت بسته، خطر کمانش جانبی، فرکانس ارتعاش تشدید و نمودار بار-تغییر مکان بر اساس استانداردهای بین‌المللی DIN EN 13906-1 و DIN 2095.'
              : 'Full analytical verification of spring rate, Wahl torsional stress factor, solid height, surge frequency, and buckling risk.'}
          </p>
        </div>

        {/* Quick OEM Preset Loader */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">{isFa ? 'لود نمونه استاندارد:' : 'OEM Presets:'}</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {SPRING_CATALOG.slice(0, 3).map(m => (
              <button
                key={m.id}
                onClick={() => handleLoadPreset(m.id)}
                className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800"
              >
                {m.modelName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Engineering Inputs & Live Output Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: Interactive Parameter Adjusters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? '۱. پارامترهای هندسی و آلیاژ فنر' : '1. Geometric & Material Inputs'}</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">DIN EN 13906-1</span>
            </div>

            {/* Alloy Selection */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">{isFa ? 'انتخاب گرید آلیاژ فولاد فنر:' : 'Spring Steel Alloy:'}</label>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {ALLOY_MATERIALS.map(alloy => (
                  <button
                    key={alloy.code}
                    onClick={() => setSelectedAlloyCode(alloy.code)}
                    className={`py-1.5 px-2 rounded-lg text-center border transition-colors ${
                      selectedAlloyCode === alloy.code
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-600 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {alloy.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders with direct numeric display */}
            <div className="space-y-3.5 pt-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isFa ? 'قطر مفتول فنر (Wire Diameter d):' : 'Wire Diameter d:'}</span>
                  <span className="font-bold text-cyan-400">{wireDiameterD.toFixed(2)} mm</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="18.0"
                  step="0.05"
                  value={wireDiameterD}
                  onChange={(e) => setWireDiameterD(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isFa ? 'قطر خارجی فنر (Outer Diameter Do):' : 'Outer Diameter Do:'}</span>
                  <span className="font-bold text-cyan-400">{outerDiameterDo.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="80.0"
                  max="200.0"
                  step="0.5"
                  value={outerDiameterDo}
                  onChange={(e) => setOuterDiameterDo(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isFa ? 'طول آزاد فنر (Free Length L0):' : 'Free Length L0:'}</span>
                  <span className="font-bold text-cyan-400">{freeLengthL0.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="200.0"
                  max="600.0"
                  step="1.0"
                  value={freeLengthL0}
                  onChange={(e) => setFreeLengthL0(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>{isFa ? 'حلقه‌های مؤثر (na):' : 'Active Coils na:'}</span>
                    <span className="font-bold text-cyan-400">{activeCoilsNa.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="14.0"
                    step="0.25"
                    value={activeCoilsNa}
                    onChange={(e) => setActiveCoilsNa(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>{isFa ? 'کل حلقه‌ها (nt):' : 'Total Coils nt:'}</span>
                    <span className="font-bold text-cyan-400">{totalCoilsNt.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={activeCoilsNa + 1}
                    max="16.0"
                    step="0.25"
                    value={totalCoilsNt}
                    onChange={(e) => setTotalCoilsNt(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{isFa ? 'بار کاری تحت وزن خودرو (Working Load F2):' : 'Working Load F2:'}</span>
                  <span className="font-bold text-amber-400">{workingLoadF2.toFixed(0)} N</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="12000"
                  step="100"
                  value={workingLoadF2}
                  onChange={(e) => setWorkingLoadF2(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quick Warning & Engineering Feasibility Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isFa ? 'شاخص اندیس فنر (C = D/d):' : 'Spring Index C:'}</span>
              <span className={`font-bold ${springIndexC >= 4 && springIndexC <= 12 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {springIndexC.toFixed(2)} {springIndexC >= 4 && springIndexC <= 12 ? '(مجاز ۴-۱۲)' : '(غیربهینه)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isFa ? 'ریسک کمانش جانبی (Buckling):' : 'Buckling Risk (L0/D):'}</span>
              <span className={`font-bold ${isBucklingRisk ? 'text-rose-400 flex items-center gap-1' : 'text-emerald-400 flex items-center gap-1'}`}>
                {isBucklingRisk ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {slendernessRatio.toFixed(2)} ({isBucklingRisk ? 'نیازمند راهنمای داخلی' : 'پایدار'})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isFa ? 'ضریب اطمینان در برابر تسلیم:' : 'Yield Safety Margin:'}</span>
              <span className={`font-bold ${safetyFactorSetting >= 1.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                SF = {safetyFactorSetting.toFixed(2)} {safetyFactorSetting >= 1.05 ? '(مطلوب)' : '(لب مرز نشست)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Computed Parameters & Load-Deflection Curve */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Key Mechanical Performance Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{isFa ? 'ثابت فنر (k):' : 'Spring Rate (k):'}</span>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{springRateK.toFixed(2)}</div>
              <span className="text-[10px] text-slate-400">N/mm</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{isFa ? 'ضریب تصحیح وال (kw):' : 'Wahl Factor (kw):'}</span>
              <div className="text-lg font-bold text-indigo-400 mt-0.5">{wahlFactorKw.toFixed(3)}</div>
              <span className="text-[10px] text-slate-400">تمرکز تنش برشی</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{isFa ? 'فرکانس تشدید (f0):' : 'Surge Frequency:'}</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{naturalFrequencyHz.toFixed(1)}</div>
              <span className="text-[10px] text-slate-400">Hz (تشدید نوسانی)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{isFa ? 'طول بلوک فنر (Hs):' : 'Solid Height (Hs):'}</span>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{solidLengthHs.toFixed(1)}</div>
              <span className="text-[10px] text-slate-400">mm (حداکثر فشردگی)</span>
            </div>
          </div>

          {/* Load-Deflection Curve (F vs s) Chart */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'منحنی مشخصه بار - تغییر مکان (Load - Deflection Curve)' : 'Characteristic Load - Deflection Curve'}</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  رفتار الاستیک خطی تا حد فشردگی کامل بلوک (Solid Force Fc = {solidForceFc.toFixed(0)} N)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                k = {springRateK.toFixed(1)} N/mm
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loadDeflectionPoints} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="deflectionMm" stroke="#64748b" fontSize={10} unit=" mm" />
                  <YAxis stroke="#64748b" fontSize={10} unit=" N" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: any) => [`${value} N`, 'نیروی فنر']}
                    labelFormatter={(label) => `تغییر مکان: ${label} میلی‌متر`}
                  />
                  <ReferenceLine x={deflectionAtF2} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'F2 Working', fill: '#f59e0b', fontSize: 10 }} />
                  <Line type="monotone" dataKey="loadN" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">تنش در نقطه کاری (F2):</span>
                <span className="text-white font-bold">{stressAtF2.toFixed(1)} MPa</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">تنش در حالت بسته (Hs):</span>
                <span className={`font-bold ${stressAtBlockTauC <= permissibleStressTau ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stressAtBlockTauC.toFixed(1)} MPa
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Spring Surge Explanation Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white">
                {isFa ? 'تحلیل مهندسی پدیده سرج و تشدید فنر (Spring Surge Frequency):' : 'Spring Surge Resonance Analysis:'}
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {isFa 
                  ? `فرکانس طبیعی فنر ${naturalFrequencyHz.toFixed(1)} هرتز محاسبه شد. جهت جلوگیری از شکست ناشی از پدیده سرج و امواج طولی در دست‌اندازهای جاده، فرکانس ارتعاشات ورودی تعلیق خودرو باید حداقل ۳ برابر کمتر از این مقدار (زیر ${(naturalFrequencyHz / 3).toFixed(1)} Hz) بماند.`
                  : `Natural surge frequency is ${naturalFrequencyHz.toFixed(1)} Hz. Operating harmonic frequencies must remain below ${(naturalFrequencyHz / 3).toFixed(1)} Hz to avoid resonance failure.`}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
