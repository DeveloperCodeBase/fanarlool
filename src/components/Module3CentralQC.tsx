import React, { useState } from 'react';
import { Language } from '../types';
import { AI_MODELS_REGISTRY, PROVINCIAL_PLANTS } from '../mockData';
import { 
  Network, 
  Cpu, 
  BarChart3, 
  CheckCircle2, 
  ArrowUpRight, 
  UploadCloud, 
  Sliders, 
  Sparkles,
  ShieldCheck,
  Search,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  ReferenceLine
} from 'recharts';

interface Module3CentralQCProps {
  lang: Language;
}

export const Module3CentralQC: React.FC<Module3CentralQCProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Active sub-tab in Module 3
  const [activeSubTab, setActiveSubTab] = useState<'benchmarking' | 'spc' | 'mlops'>('spc');
  const [selectedModelForDeploy, setSelectedModelForDeploy] = useState<string | null>(null);

  // SPC Gaussian Normal Distribution curve points for Free Length (L0)
  // Nominal = 385.0 mm, LSL = 381.0, USL = 389.0, Mean = 385.2, Sigma = 0.65 mm
  // Cp = (389 - 381) / (6 * 0.65) = 8 / 3.9 = 2.05
  // Cpk = min((389 - 385.2)/1.95, (385.2 - 381)/1.95) = min(1.94, 2.15) = 1.94
  const spcDistributionData = [
    { x: 382.0, count: 4, label: '-3σ' },
    { x: 382.6, count: 18, label: '-2.5σ' },
    { x: 383.2, count: 65, label: '-2σ' },
    { x: 383.8, count: 190, label: '-1.5σ' },
    { x: 384.4, count: 420, label: '-1σ' },
    { x: 385.0, count: 680, label: 'Nominal' },
    { x: 385.6, count: 590, label: '+1σ' },
    { x: 386.2, count: 310, label: '+1.5σ' },
    { x: 386.8, count: 110, label: '+2σ' },
    { x: 387.4, count: 28, label: '+2.5σ' },
    { x: 388.0, count: 6, label: '+3σ' },
  ];

  // X-bar Control Chart data across 12 consecutive sub-groups
  const xBarData = [
    { subgroup: 'SG-01', xBar: 385.1, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-02', xBar: 385.3, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-03', xBar: 384.9, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-04', xBar: 385.4, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-05', xBar: 385.2, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-06', xBar: 385.6, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-07', xBar: 385.1, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-08', xBar: 384.8, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-09', xBar: 385.3, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-10', xBar: 385.5, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-11', xBar: 385.2, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
    { subgroup: 'SG-12', xBar: 385.0, ucl: 387.2, lcl: 383.2, nominal: 385.0 },
  ];

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Network className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۳ پروپوزال: هاب مرکزی کیفیت استان سمنان' : 'Module 3: Central Smart QC Platform'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'پلتفرم مرکزی کنترل کیفیت هوشمند صنایع استان سمنان' : 'Central Provincial Quality Intelligence & MLOps Platform'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'مرکز مدیریت متمرکز مدل‌های هوش مصنوعی (MLOps)، پایگاه داده یکپارچه تضمین کیفیت، کنترل فرایند آماری (SPC) و بنچ‌مارکینگ بین کارخانجات استان.'
              : 'Enterprise cloud registry for deep-learning models, cross-plant provincial quality benchmarking, and automated Statistical Process Control (Cp / Cpk).'}
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('spc')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'spc' ? 'bg-blue-950 text-blue-300 border border-blue-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'نمودارهای آماری (SPC)' : 'SPC & Capability'}
          </button>
          <button
            onClick={() => setActiveSubTab('benchmarking')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'benchmarking' ? 'bg-blue-950 text-blue-300 border border-blue-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'مقایسه صنایع سمنان' : 'Provincial Benchmarking'}
          </button>
          <button
            onClick={() => setActiveSubTab('mlops')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeSubTab === 'mlops' ? 'bg-blue-950 text-blue-300 border border-blue-600 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isFa ? 'مخزن مدل‌های AI (MLOps)' : 'MLOps Registry'}
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: SPC (Statistical Process Control) */}
      {activeSubTab === 'spc' && (
        <div className="space-y-6">
          {/* SPC Key Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">{isFa ? 'شاخص توانمندی بالقوه فرایند (Cp):' : 'Potential Capability (Cp):'}</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">2.05</div>
              <span className="text-[10px] text-slate-500 font-mono">شش سیگما (Six Sigma Level)</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">{isFa ? 'شاخص کارایی واقعی فرایند (Cpk):' : 'Actual Capability (Cpk):'}</div>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">1.94</div>
              <span className="text-[10px] text-slate-500 font-mono">بسیار عالی ({'>'} 1.67)</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">{isFa ? 'میانگین ابعادی (Mean μ):' : 'Distribution Mean (μ):'}</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">385.2 mm</div>
              <span className="text-[10px] text-slate-500 font-mono">انحراف از نامی: +۰.۲ mm</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">{isFa ? 'انحراف معیار (Sigma σ):' : 'Standard Dev (σ):'}</div>
              <div className="text-2xl font-bold font-mono text-purple-300 mt-1">0.65 mm</div>
              <span className="text-[10px] text-slate-500 font-mono">پراکندگی بسیار اندک</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Bell Curve (Normal Distribution) */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span>{isFa ? 'توزیع نرمال فرایند ارتفاع آزاد (Gaussian Curve)' : 'Process Normal Distribution (L0)'}</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  LSL: 381.0 ~ USL: 389.0
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spcDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="تعداد قطعات" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* X-Bar Control Chart */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? 'نمودار کنترل میانگین زیرگروه‌ها (X-Bar Chart)' : 'Subgroup Mean Control Chart (X-Bar)'}</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  فرایند تحت کنترل آماری
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={xBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="subgroup" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[382.5, 388.0]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <ReferenceLine y={387.2} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'UCL: 387.2', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={383.2} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LCL: 383.2', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={385.0} stroke="#10b981" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="xBar" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: '#38bdf8' }} name="میانگین زیرگروه" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Provincial Benchmarking (Semnan) */}
      {activeSubTab === 'benchmarking' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                {isFa ? 'رتبه‌بندی کیفی و بهره‌وری صنایع متصل به هاب سمنان' : 'Semnan Province Connected Industrial Plants'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa ? 'مقایسه شاخص‌های OEE، ضایعات و مصرف ویژه انرژی به ازای هر تن تولید' : 'Benchmarking OEE, scrap rates, and specific energy'}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-700">
              ۴ کارخانه متصل
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVINCIAL_PLANTS.map((plant) => (
              <div 
                key={plant.plantId}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{isFa ? plant.plantNameFa : plant.plantNameEn}</h4>
                    <span className="text-xs text-slate-400">{plant.locationFa}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {plant.connectivityStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div className="p-2 rounded bg-slate-900">
                    <div className="text-[10px] text-slate-500">OEE میانگین:</div>
                    <div className="text-cyan-300 font-bold">{plant.averageOee}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900">
                    <div className="text-[10px] text-slate-500">نرخ ضایعات:</div>
                    <div className={plant.scrapRate < 3.0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{plant.scrapRate}%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900">
                    <div className="text-[10px] text-slate-500">انرژی/تن:</div>
                    <div className="text-yellow-300 font-bold">{plant.energyPerTon} kWh</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: MLOps Model Registry */}
      {activeSubTab === 'mlops' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>{isFa ? 'مخزن متمرکز مدل‌های هوش مصنوعی (MLOps Registry)' : 'Central AI Models Registry'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'نسخه‌بندی، آموزش مجدد و توزیع خودکار وزن شبکه‌های یادگیری عمیق به کامپیوترهای صنعتی خطوط' 
                  : 'Versioning, evaluation, and OTA edge model deployment'}
              </p>
            </div>
            <button className="px-3.5 py-2 rounded-xl bg-blue-950 text-blue-300 border border-blue-600 text-xs font-mono font-bold flex items-center gap-2 hover:bg-blue-900 transition-colors">
              <UploadCloud className="w-4 h-4" />
              <span>{isFa ? 'ارسال مدل جدید (Deploy)' : 'Deploy Model'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AI_MODELS_REGISTRY.map((model) => (
              <div 
                key={model.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {model.version}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">{model.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{model.architecture}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {model.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {isFa ? model.taskFa : model.taskEn}
                </p>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500">دقت (Accuracy):</span>
                    <div className="text-emerald-400 font-bold">{model.accuracy}%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">امتیاز F1:</span>
                    <div className="text-cyan-300 font-bold">{model.f1Score}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">تأخیر لبه (Latency):</span>
                    <div className="text-purple-300 font-bold">{model.latencyMs} ms</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
