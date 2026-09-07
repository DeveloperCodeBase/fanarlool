import React, { useState, useEffect } from 'react';
import { Language, InspectionRecord } from '../types';
import { RECENT_INSPECTIONS } from '../mockData';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  Cpu, 
  Sliders, 
  Scan, 
  Sparkles, 
  Zap,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';

interface Module1VisionProps {
  lang: Language;
}

export const Module1Vision: React.FC<Module1VisionProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Active sample inspection record
  const [inspections, setInspections] = useState<InspectionRecord[]>(RECENT_INSPECTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [opticalExposureUs, setOpticalExposureUs] = useState<number>(1800); // microseconds
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);

  const currentRecord = inspections[currentIndex] || inspections[0];

  // Live simulation tick
  useEffect(() => {
    if (!isLiveStreaming) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % inspections.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isLiveStreaming, inspections.length]);

  const passCount = 4280;
  const rejectCount = 104;
  const reworkCount = 38;
  const totalCount = passCount + rejectCount + reworkCount;
  const passRate = ((passCount / totalCount) * 100).toFixed(1);

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Module Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4" />
            <span>{isFa ? 'ماژول ۱ پروپوزال: کنترل ابعادی و کیفیت بصری' : 'Module 1: Machine Vision & Deep Learning QC'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'سامانه هوشمند بینایی ماشین و تفکیک خودکار قطعات' : 'Automated Machine Vision & Pneumatic Ejector Sorting'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'بازرسی بلادرنگ ابعاد هندسی و عیوب میکروسکوپی سطح فنر با دوربین صنعتی Basler 5MP، نورپردازی تله‌سنتریک CCS و مدل یادگیری عمیق YOLOv10 صنعتی با تفکیک ۳ سطحی (قبول / رد / قابل اصلاح).'
              : 'Sub-pixel edge dimensional measurement and deep-learning surface defect inspection deployed at 380 pcs/hour with pneumatic PLC reject diverter.'}
          </p>
        </div>

        {/* Camera Feed Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
              isLiveStreaming
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{isLiveStreaming ? (isFa ? 'پخش زنده دوربین' : 'Live Camera Feed') : (isFa ? 'فید متوقف' : 'Feed Paused')}</span>
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % inspections.length)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs"
            title={isFa ? 'نمونه بعدی' : 'Next Sample'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'کل قطعات بازرسی‌شده امروز:' : 'Total Inspected Today:'}</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{totalCount.toLocaleString()} {isFa ? 'عدد' : 'pcs'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'نرخ قبولی (Pass Rate):' : 'Overall Pass Rate:'}</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">{passRate}%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'قطعات مردود (اجکتور فعال):' : 'Rejected (Ejected):'}</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1">{rejectCount} {isFa ? 'عدد' : 'pcs'}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs text-slate-400">{isFa ? 'زمان چرخه بازرسی (Cycle Time):' : 'Avg Inspection Cycle:'}</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">{currentRecord.cycleTimeMs} ms</div>
        </div>
      </div>

      {/* Main Inspection Chamber Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Optical Camera Viewfinder Simulation */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[420px]">
          {/* Top Camera Metadata Overlay */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Camera className="w-3.5 h-3.5" />
              Basler ace 2 Pro (5.0 MP / Sony IMX)
            </span>
            <span>Exp: {opticalExposureUs} µs</span>
            <span>FPS: 45.2</span>
            <span>Calib: 0.042 mm/px</span>
          </div>

          {/* Simulated Camera Sensor Viewport */}
          <div className="relative my-4 flex-1 flex items-center justify-center bg-gradient-to-b from-slate-900 to-black rounded-xl border border-slate-800/80 overflow-hidden min-h-[300px]">
            {/* Optical Reticle / Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-px bg-cyan-500/20" />
              <div className="h-full w-px bg-cyan-500/20 absolute" />
              <div className="w-48 h-48 rounded-full border border-cyan-500/20 absolute" />
              <div className="w-72 h-72 rounded-full border border-dashed border-cyan-500/15 absolute" />
            </div>

            {/* Laser scanning beam animation */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser pointer-events-none opacity-80" />

            {/* Spring Silhouette Representation in Optical Backlight */}
            <div className="relative z-10 w-44 h-64 flex flex-col items-center justify-between py-2">
              {/* Spring Coils SVG Drawing */}
              <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.2)]" viewBox="0 0 100 160">
                {/* Backlight glow */}
                <defs>
                  <linearGradient id="springMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>

                {/* Ground top face */}
                <rect x="15" y="10" width="70" height="6" rx="2" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="0.8" />

                {/* Active coils helix path */}
                <path
                  d="M 20 18 Q 80 28, 80 40 Q 20 52, 20 64 Q 80 76, 80 88 Q 20 100, 20 112 Q 80 124, 80 136 Q 20 148, 80 152"
                  fill="none"
                  stroke="url(#springMetalGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />

                {/* Ground bottom face */}
                <rect x="15" y="150" width="70" height="6" rx="2" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="0.8" />
              </svg>

              {/* Sub-pixel Measurement Dimension Lines */}
              <div className="absolute top-2 -right-8 text-[10px] font-mono text-cyan-300 border-l border-cyan-400 pl-1">
                L0: {currentRecord.dimensions[0]?.actual} mm
              </div>
              <div className="absolute bottom-2 -left-8 text-[10px] font-mono text-emerald-300 border-r border-emerald-400 pr-1">
                Do: {currentRecord.dimensions[1]?.actual} mm
              </div>

              {/* Defect Bounding Boxes (if present in current sample) */}
              {currentRecord.defects.map((defect) => (
                <div
                  key={defect.id}
                  style={{
                    left: `${defect.boundingBox.x}%`,
                    top: `${defect.boundingBox.y}%`,
                    width: `${defect.boundingBox.width}%`,
                    height: `${defect.boundingBox.height}%`,
                  }}
                  onClick={() => setSelectedDefectId(defect.id)}
                  className="absolute border-2 border-rose-500 bg-rose-500/20 rounded cursor-pointer animate-pulse z-20 flex items-start justify-start p-0.5"
                >
                  <span className="text-[9px] font-mono bg-rose-600 text-white px-1 rounded -translate-y-4 whitespace-nowrap shadow">
                    {defect.type} ({(defect.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Live Verdict Tag Overlay */}
            <div className="absolute bottom-3 left-3 z-10">
              <div className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 shadow-lg ${
                currentRecord.status === 'pass'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  : currentRecord.status === 'reject'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                  : 'bg-amber-950/90 border-amber-500 text-amber-300'
              }`}>
                {currentRecord.status === 'pass' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {currentRecord.status === 'reject' && <XCircle className="w-4 h-4 text-rose-400" />}
                {currentRecord.status === 'rework' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                <span>
                  {currentRecord.status === 'pass' && (isFa ? 'تأیید کیفی (PASS)' : 'PASS')}
                  {currentRecord.status === 'reject' && (isFa ? 'مردود - پرتاب به مخزن ضایعات (REJECT)' : 'REJECT')}
                  {currentRecord.status === 'rework' && (isFa ? 'قابل اصلاح و سنگ‌زنی مجدد (REWORK)' : 'REWORK')}
                </span>
              </div>
            </div>

            {/* Pneumatic Diverter Actuator Indicator */}
            <div className="absolute bottom-3 right-3 z-10 text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-slate-300">
              <Zap className={`w-3.5 h-3.5 ${currentRecord.ejectorTriggered ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
              <span>{isFa ? 'شیر پنوماتیک اجکتور:' : 'Pneumatic Ejector:'}</span>
              <span className={currentRecord.ejectorTriggered ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {currentRecord.ejectorTriggered ? (isFa ? 'فعال (شلیک جک)' : 'TRIGGERED') : (isFa ? 'آماده‌باش' : 'IDLE')}
              </span>
            </div>
          </div>

          {/* Bottom Bar: Sample ID & Cycle Time */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-900 pt-2 px-1">
            <span>کد قطعه: <strong className="text-white">{currentRecord.id}</strong></span>
            <span>بچ: <strong className="text-cyan-300">{currentRecord.batchNumber}</strong></span>
            <span>زمان: {currentRecord.timestamp}</span>
          </div>
        </div>

        {/* Right Side: Dimensional Inspection Table & Defect Details */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Dimensional Tolerance Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>{isFa ? 'پارامترهای ابعادی ساب‌پیکسل' : 'Sub-pixel Dimensional Verifications'}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                تلرانس DIN 2095
              </span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {currentRecord.dimensions.map((dim, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-200">
                      {isFa ? dim.parameterFa : dim.parameterEn}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      نامی: {dim.nominal} {dim.unit} ({dim.minTol} ~ {dim.maxTol})
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold ${
                      dim.status === 'pass' ? 'text-emerald-400' : dim.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {dim.actual} {dim.unit}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                      dim.status === 'pass' ? 'bg-emerald-950 text-emerald-300' : dim.status === 'warning' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {dim.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Defects Box */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>{isFa ? 'عیوب ظاهری شناسایی‌شده (مدل یادگیری عمیق):' : 'AI Deep-Learning Defect Classification:'}</span>
            </h3>

            {currentRecord.defects.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'هیچ‌گونه ترک، خط و خش یا کربن‌زدایی سطحی یافت نشد. کیفیت بی‌نقص.' : 'No surface defects detected. High structural integrity.'}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {currentRecord.defects.map((def) => (
                  <div 
                    key={def.id}
                    className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span>{isFa ? def.nameFa : def.nameEn}</span>
                      <span className="font-mono text-[10px] bg-rose-900/80 px-2 py-0.5 rounded text-white">
                        دقت: {(def.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {isFa ? def.descriptionFa : def.descriptionEn}
                    </p>
                    <div className="text-[11px] text-amber-300 pt-1 border-t border-rose-900/50">
                      <strong>دستور اقدام:</strong> {def.recommendationFa}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
