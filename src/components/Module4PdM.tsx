import React, { useState } from 'react';
import { Language, WorkOrder } from '../types';
import { WORK_ORDERS, FACTORY_STAGES } from '../mockData';
import { 
  Wrench, 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  Flame, 
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface Module4PdMProps {
  lang: Language;
}

export const Module4PdM: React.FC<Module4PdMProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [selectedMachine, setSelectedMachine] = useState(FACTORY_STAGES[1]); // CNC Coiler
  const [workOrdersList, setWorkOrdersList] = useState<WorkOrder[]>(WORK_ORDERS);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Simulated FFT Vibration Spectrum Data (0 to 1200 Hz)
  const fftSpectrumData = [
    { freq: 25, amplitude: 0.8, desc: '1X RPM (نابالانسی دور)' },
    { freq: 50, amplitude: 1.4, desc: '2X RPM (ناهم‌راستایی کوپلینگ)' },
    { freq: 75, amplitude: 0.6, desc: '3X Harmonic' },
    { freq: 110, amplitude: 0.5, desc: 'Background' },
    { freq: 180, amplitude: 0.7, desc: 'Sub-harmonic' },
    { freq: 240, amplitude: 1.1, desc: 'Cage Frequency (FTF)' },
    { freq: 350, amplitude: 0.9, desc: 'Structural' },
    { freq: 485, amplitude: 4.8, desc: 'BPFO - فرکانس خرابی رینگ خارجی بیرینگ SKF' }, // Peak fault!
    { freq: 550, amplitude: 1.2, desc: 'Sideband 1' },
    { freq: 620, amplitude: 2.1, desc: 'BPFI - فرکانس رینگ داخلی' },
    { freq: 780, amplitude: 0.7, desc: 'Harmonic' },
    { freq: 970, amplitude: 3.2, desc: '2X BPFO (هارمونیک دوم عیب بیرینگ)' },
    { freq: 1100, amplitude: 0.8, desc: 'High Freq Noise' },
  ];

  // RUL Degradation curve over time (past 30 days and 20 days projection)
  const rulTrendData = [
    { day: '۳۰ روز پیش', health: 98, rul: 2800 },
    { day: '۲۵ روز پیش', health: 95, rul: 2400 },
    { day: '۲۰ روز پیش', health: 93, rul: 2100 },
    { day: '۱۵ روز پیش', health: 90, rul: 1800 },
    { day: '۱۰ روز پیش', health: 86, rul: 1450 },
    { day: '۵ روز پیش', health: 82, rul: 1100 },
    { day: 'امروز', health: 78, rul: 850 },
    { day: '+۵ روز آینده', health: 71, rul: 620, isProjected: true },
    { day: '+۱۰ روز آینده', health: 63, rul: 380, isProjected: true },
    { day: '+۱۵ روز آینده (بحرانی)', health: 48, rul: 120, isProjected: true },
  ];

  const handleApproveWorkOrder = (id: string) => {
    setWorkOrdersList((prev) =>
      prev.map((wo) => (wo.id === id ? { ...wo, status: 'in_progress' } : wo))
    );
  };

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۴ پروپوزال: نگهداری و تعمیرات پیش‌بینانه' : 'Module 4: Predictive Maintenance (PdM)'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'سامانه پایش وضعیت ارتعاشات و تخمین عمر مفید (RUL)' : 'Condition Monitoring, FFT Spectrum & RUL Prognostics'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'پایش بلادرنگ ارتعاشات با سنسورهای IEPE، آنالیز طیف فوریه (FFT)، آشکارسازی عیوب نابالانسی، ناهم‌راستایی و خرابی بیرینگ (BPFI/BPFO) و صدور خودکار دستور کار هوشمند.'
              : 'Real-time vibration spectral analysis, bearing defect frequencies, remaining useful life regression, and CMMS integration.'}
          </p>
        </div>

        {/* Machine Status Summary */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-600/80 text-amber-300 text-xs font-mono font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{isFa ? '۱ هشدار خرابی زودهنگام (کوپلر و بیرینگ)' : '1 Early Warning Detected'}</span>
          </span>
        </div>
      </div>

      {/* FFT Vibration Spectrum & RUL Prognostics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FFT Frequency Spectrum Chart */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'طیف ارتعاشاتی FFT شتاب‌سنج (Frequency Spectrum)' : 'Vibration Acceleration FFT (0-1200 Hz)'}</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  سنسور: IEPE Tri-axial روی یاتاقان درایو دستگاه فنرپیچ CNC
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                پیک بحرانی: ۴۸۵ هرتز (BPFO)
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fftSpectrumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vibeGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="freq" stroke="#64748b" fontSize={10} unit=" Hz" />
                  <YAxis stroke="#64748b" fontSize={10} unit=" mm/s" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <ReferenceLine y={2.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'حد هشدار (ISO 10816)', fill: '#f59e0b', fontSize: 10 }} />
                  <ReferenceLine y={4.5} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'حد خطر', fill: '#f43f5e', fontSize: 10 }} />
                  <Area type="monotone" dataKey="amplitude" stroke="#38bdf8" fillOpacity={1} fill="url(#vibeGrad)" strokeWidth={2} name="دامنه ارتعاش (mm/s)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">تشخیص هوش مصنوعی:</strong>{' '}
              {isFa 
                ? 'پیک برجسته در ۴۸۵ هرتز منطبق بر فرکانس عبور ساچمه از رینگ خارجی (BPFO) بیرینگ درایو است. خرابی در مرحله ۲ تخریب سطحی قرار دارد. پیش از وقوع توقف ناگهانی، نسبت به تعویض بیرینگ اقدام نمایید.'
                : 'Defect signature matches BPFO of drive spindle bearing. Surface flaking stage detected.'}
            </div>
          </div>
        </div>

        {/* RUL (Remaining Useful Life) Degradation Tracker */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{isFa ? 'تخمین عمر مفید باقی‌مانده (RUL)' : 'Remaining Useful Life Curve'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                مدل: رگرسیون تضعیف Weibull
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rulTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rulGrad" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[40, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="health" stroke="#f59e0b" fillOpacity={1} fill="url(#rulGrad)" strokeWidth={2} name="شاخص سلامت تجهیز (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">{isFa ? 'زمان تا خرابی قطعی:' : 'Time to Functional Failure:'}</span>
            <span className="text-amber-400 font-bold">۸۵۰ ساعت کاری (~۱۴ روز کاری)</span>
          </div>
        </div>
      </div>

      {/* Automated Smart Work Orders Management (CMMS Integration) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>{isFa ? 'کارتابل دستور کارهای خودکار پیش‌بینانه (Smart Work Orders)' : 'Automated Predictive Work Orders'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa ? 'صدور خودکار دستور کار تعمیرات بر اساس هشدارهای پیش‌بینانه سنسورها و رزرو قطعات یدکی' : 'AI-triggered maintenance tasks with spare part reservation'}
            </p>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${filterPriority === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              همه ({workOrdersList.length})
            </button>
            <button
              onClick={() => setFilterPriority('critical')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${filterPriority === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400'}`}
            >
              بحرانی
            </button>
            <button
              onClick={() => setFilterPriority('high')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${filterPriority === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400'}`}
            >
              اولویت بالا
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {workOrdersList
            .filter((wo) => filterPriority === 'all' || wo.priority === filterPriority)
            .map((wo) => (
              <div 
                key={wo.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{wo.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      wo.priority === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : wo.priority === 'high'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {wo.priority.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-sm text-white">{isFa ? wo.titleFa : wo.titleEn}</h4>
                  </div>

                  <p className="text-xs text-slate-400">
                    {isFa ? (wo.descriptionFa || wo.reasonFa) : (wo.descriptionEn || wo.titleEn)}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                    <span>تجهیز: <strong className="text-slate-300">{wo.machineId}</strong></span>
                    <span>قطعه یدکی: <strong className="text-cyan-300">{wo.sparePartsNeeded?.join(', ') || (isFa ? 'روان‌کار صنعتی و ست آب‌بند' : 'Standard Seals')}</strong></span>
                    <span>زمان تخمینی: {wo.estimatedDurationHours || 2} ساعت</span>
                    <span>مسئول: {wo.assignedTo || wo.assignedTeamFa}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {wo.status === 'pending' ? (
                    <button
                      onClick={() => handleApproveWorkOrder(wo.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-950"
                    >
                      {isFa ? 'تأیید و ارجاع به تکنسین' : 'Approve & Assign'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isFa ? 'در حال اجرا' : 'In Progress'}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
