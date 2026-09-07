import React, { useState } from 'react';
import { Language } from '../types';
import { 
  Layers, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Compass, 
  Maximize2,
  Sparkles,
  BarChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

interface Module2ProfilometryProps {
  lang: Language;
}

export const Module2Profilometry: React.FC<Module2ProfilometryProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Selected scanning angle
  const [scanRotationAngle, setScanRotationAngle] = useState<number>(120);
  const [selectedSensorModel, setSelectedSensorModel] = useState<string>('Keyence LJ-X8000');

  // Helical Pitch Spacing Profile per Coil Turn
  const pitchProfileData = [
    { coil: 'حلقه ۱ (کف)', nominalPitch: 14.0, measuredPitch: 14.1, minTol: 13.0, maxTol: 15.0 },
    { coil: 'حلقه ۲ (فعال)', nominalPitch: 52.0, measuredPitch: 51.8, minTol: 49.5, maxTol: 54.5 },
    { coil: 'حلقه ۳ (فعال)', nominalPitch: 58.0, measuredPitch: 58.4, minTol: 55.5, maxTol: 60.5 },
    { coil: 'حلقه ۴ (فعال)', nominalPitch: 58.0, measuredPitch: 57.9, minTol: 55.5, maxTol: 60.5 },
    { coil: 'حلقه ۵ (فعال)', nominalPitch: 54.0, measuredPitch: 53.6, minTol: 51.5, maxTol: 56.5 },
    { coil: 'حلقه ۶ (سر)', nominalPitch: 14.0, measuredPitch: 14.3, minTol: 13.0, maxTol: 15.0 },
  ];

  // 3D Laser Profile Geometric Tolerance Verification Checklist
  const geometricVerifications = [
    {
      paramFa: 'ارتفاع آزاد کل (Free Length - L0)',
      paramEn: 'Total Free Length (L0)',
      standardVal: '385.0 ± 4.0 mm',
      measuredVal: '385.3 mm',
      deviation: '+0.3 mm',
      toleranceRange: '381.0 ~ 389.0 mm',
      status: 'pass'
    },
    {
      paramFa: 'قطر خارجی ماکزیمم (Outer Diameter - Do)',
      paramEn: 'Max Outer Diameter (Do)',
      standardVal: '136.8 ± 1.2 mm',
      measuredVal: '136.9 mm',
      deviation: '+0.1 mm',
      toleranceRange: '135.6 ~ 138.0 mm',
      status: 'pass'
    },
    {
      paramFa: 'انحراف از گونیایی انتهای فنر (Squareness - e1)',
      paramEn: 'End Face Squareness (e1)',
      standardVal: '≤ 1.5 mm / 100mm',
      measuredVal: '0.85 mm',
      deviation: '0.65 mm Margin',
      toleranceRange: 'Max 1.50 mm',
      status: 'pass'
    },
    {
      paramFa: 'توزیع یکنواختی گام هلیکال (Pitch Variance)',
      paramEn: 'Helical Pitch Uniformity',
      standardVal: '± 2.5 mm',
      measuredVal: '± 0.9 mm',
      deviation: 'High Precision',
      toleranceRange: 'Peak to valley < 2.5mm',
      status: 'pass'
    },
    {
      paramFa: 'موازی‌بودن دو کف سنگ‌زده (End Parallelism - e2)',
      paramEn: 'End Ground Parallelism (e2)',
      standardVal: '≤ 2.0 mm',
      measuredVal: '1.15 mm',
      deviation: 'Within Spec',
      toleranceRange: 'Max 2.0 mm',
      status: 'pass'
    },
    {
      paramFa: 'زاویه پرداخت کف سنگ‌خورده (Grinding Angle - α)',
      paramEn: 'Ground End Arc Angle (α)',
      standardVal: '270° ± 15°',
      measuredVal: '273.5°',
      deviation: '+3.5°',
      toleranceRange: '255° ~ 285°',
      status: 'pass'
    }
  ];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۲ پروپوزال: پروفیل‌سنجی ۳بعدی و لیزری' : 'Module 2: 3D Laser Profilometry & Helical Scanning'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'سامانه اندازه‌گیری سه‌بعدی پروفیل فنر و نقشه ارتفاع' : '3D Laser Height-Map & Complex Geometry Profiler'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'استخراج مشخصات هندسی پیچیده شامل گام‌های متغیر حلقه، گونیایی انتها و زاویه پرداخت سنگ‌زنی با استفاده از پروفیل‌سنج لیزری Keyence LJ Series / LMI Gocator طبق استاندارد DIN EN 13906-1.'
              : 'Laser triangulation line scanning for 3D helical pitch extraction, end face squareness, and parallelism inspection.'}
          </p>
        </div>

        {/* Sensor Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <Scan className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-slate-300">{selectedSensorModel}</span>
        </div>
      </div>

      {/* Main Laser Profiler Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Laser Height Map & Triangulation Visualization */}
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-xs font-bold font-mono text-white">
                  {isFa ? 'اسکن مقطع لیزری ۳بعدی (Laser Triangulation Scan)' : '3D Laser Triangulation Height Map'}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                رزولوشن Z: ۰.۵ میکرون
              </span>
            </div>

            {/* Height Map Visual Simulation Box */}
            <div className="relative w-full h-72 bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              {/* Laser Projector Beam */}
              <div className="absolute top-2 inset-x-8 h-0.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />

              {/* 3D Wireframe Helical Contour Visualization */}
              <svg className="w-full h-full" viewBox="0 0 300 200">
                <defs>
                  <linearGradient id="laserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {/* Laser scan lines */}
                {Array.from({ length: 18 }).map((_, i) => {
                  const y = 20 + i * 9;
                  const curve = Math.sin((i / 18) * Math.PI * 3 + (scanRotationAngle * Math.PI) / 180) * 45;
                  return (
                    <path
                      key={i}
                      d={`M 30 ${y} Q ${150 + curve} ${y + 6}, 270 ${y}`}
                      fill="none"
                      stroke={i % 3 === 0 ? '#818cf8' : '#334155'}
                      strokeWidth={i % 3 === 0 ? '1.5' : '0.8'}
                      strokeOpacity={0.8}
                    />
                  );
                })}

                {/* Ground end angle inspection arc */}
                <circle cx="150" cy="30" r="18" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                <text x="175" y="32" fill="#f59e0b" fontSize="9" fontFamily="monospace">α = 273.5°</text>

                {/* Squareness deviation line */}
                <line x1="265" y1="20" x2="265" y2="180" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2,2" />
                <text x="220" y="105" fill="#f43f5e" fontSize="9" fontFamily="monospace">e1 = 0.85mm</text>
              </svg>

              {/* Color scale bar for Height (Z-Depth) */}
              <div className="absolute right-3 top-6 bottom-6 w-3 rounded-full bg-gradient-to-t from-emerald-500 via-cyan-400 to-indigo-500 flex flex-col justify-between text-[8px] font-mono text-white px-0.5">
                <span>+Z</span>
                <span>0</span>
                <span>-Z</span>
              </div>
            </div>

            {/* Slider to Rotate Scan Angle */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span>{isFa ? 'زاویه دوران محور پروفیل فنر:' : 'Profile Rotation Angle (θ):'}</span>
                <span className="text-indigo-400 font-bold">{scanRotationAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={scanRotationAngle}
                onChange={(e) => setScanRotationAngle(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>تعداد نقاط ابر داده: <strong>۲۴,۵۰۰ نقطه</strong></span>
            <span className="text-emerald-400 font-bold">تطابق کامل با مدل CAD</span>
          </div>
        </div>

        {/* Helical Pitch Distribution Recharts Chart */}
        <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <BarChart className="w-4 h-4 text-indigo-400" />
                <span>{isFa ? 'پروفیل گام حلقه به حلقه (Pitch per Turn - mm)' : 'Pitch per Coil Turn (mm)'}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                اسکن لیزری vs مقدار نامی
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pitchProfileData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="coil" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[10, 65]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="nominalPitch" stroke="#64748b" strokeDasharray="4 4" name="مقدار نامی" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="measuredPitch" stroke="#818cf8" strokeWidth={2.5} name="اندازه‌گیری لیزری" dot={{ r: 4, fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">{isFa ? 'وضعیت گام هلیکال:' : 'Pitch Uniformity:'}</span>
            <span className="text-emerald-400 font-mono font-bold">{isFa ? 'یکنواخت (انحراف ماکزیمم ۰.۴ mm)' : 'Uniform (Max drift 0.4mm)'}</span>
          </div>
        </div>
      </div>

      {/* Part 2: DIN EN 13906-1 Geometric Verification Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>{isFa ? 'جدول انطباق تلرانس‌های هندسی سه‌بعدی (استاندارد DIN EN 13906-1)' : 'Geometric Tolerance Compliance Matrix'}</span>
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-700">
            {isFa ? '۶ از ۶ پارامتر در تلرانس مجاز' : '6/6 In Tolerance'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-right">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'مشخصه هندسی' : 'Geometric Characteristic'}</th>
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'معیار استاندارد' : 'Standard Spec'}</th>
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'مقدار لیزری' : 'Laser Measured'}</th>
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'انحراف' : 'Deviation'}</th>
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'محدوده مجاز' : 'Allowed Range'}</th>
                <th className="py-2.5 px-3 font-semibold">{isFa ? 'نتیجه' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {geometricVerifications.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans font-medium text-white">{isFa ? item.paramFa : item.paramEn}</td>
                  <td className="py-3 px-3 text-slate-300">{item.standardVal}</td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{item.measuredVal}</td>
                  <td className="py-3 px-3 text-slate-400">{item.deviation}</td>
                  <td className="py-3 px-3 text-slate-500">{item.toleranceRange}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
