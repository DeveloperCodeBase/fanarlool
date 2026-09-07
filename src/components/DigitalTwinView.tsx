import React, { useState, useEffect, useRef } from 'react';
import { Language, SpringPhysicalSpec, MachineTelemetry } from '../types';
import { SPRING_MODELS, FACTORY_STAGES } from '../mockData';
import { calculateSpringPhysics, SpringCalculationResult } from '../physicsEngine';
import { 
  Box, 
  RotateCw, 
  Play, 
  Pause, 
  Sliders, 
  Flame, 
  Activity, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

interface DigitalTwinViewProps {
  lang: Language;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  // Selected Spring Model
  const [selectedModel, setSelectedModel] = useState<SpringPhysicalSpec>(SPRING_MODELS[0]);
  
  // Physics Simulation Inputs
  const [appliedLoad, setAppliedLoad] = useState<number>(2800); // Newtons
  const [wireDiameter, setWireDiameter] = useState<number>(selectedModel.wireDiameter_d);
  const [meanDiameter, setMeanDiameter] = useState<number>(selectedModel.meanDiameter_D);
  const [activeCoils, setActiveCoils] = useState<number>(selectedModel.activeCoils_na);
  const [freeLength, setFreeLength] = useState<number>(selectedModel.freeLength_L0);
  const [shotPeened, setShotPeened] = useState<boolean>(true);

  // Update parameters when model changes
  useEffect(() => {
    setWireDiameter(selectedModel.wireDiameter_d);
    setMeanDiameter(selectedModel.meanDiameter_D);
    setActiveCoils(selectedModel.activeCoils_na);
    setFreeLength(selectedModel.freeLength_L0);
    setAppliedLoad(Math.round(selectedModel.maxLoad_F * 0.5));
  }, [selectedModel]);

  // Selected Stage in Production Line
  const [selectedStage, setSelectedStage] = useState<MachineTelemetry>(FACTORY_STAGES[1]); // Default to Coiler

  // 3D Canvas Rotation State
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(35);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // What-if Scenario Parameters
  const [simFurnaceTemp, setSimFurnaceTemp] = useState<number>(885); // Normal 885 C
  const [simCoilingSpeed, setSimCoilingSpeed] = useState<number>(45); // pieces/min
  const [simGrindFeed, setSimGrindFeed] = useState<number>(1.2); // mm/min
  const [simWireInhomogeneity, setSimWireInhomogeneity] = useState<number>(1.0); // 1.0 = standard

  // Calculate Spring Physics
  const physics: SpringCalculationResult = calculateSpringPhysics(
    wireDiameter,
    meanDiameter,
    freeLength,
    activeCoils,
    selectedModel.totalCoils_nt,
    appliedLoad,
    shotPeened
  );

  // Auto-rotate 3D Canvas
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.6) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Render 3D Helical Spring on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle coordinate grid on ground
    ctx.save();
    ctx.strokeStyle = '#141d2e';
    ctx.lineWidth = 1;
    const groundY = height * 0.85;
    for (let i = -150; i <= 150; i += 30) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + i * 1.5, groundY - 30);
      ctx.lineTo(width / 2 + i * 2.2, groundY + 40);
      ctx.stroke();
    }
    ctx.restore();

    // 3D Math Projection
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const currentL = physics.currentLength_mm;
    const scaleY = (height * 0.55) / (freeLength || 380);
    const radius = Math.min(width * 0.22, (meanDiameter / 2) * 1.6);
    const totalTurns = selectedModel.totalCoils_nt;
    const steps = 360;

    // Radian angles for 3D camera
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;

    const points: { x2d: number; y2d: number; z: number; stressRatio: number }[] = [];

    const springHeightPx = currentL * scaleY;
    const topY = centerY - springHeightPx / 2;
    const bottomY = centerY + springHeightPx / 2;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0 to 1 along helix
      const angle = t * totalTurns * 2 * Math.PI;

      // 3D coordinates in spring local space (Y is vertical)
      const localX = radius * Math.cos(angle);
      const localZ = radius * Math.sin(angle);
      const localY = topY + t * springHeightPx - centerY;

      // Rotate around Y axis
      const x1 = localX * Math.cos(radY) + localZ * Math.sin(radY);
      const z1 = -localX * Math.sin(radY) + localZ * Math.cos(radY);
      const y1 = localY;

      // Rotate around X axis
      const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);
      const x2 = x1;

      // Perspective projection
      const cameraDist = 450;
      const fovScale = cameraDist / (cameraDist + z2);

      const x2d = centerX + x2 * fovScale;
      const y2d = centerY + y2 * fovScale;

      // Stress gradient calculation: middle active coils bear full torsional stress; dead end coils bear lower stress
      const activeFactor = (t > 0.15 && t < 0.85) ? 1.0 : 0.45;
      const localStressRatio = (physics.stressRatioPercent / 100) * activeFactor;

      points.push({ x2d, y2d, z: z2, stressRatio: localStressRatio });
    }

    // Helper to get stress color
    const getStressColor = (ratio: number, alpha: number = 1.0) => {
      // 0.0 -> Blue, 0.4 -> Cyan, 0.7 -> Yellow/Amber, 0.9+ -> Red
      if (ratio < 0.35) {
        return `rgba(56, 189, 248, ${alpha})`; // Cyan/Blue
      } else if (ratio < 0.65) {
        return `rgba(52, 211, 153, ${alpha})`; // Emerald
      } else if (ratio < 0.85) {
        return `rgba(251, 191, 36, ${alpha})`; // Amber
      } else {
        return `rgba(244, 63, 94, ${alpha})`; // Red/Danger
      }
    };

    // Draw Top Load Plate (hydraulic compression ram)
    const topPlateY = topY - 12;
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - radius * 1.4, topPlateY - 14, radius * 2.8, 14, 4);
    ctx.fill();
    ctx.stroke();

    // Applied force vector arrow
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(centerX, topPlateY - 20);
    ctx.lineTo(centerX - 8, topPlateY - 32);
    ctx.lineTo(centerX + 8, topPlateY - 32);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#7dd3fc';
    ctx.textAlign = 'center';
    ctx.fillText(`F = ${appliedLoad} N`, centerX, topPlateY - 38);
    ctx.restore();

    // Draw Bottom Ground Fixture
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - radius * 1.5, bottomY, radius * 3.0, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Sort segments by average Z depth for painter's algorithm
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const avgZ = (p1.z + p2.z) / 2;
      const depthAlpha = Math.max(0.35, Math.min(1.0, (avgZ + 120) / 240));

      const strokeW = Math.max(3, (wireDiameter * 0.9) * (450 / (450 + avgZ)));

      // Draw wire segment with stress glow
      ctx.beginPath();
      ctx.moveTo(p1.x2d, p1.y2d);
      ctx.lineTo(p2.x2d, p2.y2d);
      ctx.strokeStyle = getStressColor(p1.stressRatio, depthAlpha);
      ctx.lineWidth = strokeW;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Overlay real-time telemetry badge inside canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.roundRect(14, 14, 180, 72, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Length: ${physics.currentLength_mm} mm`, 24, 32);
    ctx.fillText(`Deflection: ${physics.deflection_mm} mm`, 24, 48);
    ctx.fillStyle = physics.stressRatioPercent > 85 ? '#f43f5e' : '#34d399';
    ctx.fillText(`Stress: ${physics.shearStress_MPa} MPa (${physics.stressRatioPercent}%)`, 24, 64);

  }, [physics, rotX, rotY, wireDiameter, meanDiameter, freeLength, appliedLoad]);

  // What-if calculation adjustments
  const calcWhatIfScrapRate = () => {
    let baseScrap = 2.1;
    if (simFurnaceTemp < 860 || simFurnaceTemp > 910) {
      baseScrap += Math.abs(simFurnaceTemp - 885) * 0.08;
    }
    if (simCoilingSpeed > 50) {
      baseScrap += (simCoilingSpeed - 50) * 0.15;
    }
    if (simGrindFeed > 1.5) {
      baseScrap += (simGrindFeed - 1.5) * 2.2;
    }
    return Number(baseScrap.toFixed(2));
  };

  const calcWhatIfOee = () => {
    const scrap = calcWhatIfScrapRate();
    const speedPenalty = simCoilingSpeed < 35 ? (35 - simCoilingSpeed) * 0.8 : 0;
    return Math.max(50, Math.min(96, Number((88 - (scrap * 2.5) - speedPenalty).toFixed(1))));
  };

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Top Banner: Digital Twin State */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{isFa ? 'شبیه‌ساز فیزیک و دوقلوی بلادرنگ کارخانه' : 'Real-time Physics & Production Line Twin'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'دوقلوی دیجیتال فنر لول و فرآیند تولید ۸ مرحله‌ای' : 'Spring Mechanical & 8-Stage Factory Digital Twin'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'تلفیق فرمولاسیون مکانیک جامدات (ضریب تمرکز تنش وال، سفتی فنر، تحلیل خستگی) با جریان داده‌های زنده حسگرهای ۸ ایستگاه کارخانه فنر لول ایران.'
              : 'Synthesis of mechanical solid state equations (Wahl stress factor, spring stiffness, S-N fatigue) with live IoT streams across 8 production stations.'}
          </p>
        </div>

        {/* Model Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">
            {isFa ? 'مدل فنر:' : 'Spring Model:'}
          </label>
          <select
            value={selectedModel.id}
            onChange={(e) => {
              const m = SPRING_MODELS.find((item) => item.id === e.target.value);
              if (m) setSelectedModel(m);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-cyan-400"
          >
            {SPRING_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.modelName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Part 1: 3D Spring Mechanical Twin & Physics Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3D Canvas Box */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-white">
                {isFa ? 'نمای سه‌بعدی تنش فنر (3D Stress Heatmap)' : '3D Spring Stress Heatmap'}
              </span>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                  isRotating ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'text-slate-400 hover:text-white'
                }`}
                title={isFa ? 'چرخش خودکار' : 'Auto Rotate'}
              >
                {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setRotX(20); setRotY(35); }}
                className="p-1.5 rounded text-slate-400 hover:text-white"
                title={isFa ? 'بازنشانی زاویه دید' : 'Reset View'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="w-full h-80 sm:h-96 relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing rounded-xl"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const initialRotY = rotY;
                const initialRotX = rotX;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  setRotY(initialRotY + (moveEvent.clientX - startX) * 0.5);
                  setRotX(Math.max(-60, Math.min(60, initialRotX - (moveEvent.clientY - startY) * 0.5)));
                };
                const onMouseUp = () => {
                  window.removeEventListener('mousemove', onMouseMove);
                  window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
              }}
            />
          </div>

          {/* Stress Color Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2 pt-2 border-t border-slate-900">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
              {isFa ? 'تنش اندک (< ۳۵۰ MPa)' : 'Low Stress'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              {isFa ? 'محدوده بهینه (۳۵۰-۷۵۰)' : 'Optimal'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
              {isFa ? 'تنش بالا (۷۵۰-۹۵۰)' : 'High Stress'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              {isFa ? 'نزدیک به خستگی (> ۹۵۰ MPa)' : 'Yield / Fatigue'}
            </span>
          </div>
        </div>

        {/* Physics Control Panel & Live Equations */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? 'تست بارگذاری و متغیرهای فیزیکی' : 'Mechanical Test Bench Controls'}</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                DIN EN 13906-1
              </span>
            </div>

            {/* Applied Force Slider */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">{isFa ? 'نیروی فشاری اعمالی (F):' : 'Applied Load (F):'}</span>
                  <span className="text-cyan-400 font-bold">{appliedLoad.toLocaleString()} N ({((appliedLoad / 9.81)).toFixed(0)} kgf)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={selectedModel.maxLoad_F}
                  step="50"
                  value={appliedLoad}
                  onChange={(e) => setAppliedLoad(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Wire Diameter Slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">{isFa ? 'قطر مفتول (d):' : 'Wire Diameter (d):'}</span>
                  <span className="text-emerald-400 font-bold">{wireDiameter} mm</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="32.0"
                  step="0.1"
                  value={wireDiameter}
                  onChange={(e) => setWireDiameter(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Mean Coil Diameter */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">{isFa ? 'قطر متوسط حلقه (D):' : 'Mean Diameter (D):'}</span>
                  <span className="text-amber-400 font-bold">{meanDiameter} mm</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="220"
                  step="1"
                  value={meanDiameter}
                  onChange={(e) => setMeanDiameter(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Shot Peening Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{isFa ? 'فرآیند شات‌پینینگ (Shot Peening)' : 'Shot Peening Residual Stress'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isFa ? 'ایجاد تنش فشاری پسماند (-۴۰۰ MPa) و بهبود عمر خستگی' : 'Induces residual compressive stress layer'}
                  </div>
                </div>
                <button
                  onClick={() => setShotPeened(!shotPeened)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    shotPeened 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {shotPeened ? (isFa ? 'انجام شده' : 'Active') : (isFa ? 'بدون شات‌پینینگ' : 'Inactive')}
                </button>
              </div>
            </div>
          </div>

          {/* Mathematical Outputs Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'شاخص فنر (C = D/d):' : 'Spring Index (C):'}</div>
              <div className="text-sm font-bold text-white mt-0.5">{physics.springIndex_C}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'ضریب تصحیح وال (Kw):' : 'Wahl Factor (Kw):'}</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">{physics.wahlFactor_Kw}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'سفتی فنر (k):' : 'Spring Rate (k):'}</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{physics.springRate_k} N/mm</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'تنش برشی پیچشی (τ):' : 'Shear Stress (τ):'}</div>
              <div className={`text-sm font-bold mt-0.5 ${physics.stressRatioPercent > 80 ? 'text-rose-400' : 'text-yellow-400'}`}>
                {physics.shearStress_MPa} MPa
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'تخمین سیکل عمر خستگی:' : 'Projected Fatigue Life:'}</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">
                {physics.estimatedFatigueCycles.toLocaleString()} {isFa ? 'سیکل' : 'Cycles'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">{isFa ? 'ضریب اطمینان (SF):' : 'Safety Factor (SF):'}</div>
              <div className={`text-sm font-bold mt-0.5 ${physics.safetyFactor >= 1.2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {physics.safetyFactor}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: 8-Stage Production Line Virtual Floor Twin */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>{isFa ? 'دوقلوی فرآیند تولید ۸ ایستگاه کارخانه فنر لول' : '8-Stage Factory Floor Process Twin'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa 
                ? 'جریان پیوسته تولید از کلاف‌بازکن تا سلول بینایی ماشین. برای مشاهده وضعیت سنسورها، روی هر ایستگاه کلیک کنید:'
                : 'Click any production station to inspect real-time IoT sensors, vibration, and failure prediction:'}
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-700/60 self-start sm:self-auto">
            {isFa ? 'نرخ تولید: ۳۸۰ عدد در ساعت' : 'Rate: 380 pcs/hr'}
          </div>
        </div>

        {/* 8 Stages Interactive Flow Map */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {FACTORY_STAGES.map((st) => {
            const isSelected = selectedStage.id === st.id;
            const isWarning = st.status === 'warning';
            return (
              <div
                key={st.id}
                onClick={() => setSelectedStage(st)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950/50 scale-[1.02]'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-600/70 hover:bg-amber-950/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      #{st.stageNumber}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="font-bold text-xs text-white leading-tight line-clamp-2">
                    {isFa ? st.nameFa.split(':')[1]?.trim() || st.nameFa : st.nameEn}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono flex items-center justify-between text-slate-400">
                  <span>سلامت:</span>
                  <span className={st.healthScore > 85 ? 'text-emerald-400' : 'text-amber-400 font-bold'}>
                    {st.healthScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Selected Machine Live Telemetry Card */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                selectedStage.status === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
              }`}>
                {isFa ? `ایستگاه ${selectedStage.stageNumber}` : `Stage ${selectedStage.stageNumber}`}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white">
                {isFa ? selectedStage.nameFa : selectedStage.nameEn}
              </h4>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">{isFa ? 'عمر مفید باقی‌مانده (RUL):' : 'Remaining Useful Life (RUL):'}</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedStage.rulHours} {isFa ? 'ساعت کارکرد' : 'Hours'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFa ? 'مؤلفه محتمل خرابی:' : 'Failure Suspect:'}</span>
                <span className="text-amber-300">{isFa ? selectedStage.predictedFailureComponentFa : selectedStage.predictedFailureComponentEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFa ? 'آخرین سرویس و کالیبراسیون:' : 'Last Service Date:'}</span>
                <span className="font-mono text-slate-300">{selectedStage.lastServiceDate}</span>
              </div>
            </div>

            {selectedStage.sensorAlertFa && (
              <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-700/60 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{selectedStage.sensorAlertFa}</span>
              </div>
            )}
          </div>

          {/* Sensor Gauges Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">{isFa ? 'لرزش RMS (سه‌محوره):' : 'Vibration RMS:'}</span>
              <div className={`text-base font-bold font-mono ${selectedStage.vibrationRms > 4.0 ? 'text-amber-400' : 'text-cyan-300'}`}>
                {selectedStage.vibrationRms} mm/s
              </div>
              <span className="text-[10px] text-slate-500 font-mono">پیک: {selectedStage.vibrationPeakFreq} Hz</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">{isFa ? 'دمای عملیاتی:' : 'Temperature:'}</span>
              <div className={`text-base font-bold font-mono ${selectedStage.temperatureC > 70 && selectedStage.category !== 'furnace' && selectedStage.category !== 'quench' ? 'text-amber-400' : 'text-emerald-300'}`}>
                {selectedStage.temperatureC}°C
              </div>
              <span className="text-[10px] text-slate-500 font-mono">سنسور PT100</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">{isFa ? 'جریان الکتروموتور:' : 'Motor Current:'}</span>
              <div className="text-base font-bold font-mono text-purple-300">
                {selectedStage.motorCurrentAmps} A
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ترانسدیوسر جریان</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">{isFa ? 'صدا / آکوستیک:' : 'Acoustic Noise:'}</span>
              <div className="text-base font-bold font-mono text-yellow-300">
                {selectedStage.acousticDb} dB
              </div>
              <span className="text-[10px] text-slate-500 font-mono">سنسور التراسونیک</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part 3: What-If Scenario Engineering Simulator */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-cyan-500/30 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isFa ? 'شبیه‌ساز سناریوهای چه-می‌شود اگر (What-If Scenario Simulator)' : 'What-If Factory Scenario Simulator'}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {isFa ? 'تأثیر تغییر پارامترهای فرآیند بر ضایعات و OEE' : 'Process parameters vs output scrap'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>{isFa ? 'دمای کوره آستنیته زون ۲:' : 'Furnace Temp (Zone 2):'}</span>
                <span className="text-amber-400 font-bold">{simFurnaceTemp}°C</span>
              </div>
              <input
                type="range"
                min="820"
                max="940"
                step="5"
                value={simFurnaceTemp}
                onChange={(e) => setSimFurnaceTemp(Number(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>۸۲۰°C (کم)</span>
                <span>استاندارد: ۸۸۵°C</span>
                <span>۹۴۰°C (دکربوراسیون)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>{isFa ? 'سرعت فنرپیچ CNC (قطعه بر دقیقه):' : 'Coiling Feed Speed:'}</span>
                <span className="text-cyan-400 font-bold">{simCoilingSpeed} pcs/min</span>
              </div>
              <input
                type="range"
                min="25"
                max="65"
                step="1"
                value={simCoilingSpeed}
                onChange={(e) => setSimCoilingSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>{isFa ? 'نرخ فید سنگ‌زنی دوسر (mm/min):' : 'Grinding Feed Rate:'}</span>
                <span className="text-emerald-400 font-bold">{simGrindFeed} mm/min</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.4"
                step="0.1"
                value={simGrindFeed}
                onChange={(e) => setSimGrindFeed(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Real-time What-If Predicted Impacts */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400">{isFa ? 'پیش‌بینی نرخ ضایعات خط:' : 'Predicted Scrap Rate:'}</span>
                <div className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${calcWhatIfScrapRate() > 3.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {calcWhatIfScrapRate()}%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {simFurnaceTemp > 905 ? (
                  isFa ? '⚠️ خطر کربن‌زدایی سطحی (Decarburization) و افت سختی به کمتر از ۴۸ HRC' : 'Risk of surface decarburization'
                ) : simFurnaceTemp < 860 ? (
                  isFa ? '⚠️ تبدیل ناکامل به آستنیت و کاهش چقرمگی ضربه فنر' : 'Incomplete austenitization'
                ) : (
                  isFa ? 'شرایط متالورژیکی و سختی فنر در بازه استاندارد ۵۰-۵۴ HRC' : 'Ideal metallurgy'
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400">{isFa ? 'شاخص پیش‌بینی OEE خط:' : 'Simulated Line OEE:'}</span>
                <div className="text-2xl sm:text-3xl font-bold font-mono mt-1 text-cyan-300">
                  {calcWhatIfOee()}%
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {isFa 
                  ? 'موتور یادگیری تقویتی دوقلوی دیجیتال بر اساس بهینه‌سازی توأم انرژی و راندمان پیشنهاد می‌دهد سرعت ۴۲ الی ۴۸ قطعه بر دقیقه حفظ شود.'
                  : 'AI recommends maintaining 42-48 pcs/min for best energy/scrap trade-off.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
