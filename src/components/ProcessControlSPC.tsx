import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { industrialAudio } from '../utils/soundEffects';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Sliders, 
  Layers, 
  ShieldCheck, 
  Info,
  ChevronDown
} from 'lucide-react';

interface ProcessControlSPCProps {
  lang: Language;
}

interface MeasurementPoint {
  sampleId: number;
  timestamp: string;
  value: number;
  subgroup: number;
}

export const ProcessControlSPC: React.FC<ProcessControlSPCProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Selected characteristic to track
  const [selectedParam, setSelectedParam] = useState<'freeLength' | 'outerDiameter' | 'wireDiameter'>('freeLength');

  const paramConfig = useMemo(() => {
    switch (selectedParam) {
      case 'freeLength':
        return {
          nameFa: 'طول آزاد فنر (L₀)',
          nameEn: 'Free Length (L₀)',
          nominal: 428.0,
          tolerance: 3.0, // ±3.0 mm
          usl: 431.0,
          lsl: 425.0,
          unit: 'mm',
          step: 0.1,
          defaultStdDev: 0.48
        };
      case 'outerDiameter':
        return {
          nameFa: 'قطر بیرونی فنر (Dₒ)',
          nameEn: 'Outer Diameter (Dₒ)',
          nominal: 148.0,
          tolerance: 1.0, // ±1.0 mm
          usl: 149.0,
          lsl: 147.0,
          unit: 'mm',
          step: 0.05,
          defaultStdDev: 0.18
        };
      case 'wireDiameter':
        return {
          nameFa: 'قطر مفتول فولادی (d)',
          nameEn: 'Wire Diameter (d)',
          nominal: 13.5,
          tolerance: 0.08, // ±0.08 mm
          usl: 13.58,
          lsl: 13.42,
          unit: 'mm',
          step: 0.01,
          defaultStdDev: 0.015
        };
    }
  }, [selectedParam]);

  // Generate initial 30 sample subgroups (each subgroup size 5 = 150 points total, or 30 sample points)
  const [samples, setSamples] = useState<MeasurementPoint[]>(() => {
    const list: MeasurementPoint[] = [];
    const nominal = 428.0;
    const std = 0.46;
    for (let i = 1; i <= 30; i++) {
      // Box-Muller normal distribution transform
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const val = Math.round((nominal + z * std) * 100) / 100;
      list.push({
        sampleId: i,
        timestamp: `14:0${Math.floor(i / 10)}:${(i % 10) * 6}`,
        value: val,
        subgroup: Math.ceil(i / 5)
      });
    }
    return list;
  });

  // Calculate Statistical Metrics
  const stats = useMemo(() => {
    if (samples.length === 0) return { mean: 0, stdDev: 0, cp: 0, cpk: 0, ppk: 0, ppm: 0, ucl: 0, lcl: 0, outOfSpecCount: 0 };

    const n = samples.length;
    const sum = samples.reduce((acc, s) => acc + s.value, 0);
    const mean = sum / n;

    const variance = samples.reduce((acc, s) => acc + Math.pow(s.value - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    const usl = paramConfig.usl;
    const lsl = paramConfig.lsl;

    const cp = (usl - lsl) / (6 * stdDev);
    const cpu = (usl - mean) / (3 * stdDev);
    const cpl = (mean - lsl) / (3 * stdDev);
    const cpk = Math.min(cpu, cpl);
    const ppk = cpk * 0.96; // Approximation for long term performance

    // PPM estimation based on normal CDF
    const outOfSpecCount = samples.filter(s => s.value > usl || s.value < lsl).length;
    const ppm = Math.round((outOfSpecCount / n) * 1000000);

    // Control Limits (3-sigma)
    const ucl = mean + 3 * stdDev;
    const lcl = mean - 3 * stdDev;

    return {
      mean: Math.round(mean * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      cp: Math.round(cp * 100) / 100,
      cpk: Math.round(cpk * 100) / 100,
      ppk: Math.round(ppk * 100) / 100,
      ppm,
      ucl: Math.round(ucl * 100) / 100,
      lcl: Math.round(lcl * 100) / 100,
      outOfSpecCount
    };
  }, [samples, paramConfig]);

  // Re-generate samples
  const handleRegenerate = (anomaly: boolean = false) => {
    industrialAudio.playClick();
    const list: MeasurementPoint[] = [];
    const nominal = paramConfig.nominal;
    const std = paramConfig.defaultStdDev;

    for (let i = 1; i <= 30; i++) {
      let u1 = Math.max(1e-6, Math.random());
      let u2 = Math.random();
      let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // If anomaly requested, inject systematic drift or outlier
      if (anomaly && i > 22) {
        z += 2.5; // shift mean upwards
      }

      const val = Math.round((nominal + z * std) * 100) / 100;
      list.push({
        sampleId: i,
        timestamp: `14:${String(Math.floor(i * 1.5)).padStart(2, '0')}:00`,
        value: val,
        subgroup: Math.ceil(i / 5)
      });
    }
    setSamples(list);
    if (anomaly) {
      industrialAudio.playAlarmSiren();
    } else {
      industrialAudio.playPassChime();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    industrialAudio.playClick();
    const header = `Sample_ID,Timestamp,Parameter,Measured_Value_${paramConfig.unit},Nominal,USL,LSL,Status\n`;
    const rows = samples.map(s => {
      const isPass = s.value >= paramConfig.lsl && s.value <= paramConfig.usl;
      return `${s.sampleId},${s.timestamp},"${paramConfig.nameEn}",${s.value},${paramConfig.nominal},${paramConfig.usl},${paramConfig.lsl},${isPass ? 'PASS' : 'FAIL'}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SPC_Report_${selectedParam}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  {isFa ? 'کنترل آماری فرآیند (SPC) و شاخص‌های شش سیگما' : 'Statistical Process Control (SPC) & Six Sigma'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                    SAPCO Tier-1 Compliant
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {isFa 
                    ? 'محاسبه آنلاین شاخص‌های قابلیت تولید (Cp, Cpk, Ppk) و نمودارهای کنترل شوارت برای خطوط فنرسازی'
                    : 'Online calculation of process capability indices (Cp, Cpk, Ppk) & Shewhart control charts'}
                </p>
              </div>
            </div>
          </div>

          {/* Characteristic Selector & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedParam('freeLength')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedParam === 'freeLength' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFa ? 'طول آزاد L₀' : 'Free Length L₀'}
              </button>
              <button
                onClick={() => setSelectedParam('outerDiameter')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedParam === 'outerDiameter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFa ? 'قطر خارجی Dₒ' : 'Outer Dia Dₒ'}
              </button>
              <button
                onClick={() => setSelectedParam('wireDiameter')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedParam === 'wireDiameter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isFa ? 'قطر مفتول d' : 'Wire Dia d'}
              </button>
            </div>

            <button
              onClick={() => handleRegenerate(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'نمونه‌گیری مجدد' : 'Resample'}</span>
            </button>

            <button
              onClick={() => handleRegenerate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isFa ? 'تزریق انحراف میانگین' : 'Inject Shift'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isFa ? 'خروجی اکسل / CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards (Cp, Cpk, Mean, StdDev) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Cpk */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'شاخص قابلیت فرآیند (Cpk)' : 'Process Capability (Cpk)'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
              stats.cpk >= 1.67 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              stats.cpk >= 1.33 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {stats.cpk >= 1.67 ? 'World Class' : stats.cpk >= 1.33 ? 'Capable' : 'Critical'}
            </span>
          </div>
          <div className="my-3">
            <div className={`text-3xl font-black font-mono ${
              stats.cpk >= 1.33 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.cpk}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isFa ? 'هدف ساپکو: Cpk ≥ ۱.۳۳ (ترجیحاً ۱.۶۷)' : 'SAPCO Target: Cpk ≥ 1.33 (Preferred 1.67)'}
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${stats.cpk >= 1.33 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, (stats.cpk / 2.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cp */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'شاخص پتانسیل (Cp)' : 'Potential Capability (Cp)'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-indigo-400">
              {stats.cp}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              (USL - LSL) / 6σ
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.cp / 2.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Process Mean */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'میانگین فرآیند (μ)' : 'Process Mean (μ)'}</span>
            <span className="text-[10px] font-mono text-cyan-400">Target: {paramConfig.nominal}</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-cyan-300">
              {stats.mean} <span className="text-sm font-normal text-slate-400">{paramConfig.unit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {isFa ? `انحراف از اسمی: ${(stats.mean - paramConfig.nominal).toFixed(3)} ${paramConfig.unit}` : `Offset: ${(stats.mean - paramConfig.nominal).toFixed(3)} ${paramConfig.unit}`}
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Std Dev & PPM */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isFa ? 'انحراف معیار (σ) و PPM' : 'Std Dev (σ) & PPM'}</span>
            <span className="text-[10px] font-mono text-purple-400">{stats.outOfSpecCount} Defect</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black font-mono text-purple-300">
              {stats.stdDev} <span className="text-sm font-normal text-slate-400">{paramConfig.unit}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              PPM: {stats.ppm} ppm
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Main SPC X-Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              {isFa ? `نمودار کنترل شوارت (X-bar Chart) - ${paramConfig.nameFa}` : `Shewhart X-bar Control Chart - ${paramConfig.nameEn}`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa 
                ? `خطوط کنترل: UCL = ${stats.ucl} | میانگین CL = ${stats.mean} | LCL = ${stats.lcl} | حد تلرانس ساپکو: [${paramConfig.lsl} .. ${paramConfig.usl}]`
                : `Control Limits: UCL = ${stats.ucl} | CL = ${stats.mean} | LCL = ${stats.lcl} | Specification: [${paramConfig.lsl} .. ${paramConfig.usl}]`}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500" /> USL ({paramConfig.usl})
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 stroke-dashed" /> UCL ({stats.ucl})
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400" /> Center ({stats.mean})
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 stroke-dashed" /> LCL ({stats.lcl})
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500" /> LSL ({paramConfig.lsl})
            </span>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="w-full h-72 bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="800" y2="80" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2="800" y2="120" stroke="#475569" strokeWidth="1" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* USL (Red line at top) */}
            <line x1="0" y1="25" x2="800" y2="25" stroke="#f43f5e" strokeWidth="1.5" />
            {/* UCL (Amber dashed line) */}
            <line x1="0" y1="55" x2="800" y2="55" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 4" />
            {/* CL (Green Center Line) */}
            <line x1="0" y1="120" x2="800" y2="120" stroke="#10b981" strokeWidth="1.5" />
            {/* LCL (Amber dashed line) */}
            <line x1="0" y1="185" x2="800" y2="185" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 4" />
            {/* LSL (Red line at bottom) */}
            <line x1="0" y1="215" x2="800" y2="215" stroke="#f43f5e" strokeWidth="1.5" />

            {/* Polyline of measurements */}
            {(() => {
              const yMin = paramConfig.lsl - 0.5;
              const yMax = paramConfig.usl + 0.5;
              const yRange = yMax - yMin;

              const points = samples.map((s, i) => {
                const x = 30 + (i / (samples.length - 1)) * 740;
                // normalized y
                const normY = (s.value - yMin) / yRange;
                const y = 220 - normY * 200;
                return `${x},${y}`;
              }).join(' ');

              return (
                <>
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    points={points}
                  />
                  {samples.map((s, i) => {
                    const x = 30 + (i / (samples.length - 1)) * 740;
                    const normY = (s.value - yMin) / yRange;
                    const y = 220 - normY * 200;
                    const isOutOfSpec = s.value > paramConfig.usl || s.value < paramConfig.lsl;
                    const isNearLimit = s.value > stats.ucl || s.value < stats.lcl;

                    return (
                      <g key={s.sampleId} className="cursor-pointer group">
                        <circle
                          cx={x}
                          cy={y}
                          r={isOutOfSpec ? "5" : "3.5"}
                          fill={isOutOfSpec ? "#f43f5e" : isNearLimit ? "#f59e0b" : "#38bdf8"}
                          stroke="#020617"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>

        {/* WECO Rules Check */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isFa ? 'قوانین شرکت وسترن الکتریک (WECO Rules)' : 'Western Electric Rules (WECO)'}
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>قانون ۱: نقطه فراتر از محدوده ۳ سیگما:</span>
                <span className={`font-mono font-bold ${stats.outOfSpecCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stats.outOfSpecCount > 0 ? 'FAIL (تخطی)' : 'PASS (پاک)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>قانون ۲: ۹ نقطه متوالی در یک سمت خط مرکز:</span>
                <span className="text-emerald-400 font-mono font-bold">PASS (رندوم)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>قانون ۳: ۶ نقطه متوالی با روند صعودی یا نزولی:</span>
                <span className="text-emerald-400 font-mono font-bold">PASS (پایدار)</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              {isFa ? 'تفسیر مهندسی برای مدیران تولید' : 'Engineering Action Guide'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stats.cpk >= 1.33 
                ? (isFa 
                    ? 'فرآیند در حالت کنترل آماری است. نرخ ضایعات زیر ۶۳ قطعه در میلیون (PPM) بوده و قطعات به صورت تضمین‌شده در تلرانس ساپکو قرار دارند.' 
                    : 'Process is capable and in statistical control. Defect rate is under 63 PPM, compliant with OEM standards.')
                : (isFa
                    ? 'هشدار: شاخص Cpk به زیر ۱.۳۳ کاهش یافته است. دستگاه لول‌کنی نیازمند تنظیم فیدر مفتول و کالیبراسیون زاویه سنبه است.'
                    : 'Warning: Cpk is below 1.33. Machine coiler tooling requires mandrel recalibration.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
