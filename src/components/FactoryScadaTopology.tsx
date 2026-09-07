import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { industrialAudio } from '../utils/soundEffects';
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  Gauge, 
  Layers, 
  Volume2, 
  VolumeX, 
  Radio, 
  Play, 
  Pause, 
  Eye, 
  Wrench, 
  Zap, 
  Sliders, 
  ShieldCheck, 
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Map as MapIcon,
  Compass
} from 'lucide-react';
import { FactoryFloorMap } from './FactoryFloorMap';

interface FactoryScadaProps {
  lang: Language;
}

interface StationInfo {
  id: string;
  number: number;
  nameFa: string;
  nameEn: string;
  type: string;
  status: 'running' | 'warning' | 'critical' | 'idle';
  operator: string;
  temperature: number; // °C
  rpm: number;
  currentAmps: number; // A
  vibrationRms: number; // mm/s
  efficiencyOee: number; // %
  totalParts: number;
  rejectCount: number;
  modbusAddress: string;
  descriptionFa: string;
  descriptionEn: string;
}

export const FactoryScadaTopology: React.FC<FactoryScadaProps> = ({ lang }) => {
  const isFa = lang === 'fa';
  const [soundOn, setSoundOn] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string>('st8_vision');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simTick, setSimTick] = useState<number>(0);
  const [scadaViewMode, setScadaViewMode] = useState<'floor_map' | 'linear_flow'>('floor_map');
  const [activeModbusView, setActiveModbusView] = useState<'registers' | 'coils' | 'mqtt'>('registers');
  const [lastEventText, setLastEventText] = useState<string>('خط تولید در وضعیت عادی - تلرانس‌ها مطابق استاندارد ساپکو است.');

  // Initialize sound state
  useEffect(() => {
    industrialAudio.enabled = soundOn;
  }, [soundOn]);

  const [stations, setStations] = useState<StationInfo[]>([
    {
      id: 'st1_dereeler',
      number: 1,
      nameFa: 'کلاف‌بازکن و اکسیدزدایی مفتول',
      nameEn: 'Wire Pay-off & Mechanical Descaling',
      type: 'Mechanical / Feed',
      status: 'running',
      operator: 'رضا صیادی (شیفت A)',
      temperature: 34.2,
      rpm: 120,
      currentAmps: 14.5,
      vibrationRms: 1.15,
      efficiencyOee: 92.4,
      totalParts: 4520,
      rejectCount: 8,
      modbusAddress: 'Holding 40001-40010',
      descriptionFa: 'تغذیه پیوسته مفتول فولادی آلیاژی 54SiCr6 با کشش مکانیکی و غلتک‌های اکسیدزدا جهت رفع پوسته نورد.',
      descriptionEn: 'Continuous alloy wire feeding with mechanical descaling rollers for surface scale removal.'
    },
    {
      id: 'st2_coiler',
      number: 2,
      nameFa: 'دستگاه لول‌کنی CNC اتوماتیک',
      nameEn: 'CNC Automatic Coil Winding (Wafios)',
      type: 'High Precision CNC',
      status: 'running',
      operator: 'مهندس کاظمی (شیفت A)',
      temperature: 48.6,
      rpm: 1450,
      currentAmps: 32.8,
      vibrationRms: 2.18,
      efficiencyOee: 89.6,
      totalParts: 4512,
      rejectCount: 22,
      modbusAddress: 'Holding 40011-40020',
      descriptionFa: 'شکل‌دهی گام متغیر و قطرهای بیرونی فنر لول تحت کنترل سرووموتورهای دقیق ۶ محوره با مانیتورینگ گام.',
      descriptionEn: '6-axis servo CNC cold coiler shaping variable pitch and outer diameter with real-time feedback.'
    },
    {
      id: 'st3_furnace',
      number: 3,
      nameFa: 'کوره پیوسته آستنمپرینگ و کوئیچ',
      nameEn: 'Continuous Austempering & Quench Furnace',
      type: 'Thermal Treatment',
      status: 'running',
      operator: 'حسین نظری (شیفت A)',
      temperature: 885.0,
      rpm: 45,
      currentAmps: 78.4,
      vibrationRms: 0.82,
      efficiencyOee: 94.1,
      totalParts: 4490,
      rejectCount: 14,
      modbusAddress: 'Holding 40021-40030',
      descriptionFa: 'حرارت‌دهی در اتمسفر محافظ گاز خنثی در دمای ۸۸۵ درجه و کوئنچ سریع در روغن جهت ایجاد ساختار مارتنزیت.',
      descriptionEn: 'Austenitizing at 885°C in protective atmosphere followed by rapid oil quenching for martensite formation.'
    },
    {
      id: 'st4_temper',
      number: 4,
      nameFa: 'کوره برگشت و تنش‌زدایی (Tempering)',
      nameEn: 'Tempering & Stress Relief Furnace',
      type: 'Thermal Treatment',
      status: 'running',
      operator: 'حسین نظری (شیفت A)',
      temperature: 435.5,
      rpm: 40,
      currentAmps: 45.2,
      vibrationRms: 0.74,
      efficiencyOee: 95.3,
      totalParts: 4476,
      rejectCount: 6,
      modbusAddress: 'Holding 40031-40040',
      descriptionFa: 'حرارت‌دهی ثانویه در ۴۳۵ درجه جهت دستیابی به سختی ۵۰ الی ۵۴ راکول C و بهبود چقرمگی و مقاومت خستگی.',
      descriptionEn: 'Secondary heat treatment to achieve target 50-54 HRC hardness and optimize fatigue endurance.'
    },
    {
      id: 'st5_grinder',
      number: 5,
      nameFa: 'سنگ‌زنی دوطرفه انتهای فنر (OMD)',
      nameEn: 'Double-End Vertical Surface Grinder',
      type: 'Mechanical Machining',
      status: 'running',
      operator: 'احمد رمضانی (شیفت A)',
      temperature: 58.2,
      rpm: 2950,
      currentAmps: 55.4,
      vibrationRms: 3.42,
      efficiencyOee: 84.8,
      totalParts: 4470,
      rejectCount: 31,
      modbusAddress: 'Holding 40041-40050',
      descriptionFa: 'ماشین‌کاری همزمان دو سر فنر جهت حصول تعامد کف با تلرانس زاویه‌ای کمتر از ۱.۵ درجه و تخت‌شدن حلقه‌های انتهایی.',
      descriptionEn: 'Simultaneous dual-end grinding ensuring perpendicularity angle under 1.5° and flat seating.'
    },
    {
      id: 'st6_shotpeen',
      number: 6,
      nameFa: 'محفظه شات‌پینینگ گریز از مرکز',
      nameEn: 'High-Velocity Shot Peening Chamber',
      type: 'Surface Hardening',
      status: 'running',
      operator: 'سید علی موسوی (شیفت A)',
      temperature: 41.5,
      rpm: 3200,
      currentAmps: 64.0,
      vibrationRms: 2.85,
      efficiencyOee: 91.2,
      totalParts: 4439,
      rejectCount: 9,
      modbusAddress: 'Holding 40051-40060',
      descriptionFa: 'بمباران ساچمه‌های کروی فولادی S230 جهت اعمال تنش پسماند فشاری سطحی (۵۰۰- مگاپاسکال) و چندبرابر شدن عمر خستگی.',
      descriptionEn: 'Bombardment of S230 steel shots inducing compressive residual stress (-500 MPa) to multiply fatigue life.'
    },
    {
      id: 'st7_scragging',
      number: 7,
      nameFa: 'پرس پیش‌نشست و خزش گرم (Hot Scragging)',
      nameEn: 'Hot Setting & Pre-load Scragging Press',
      type: 'Mechanical Setting',
      status: 'running',
      operator: 'مرتضی قربانی (شیفت A)',
      temperature: 36.8,
      rpm: 60,
      currentAmps: 38.0,
      vibrationRms: 1.45,
      efficiencyOee: 93.7,
      totalParts: 4430,
      rejectCount: 11,
      modbusAddress: 'Holding 40061-40070',
      descriptionFa: 'فشردن فنر تا حد توپر شدن کامل (Solid Height) برای ۳ الی ۵ چرخه جهت جلوگیری از افت ارتفاع در خودرو.',
      descriptionEn: 'Compressing spring to solid height 3-5 times to eliminate subsequent sag and relaxation in service.'
    },
    {
      id: 'st8_vision',
      number: 8,
      nameFa: 'ایستگاه بازرسی هوش مصنوعی Basler و لیزر',
      nameEn: 'AI Basler 2D/3D Vision & Laser Station',
      type: 'AI / Metrology',
      status: 'running',
      operator: 'سیستم هوشمند ابتکار ویستا',
      temperature: 28.4,
      rpm: 0,
      currentAmps: 5.2,
      vibrationRms: 0.25,
      efficiencyOee: 99.1,
      totalParts: 4419,
      rejectCount: 42,
      modbusAddress: 'Holding 40071-40080',
      descriptionFa: 'اندازه‌گیری لحظه‌ای طول آزاد، قطر بیرونی، تعداد حلقه‌ها و عیوب سطحی با دوربین ۵ مگاپیکسل و اسکنر لیزری سه‌بعدی.',
      descriptionEn: 'Real-time free length, OD, pitch uniformity, and surface crack detection using Basler 5MP camera and 3D laser profilometry.'
    },
    {
      id: 'st9_sorter',
      number: 9,
      nameFa: 'جک پنوماتیک سورتینگ قطعات معیوب',
      nameEn: 'High-Speed Pneumatic Reject Chute',
      type: 'Actuator / Safety',
      status: 'running',
      operator: 'سیستم خودکار PLC S7-1200',
      temperature: 31.0,
      rpm: 0,
      currentAmps: 3.1,
      vibrationRms: 0.90,
      efficiencyOee: 99.8,
      totalParts: 4419,
      rejectCount: 42,
      modbusAddress: 'Coils 00001-00010',
      descriptionFa: 'دریافت سیگنال ایجکت از هوش مصنوعی در کمتر از ۴۵ میلی‌ثانیه و پرتاب قطعه نامنطبق به سبد ضایعات ردیابی‌شده.',
      descriptionEn: 'High-speed pneumatic solenoid chute ejecting rejected springs into quarantine bin within 45ms trigger.'
    },
    {
      id: 'st10_packaging',
      number: 10,
      nameFa: 'بسته‌بندی و بارکدگذاری ردیابی ساپکو',
      nameEn: 'Automated Palletizing & Traceability QR',
      type: 'Packaging / Logistics',
      status: 'running',
      operator: 'محمد کریمی (شیفت A)',
      temperature: 24.5,
      rpm: 30,
      currentAmps: 11.8,
      vibrationRms: 0.65,
      efficiencyOee: 96.5,
      totalParts: 4377,
      rejectCount: 0,
      modbusAddress: 'Holding 40091-40100',
      descriptionFa: 'تولید شناسه یونیک ردیابی، چاپ بارکد ماتریسی استاندارد ایران خودرو/ساپکو و بسته‌بندی ضدزنگ پالت‌ها.',
      descriptionEn: 'Generating unique SAPCO lot traceability QR, anti-corrosion VCI packaging, and automated palletizing.'
    }
  ]);

  // Live simulation tick
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSimTick(t => t + 1);
      setStations(prev => prev.map(s => {
        // Minor dynamic jitter for realism
        const tempJitter = (Math.random() - 0.5) * 0.4;
        const currentJitter = (Math.random() - 0.5) * 0.3;
        const vibJitter = (Math.random() - 0.5) * 0.05;
        
        let newTotal = s.totalParts;
        let newReject = s.rejectCount;

        // Occasionally produce another piece
        if (Math.random() > 0.6) {
          newTotal += 1;
          if (s.id === 'st8_vision' && Math.random() > 0.92) {
            newReject += 1;
            // sound trigger!
            industrialAudio.playPneumaticReject();
            setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] قطعه نامنطبق توسط دوربین بازرسی شناسایی و توسط جک پنوماتیک سورتینگ شد (انحراف گام +۰.۸mm).`);
          } else if (s.id === 'st8_vision') {
            // normal piece pass
            if (Math.random() > 0.8) {
              industrialAudio.playPassChime();
            }
          }
        }

        return {
          ...s,
          temperature: Math.round((s.temperature + tempJitter) * 10) / 10,
          currentAmps: Math.round((s.currentAmps + currentJitter) * 10) / 10,
          vibrationRms: Math.max(0.1, Math.round((s.vibrationRms + vibJitter) * 100) / 100),
          totalParts: newTotal,
          rejectCount: newReject,
        };
      }));
    }, 2400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[7];

  // Action handlers
  const handleTriggerRejectTest = () => {
    industrialAudio.playPneumaticReject();
    setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] تست دستی جک ایجکت پنوماتیک ماژول ۹ اجرا شد (فشار باد ۶.۲ بار، زمان بازخورد ۳۸ms).`);
    setStations(prev => prev.map(s => s.id === 'st9_sorter' ? { ...s, rejectCount: s.rejectCount + 1 } : s));
  };

  const handleInjectFault = (faultType: 'bearing' | 'pitch' | 'temperature') => {
    industrialAudio.playAlarmSiren();
    if (faultType === 'bearing') {
      setStations(prev => prev.map(s => s.id === 'st5_grinder' ? { ...s, status: 'warning', vibrationRms: 5.82 } : s));
      setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] هشدار: ارتعاشات غیرعادی اسپیندل سنگ‌زنی دوسر به ۵.۸۲ mm/s رسید (بیرینگ جلو در معرض سایش شدید).`);
      setSelectedStationId('st5_grinder');
    } else if (faultType === 'pitch') {
      setStations(prev => prev.map(s => s.id === 'st8_vision' ? { ...s, status: 'warning', rejectCount: s.rejectCount + 3 } : s));
      setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] اخطار عیب ابعادی: انحراف قطر بیرونی فنر +۱.۲ میلیمتر فراتر از تلرانس در ۳ قطعه متوالی!`);
      setSelectedStationId('st8_vision');
    } else {
      setStations(prev => prev.map(s => s.id === 'st3_furnace' ? { ...s, status: 'critical', temperature: 915.0 } : s));
      setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] خطر بحرانی: دمای زون ۱ کوره آستنمپرینگ به ۹۱۵ درجه سانتیگراد افزایش یافت (خطر دانه درشتی آستنیت).`);
      setSelectedStationId('st3_furnace');
    }
  };

  const handleResetFaults = () => {
    industrialAudio.playPassChime();
    setStations(prev => prev.map(s => ({
      ...s,
      status: 'running',
      vibrationRms: s.id === 'st5_grinder' ? 3.42 : s.vibrationRms,
      temperature: s.id === 'st3_furnace' ? 885.0 : s.temperature,
    })));
    setLastEventText(`[${new Date().toLocaleTimeString('fa-IR')}] تمامی آلارم‌های شبیه‌سازی ریست شدند و شرایط پایدار برقرار گردید.`);
  };

  return (
    <div className="space-y-6">
      {/* Top SCADA Header Bar */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  {isFa ? 'توپولوژی خط تولید و معماری SCADA صنعتی' : 'Factory Floor Topology & SCADA Architecture'}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                    Siemens S7-1200 / Modbus TCP
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {isFa 
                    ? 'پایش بلادرنگ ۱۰ ایستگاه تولیدی فنر لول ایران از کلاف‌بازکن تا سورتینگ و بسته‌بندی ساپکو'
                    : 'Real-time telemetry of 10 manufacturing stages from wire feeding to AI sorting and SAPCO packaging'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Toolbar Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                industrialAudio.playClick();
                setSoundOn(!soundOn);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                soundOn 
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundOn ? (isFa ? 'صوت صنعتی فعال' : 'Audio On') : (isFa ? 'بی‌صدا' : 'Muted')}</span>
            </button>

            <button
              onClick={() => {
                industrialAudio.playClick();
                setIsSimulating(!isSimulating);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                isSimulating 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? (isFa ? 'پالس زنده PLC فعال' : 'PLC Polling Live') : (isFa ? 'متوقف' : 'Paused')}</span>
            </button>

            <button
              onClick={handleResetFaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isFa ? 'ریست آلارم‌ها' : 'Reset Alarms'}</span>
            </button>
          </div>
        </div>

        {/* Live Industrial Marquee Banner */}
        <div className="mt-4 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-cyan-400 font-bold shrink-0">SCADA Event:</span>
            <span className="text-slate-300">{lastEventText}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
            <span>Cycle: #{simTick}</span>
            <span>QoS: 1</span>
            <span>Latency: 18ms</span>
          </div>
        </div>
      </div>

      {/* SCADA Topology View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {isFa ? 'توپولوژی و مانیتورینگ سالن تولید' : 'Factory Floor Topology & Monitoring'}
            </h2>
            <p className="text-xs text-slate-400">
              {isFa 
                ? 'نمای دوبعدی پلان سالن با سنسورهای پایش آنلاین و کارت‌های تعمیرات پیشگیرانه' 
                : 'Interactive 2D plant layout with online sensor telemetry and active maintenance logs'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              industrialAudio.playClick();
              setScadaViewMode('floor_map');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              scadaViewMode === 'floor_map'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{isFa ? 'پلان دوبعدی سالن (Floor Map)' : 'Factory Floor Map'}</span>
          </button>
          <button
            onClick={() => {
              industrialAudio.playClick();
              setScadaViewMode('linear_flow');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              scadaViewMode === 'linear_flow'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isFa ? 'شماتیک خطی فرآیند (Pipeline)' : 'Process Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Conditional: SVG Floor Map OR Linear Pipeline */}
      {scadaViewMode === 'floor_map' ? (
        <FactoryFloorMap
          lang={lang}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => {
            industrialAudio.playClick();
            setSelectedStationId(id);
          }}
          stations={stations}
          simTick={simTick}
        />
      ) : (
        /* 10-Station Interactive Process Flow Pipeline */
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {isFa ? 'شماتیک خطی جریان مواد و ایستگاه‌های عملیاتی' : 'Material Flow & Stage Status Map'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFa ? 'جهت بررسی متغیرهای فرآیندی و پکت‌های Modbus بر روی هر ایستگاه کلیک کنید' : 'Click on any station to inspect PLC registers, sensor values, and stage telemetry'}
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            {isFa ? 'ظرفیت خط: ۱۲۰ قطعه در ساعت' : 'Capacity: 120 pcs/hr'}
          </span>
        </div>

        {/* Horizontal Scrollable Station Nodes */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className="flex items-center gap-3 min-w-[1100px]">
            {stations.map((station, index) => {
              const isSelected = station.id === selectedStationId;
              const isWarning = station.status === 'warning';
              const isCritical = station.status === 'critical';

              return (
                <React.Fragment key={station.id}>
                  <div
                    onClick={() => {
                      industrialAudio.playClick();
                      setSelectedStationId(station.id);
                    }}
                    className={`cursor-pointer transition-all duration-200 relative p-3 rounded-xl border flex flex-col justify-between w-48 h-40 shrink-0 ${
                      isSelected 
                        ? 'bg-gradient-to-b from-cyan-950/60 to-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.03] z-10' 
                        : isCritical
                        ? 'bg-rose-950/30 border-rose-500/70 hover:border-rose-400'
                        : isWarning
                        ? 'bg-amber-950/30 border-amber-500/70 hover:border-amber-400'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/90'
                    }`}
                  >
                    {/* Badge / Number */}
                    <div className="flex items-center justify-between">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {station.number}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold flex items-center gap-1 ${
                        isCritical 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-400 animate-ping' : isWarning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        {station.status}
                      </span>
                    </div>

                    {/* Station Name */}
                    <div className="my-1.5">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {isFa ? station.nameFa : station.nameEn}
                      </h4>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {station.type}
                      </div>
                    </div>

                    {/* Quick Live Values */}
                    <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500">T:</span> <span className="text-amber-300">{station.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-slate-500">I:</span> <span className="text-cyan-300">{station.currentAmps}A</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Vib:</span> <span className={`${station.vibrationRms > 4 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>{station.vibrationRms}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rej:</span> <span className={`${station.rejectCount > 0 ? 'text-rose-300' : 'text-slate-400'}`}>{station.rejectCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  {index < stations.length - 1 && (
                    <div className="flex items-center text-slate-600 shrink-0">
                      <ArrowRight className="w-4 h-4 animate-pulse text-cyan-400/60" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Detail Inspector Section for Selected Station */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Station Telemetry & Controls */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  Stage {selectedStation.number} / 10
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedStation.modbusAddress}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {isFa ? selectedStation.nameFa : selectedStation.nameEn}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa ? selectedStation.descriptionFa : selectedStation.descriptionEn}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{isFa ? 'اپراتور:' : 'Operator:'}</span>
              <span className="text-xs font-semibold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {selectedStation.operator}
              </span>
            </div>
          </div>

          {/* 4 Big Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isFa ? 'دما' : 'Temperature'}</span>
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono text-amber-400">
                  {selectedStation.temperature}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">°C (PT100 RTD)</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedStation.temperature / 1000) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isFa ? 'سرعت دوران' : 'Velocity / RPM'}</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {selectedStation.rpm}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">RPM (Inverter Feedback)</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedStation.rpm / 3500) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isFa ? 'شدت جریان' : 'Motor Current'}</span>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono text-indigo-300">
                  {selectedStation.currentAmps}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Amperes (CT 100/5A)</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedStation.currentAmps / 100) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isFa ? 'ارتعاشات RMS' : 'Vibration RMS'}</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono ${selectedStation.vibrationRms > 4.5 ? 'text-rose-400' : 'text-purple-300'}`}>
                  {selectedStation.vibrationRms}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">mm/s (ISO 10816-3)</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${selectedStation.vibrationRms > 4.5 ? 'bg-rose-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min(100, (selectedStation.vibrationRms / 8) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fault Injection / Manual Control Playground */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              {isFa ? 'تزریق سناریوی خطا و تست‌های فیزیکی دوقلوی دیجیتال' : 'Fault Injection & Physical Hardware Diagnostics'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleTriggerRejectTest}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isFa ? 'تست جک پنوماتیک سورتینگ (Pshh)' : 'Test Pneumatic Eject'}</span>
              </button>

              <button
                onClick={() => handleInjectFault('bearing')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isFa ? 'تزریق لرزش بیرینگ اسپیندل' : 'Inject Bearing Wear'}</span>
              </button>

              <button
                onClick={() => handleInjectFault('temperature')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isFa ? 'تزریق اضافه دمای کوره' : 'Inject Furnace Overheat'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Industrial Protocol Inspector (Modbus / MQTT / OPC UA) */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                {isFa ? 'پکت‌های صنعتی و ثبات‌های PLC' : 'PLC Protocol Inspector'}
              </h3>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px] font-mono">
                <button
                  onClick={() => setActiveModbusView('registers')}
                  className={`px-2 py-0.5 rounded ${activeModbusView === 'registers' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  Modbus
                </button>
                <button
                  onClick={() => setActiveModbusView('coils')}
                  className={`px-2 py-0.5 rounded ${activeModbusView === 'coils' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  Coils
                </button>
                <button
                  onClick={() => setActiveModbusView('mqtt')}
                  className={`px-2 py-0.5 rounded ${activeModbusView === 'mqtt' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  MQTT
                </button>
              </div>
            </div>

            {/* Protocol View Content */}
            {activeModbusView === 'registers' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">40071 (L0_Measured):</span>
                  <span className="text-cyan-300 font-bold">428.45 mm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">40072 (OD_Measured):</span>
                  <span className="text-cyan-300 font-bold">148.12 mm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">40073 (Pitch_Dev):</span>
                  <span className="text-emerald-400 font-bold">+0.14 mm</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">40074 (AI_Confidence):</span>
                  <span className="text-purple-300 font-bold">98.7 %</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">40075 (Cycle_Time_ms):</span>
                  <span className="text-amber-300 font-bold">42 ms</span>
                </div>
              </div>
            )}

            {activeModbusView === 'coils' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">00001 (Line_Running):</span>
                  <span className="text-emerald-400 font-bold">TRUE (1)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">00002 (Pneumatic_Solenoid):</span>
                  <span className="text-slate-400 font-bold">IDLE (0)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">00003 (Laser_Profilometer_On):</span>
                  <span className="text-cyan-300 font-bold">ACTIVE (1)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">00004 (E-Stop_Healthy):</span>
                  <span className="text-emerald-400 font-bold">TRUE (1)</span>
                </div>
              </div>
            )}

            {activeModbusView === 'mqtt' && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1">
                <div className="text-slate-500">// Topic: factory/fanarlool/line1/vision</div>
                <div>{`{`}</div>
                <div className="pl-4 text-cyan-300">{`"part_id": "FL-2026-${simTick + 4000}",`}</div>
                <div className="pl-4 text-emerald-300">{`"status": "PASS",`}</div>
                <div className="pl-4 text-amber-300">{`"l0_mm": 428.45,`}</div>
                <div className="pl-4 text-purple-300">{`"od_mm": 148.12,`}</div>
                <div className="pl-4 text-slate-400">{`"timestamp": "${new Date().toISOString()}"`}</div>
                <div>{`}`}</div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              OPC-UA Server: 192.168.10.50
            </span>
            <span>Port: 4840</span>
          </div>
        </div>
      </div>
    </div>
  );
};
