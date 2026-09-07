import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { industrialAudio } from '../utils/soundEffects';
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Gauge, 
  Wrench, 
  Zap, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  Maximize2, 
  Eye, 
  Radio, 
  Sparkles, 
  ShieldAlert, 
  PlusCircle, 
  Check, 
  Filter, 
  FileText, 
  Sliders, 
  Box, 
  Truck, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Compass,
  CornerDownRight,
  Bell,
  BellRing,
  AlertOctagon,
  Volume2
} from 'lucide-react';

export interface SensorItem {
  id: string;
  nameFa: string;
  nameEn: string;
  type: 'vibration' | 'temperature' | 'vision' | 'current' | 'pressure' | 'speed' | 'laser';
  tag: string;
  model: string;
  locationFa: string;
  locationEn: string;
  value: number;
  unit: string;
  minSafe: number;
  maxSafe: number;
  samplingRate: string;
  calibrationDate: string;
  calibrationExpiry: string;
  health: number; // 0-100%
  status: 'normal' | 'warning' | 'critical';
}

export interface MaintenanceLog {
  id: string;
  workOrderNumber: string;
  stationId: string;
  type: 'pdm' | 'pm' | 'calibration' | 'repair' | 'tooling';
  titleFa: string;
  titleEn: string;
  date: string;
  technician: string;
  shift: 'A' | 'B' | 'C';
  status: 'completed' | 'in_progress' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  findingsFa: string;
  findingsEn: string;
  actionTakenFa: string;
  actionTakenEn: string;
  partsReplacedFa?: string[];
  partsReplacedEn?: string[];
  nextDueDate: string;
}

export interface FactoryFloorMapProps {
  lang: Language;
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  stations: Array<{
    id: string;
    number: number;
    nameFa: string;
    nameEn: string;
    status: 'running' | 'warning' | 'critical' | 'idle';
    temperature: number;
    rpm: number;
    currentAmps: number;
    vibrationRms: number;
    totalParts: number;
    rejectCount: number;
  }>;
  simTick: number;
  onTriggerAlarm?: (stationId: string, status: 'running' | 'warning' | 'critical') => void;
}

// ============================================================
// FRAMER-MOTION ANIMATED SVG SUBCOMPONENTS FOR MACHINE ZONES
// ============================================================

interface ZoneFootprintProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  isSelected: boolean;
  isCritical: boolean;
  isWarning: boolean;
  selectedColor?: string;
  defaultFill?: string;
  strokeDasharray?: string;
}

/**
 * Animated SVG Zone Footprint that pulses red or yellow when alarms trigger
 */
const ZoneFootprint: React.FC<ZoneFootprintProps> = ({
  x,
  y,
  width,
  height,
  rx = 8,
  isSelected,
  isCritical,
  isWarning,
  selectedColor = '#22d3ee',
  defaultFill = '#1e293b',
  strokeDasharray
}) => {
  const hasAlarm = isCritical || isWarning;
  const duration = isCritical ? 0.85 : 1.3;

  return (
    <g pointerEvents="none">
      {/* Pulsing Framer-Motion Background Rect */}
      <motion.rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        animate={
          isCritical
            ? {
                stroke: ['#ef4444', '#b91c1c', '#f87171', '#ef4444'],
                strokeWidth: [2.8, 5, 2.8],
                fill: ['#450a0a', '#7f1d1d', '#450a0a'],
                fillOpacity: [0.55, 0.9, 0.55],
              }
            : isWarning
            ? {
                stroke: ['#eab308', '#ca8a04', '#fde047', '#eab308'],
                strokeWidth: [2.2, 4.2, 2.2],
                fill: ['#422006', '#713f12', '#422006'],
                fillOpacity: [0.5, 0.85, 0.5],
              }
            : {
                stroke: isSelected ? selectedColor : '#475569',
                strokeWidth: isSelected ? 2.5 : 1,
                fill: isSelected ? '#0e7490' : defaultFill,
                fillOpacity: isSelected ? 0.35 : 0.7,
              }
        }
        transition={
          hasAlarm
            ? {
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : { duration: 0.25 }
        }
        strokeDasharray={hasAlarm ? 'none' : strokeDasharray}
        className={isCritical ? 'svg-alarm-critical' : isWarning ? 'svg-alarm-warning' : ''}
      />

      {/* Flashing Hazard Stripe Overlay when alarmed */}
      {hasAlarm && (
        <motion.rect
          x={x + 2}
          y={y + 2}
          width={width - 4}
          height={height - 4}
          rx={rx - 1}
          fill={isCritical ? 'url(#hazardPatternRed)' : 'url(#hazardPatternYellow)'}
          animate={{
            opacity: isCritical ? [0.2, 0.55, 0.2] : [0.15, 0.45, 0.15]
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </g>
  );
};

interface ZoneAlarmBeaconProps {
  x: number;
  y: number;
  isCritical: boolean;
  isWarning: boolean;
  zoneTag?: string;
}

/**
 * Pulsing Alarm Siren Beacon with radiating shockwaves & strobe
 */
const ZoneAlarmBeacon: React.FC<ZoneAlarmBeaconProps> = ({ x, y, isCritical, isWarning }) => {
  if (!isCritical && !isWarning) {
    return (
      <g transform={`translate(${x}, ${y})`} pointerEvents="none">
        <circle cx="0" cy="0" r="4.5" fill="#10b981" />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.6" className="animate-ping" />
      </g>
    );
  }

  const color = isCritical ? '#ef4444' : '#eab308';
  const colorLight = isCritical ? '#f87171' : '#fde047';
  const duration = isCritical ? 0.85 : 1.3;

  return (
    <g transform={`translate(${x}, ${y})`} pointerEvents="none">
      {/* Outer expanding shockwave 1 */}
      <motion.circle
        cx="0"
        cy="0"
        r="5"
        fill="none"
        stroke={color}
        animate={{
          r: [5, 26],
          opacity: [0.95, 0],
          strokeWidth: [2.8, 0.4]
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      />
      {/* Outer expanding shockwave 2 */}
      <motion.circle
        cx="0"
        cy="0"
        r="5"
        fill="none"
        stroke={colorLight}
        animate={{
          r: [5, 17],
          opacity: [0.85, 0],
          strokeWidth: [2.2, 0.4]
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeOut',
          delay: duration * 0.45
        }}
      />
      {/* Beacon housing & blinking core */}
      <motion.circle
        cx="0"
        cy="0"
        r="6.5"
        fill={color}
        animate={{
          scale: [1, 1.3, 1],
          filter: isCritical
            ? ['drop-shadow(0 0 3px #ef4444)', 'drop-shadow(0 0 12px #f87171)', 'drop-shadow(0 0 3px #ef4444)']
            : ['drop-shadow(0 0 3px #eab308)', 'drop-shadow(0 0 10px #fde047)', 'drop-shadow(0 0 3px #eab308)']
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      {/* Exclamation point inside beacon */}
      <path d="M 0 -3.2 L 0 0.8 M 0 2.4 L 0 2.8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
};

interface ZoneAlarmTagProps {
  x: number;
  y: number;
  isCritical: boolean;
  isWarning: boolean;
  isFa: boolean;
}

/**
 * Pulsing Alarm Tag Badge for inside zone
 */
const ZoneAlarmTag: React.FC<ZoneAlarmTagProps> = ({ x, y, isCritical, isWarning, isFa }) => {
  if (!isCritical && !isWarning) return null;
  const duration = isCritical ? 0.85 : 1.3;
  const colorBg = isCritical ? '#7f1d1d' : '#713f12';
  const colorBorder = isCritical ? '#ef4444' : '#eab308';
  const text = isCritical 
    ? (isFa ? '🚨 آلارم قرمز' : '🚨 CRITICAL') 
    : (isFa ? '⚠️ اخطار زرد' : '⚠️ WARNING');

  return (
    <motion.g
      transform={`translate(${x}, ${y})`}
      animate={{
        y: [0, -2.5, 0],
        scale: [1, 1.04, 1]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      pointerEvents="none"
    >
      <rect
        x="-38"
        y="-8"
        width="76"
        height="16"
        rx="3"
        fill={colorBg}
        stroke={colorBorder}
        strokeWidth="1.2"
      />
      <text
        x="0"
        y="3"
        fill="#ffffff"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {text}
      </text>
    </motion.g>
  );
};

export const FactoryFloorMap: React.FC<FactoryFloorMapProps> = ({
  lang,
  selectedStationId,
  onSelectStation,
  stations,
  simTick,
  onTriggerAlarm
}) => {
  const isFa = lang === 'fa';

  // Map view layers and filters
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showLogistics, setShowLogistics] = useState<boolean>(true);
  const [showThermalGlow, setShowThermalGlow] = useState<boolean>(false);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [viewPreset, setViewPreset] = useState<'all' | 'thermal' | 'machining' | 'qc'>('all');
  const [activeTab, setActiveTab] = useState<'sensors' | 'maintenance' | 'sop'>('sensors');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'in_progress' | 'completed' | 'scheduled'>('all');
  const [isAddingLogModal, setIsAddingLogModal] = useState<boolean>(false);

  // Form state for adding maintenance log
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogType, setNewLogType] = useState<'pdm' | 'pm' | 'calibration' | 'repair'>('pdm');
  const [newLogPriority, setNewLogPriority] = useState<'medium' | 'high' | 'critical'>('medium');
  const [newLogTech, setNewLogTech] = useState('مهندس سهرابی');
  const [newLogNotes, setNewLogNotes] = useState('');

  // Rich Sensor Inventory per Station
  const sensorsDatabase: Record<string, SensorItem[]> = useMemo(() => ({
    st1_dereeler: [
      {
        id: 'sn_1_1',
        nameFa: 'سنسور تنش کشش سیم مفتول (Load Cell)',
        nameEn: 'Wire Tension Load Cell',
        type: 'pressure',
        tag: 'WIT-0101',
        model: 'HBM U9C 20kN',
        locationFa: 'ورودی غلتک‌های کشش هادی',
        locationEn: 'Inlet guide pull roller',
        value: 14.8,
        unit: 'kN',
        minSafe: 8.0,
        maxSafe: 22.0,
        samplingRate: '1 kHz',
        calibrationDate: '1404/10/12',
        calibrationExpiry: '1405/10/12',
        health: 98,
        status: 'normal'
      },
      {
        id: 'sn_1_2',
        nameFa: 'سنسور سرعت خطی کلاف‌بازکن (Optical Encoder)',
        nameEn: 'Dereeler Linear Speed Encoder',
        type: 'speed',
        tag: 'SE-0102',
        model: 'Sick DFS60B',
        locationFa: 'محور اصلی درام کلاف‌بازکن',
        locationEn: 'Main payoff drum arbor',
        value: 120,
        unit: 'RPM',
        minSafe: 40,
        maxSafe: 180,
        samplingRate: '500 Hz',
        calibrationDate: '1404/08/20',
        calibrationExpiry: '1405/08/20',
        health: 95,
        status: 'normal'
      },
      {
        id: 'sn_1_3',
        nameFa: 'ترانسمیتر جریان موتور کشش مفتول',
        nameEn: 'Drive Motor Current Transducer',
        type: 'current',
        tag: 'IT-0103',
        model: 'LEM CT 100/5A Class 0.5',
        locationFa: 'تابلو درایو اینورتر زیمنس V20',
        locationEn: 'Siemens V20 inverter drive panel',
        value: 14.5,
        unit: 'A',
        minSafe: 5.0,
        maxSafe: 25.0,
        samplingRate: '100 Hz',
        calibrationDate: '1404/11/05',
        calibrationExpiry: '1405/11/05',
        health: 99,
        status: 'normal'
      }
    ],
    st2_coiler: [
      {
        id: 'sn_2_1',
        nameFa: 'شتاب‌سنج پیزوالکتریک لرزش کلگی لول‌کنی',
        nameEn: 'Coiling Head Vibration Accelerometer',
        type: 'vibration',
        tag: 'VT-0201',
        model: 'SKF CMSS 2200 Triaxial',
        locationFa: 'یاتاقان رولر فرم‌دهنده بیرونی',
        locationEn: 'Outer forming roller bearing',
        value: 2.18,
        unit: 'mm/s',
        minSafe: 0.5,
        maxSafe: 4.5,
        samplingRate: '10 kHz',
        calibrationDate: '1404/09/15',
        calibrationExpiry: '1405/09/15',
        health: 94,
        status: 'normal'
      },
      {
        id: 'sn_2_2',
        nameFa: 'ترموکوپل بدنه گیربکس سرووموتور وافیوس',
        nameEn: 'Servo Gearbox Thermocouple',
        type: 'temperature',
        tag: 'TT-0202',
        model: 'JUMO PT100 DIN Class A',
        locationFa: 'پوسته گیربکس محور گام Z',
        locationEn: 'Pitch axis Z planetary gearbox',
        value: 48.6,
        unit: '°C',
        minSafe: 20.0,
        maxSafe: 75.0,
        samplingRate: '50 Hz',
        calibrationDate: '1404/10/01',
        calibrationExpiry: '1405/10/01',
        health: 96,
        status: 'normal'
      },
      {
        id: 'sn_2_3',
        nameFa: 'سنسور لیزری نظارت بر گام لحظه‌ای فنر',
        nameEn: 'Dynamic Pitch Monitoring Laser',
        type: 'laser',
        tag: 'LT-0203',
        model: 'Keyence LK-G5000 High-Speed',
        locationFa: 'نازل خروجی سنبه لول‌کنی',
        locationEn: 'Coiling arbor discharge nozzle',
        value: 28.4,
        unit: 'mm',
        minSafe: 27.5,
        maxSafe: 29.5,
        samplingRate: '5 kHz',
        calibrationDate: '1404/11/18',
        calibrationExpiry: '1405/05/18',
        health: 99,
        status: 'normal'
      }
    ],
    st3_furnace: [
      {
        id: 'sn_3_1',
        nameFa: 'ترموکوپل پرتوپلاتین زون ۱ آستنیته (۸۸۵°C)',
        nameEn: 'Zone 1 Austenitizing Thermocouple (885°C)',
        type: 'temperature',
        tag: 'TE-0301',
        model: 'Type S Pt10%Rh-Pt Ceramic Tube',
        locationFa: 'تاج کوره زون ورودی مشعل‌ها',
        locationEn: 'Furnace roof burner combustion zone',
        value: 885.0,
        unit: '°C',
        minSafe: 860.0,
        maxSafe: 900.0,
        samplingRate: '10 Hz',
        calibrationDate: '1404/11/01',
        calibrationExpiry: '1405/05/01',
        health: 98,
        status: 'normal'
      },
      {
        id: 'sn_3_2',
        nameFa: 'سنسور دمای حمام روغن کوئنچ سریع',
        nameEn: 'Rapid Quench Oil Bath Thermocouple',
        type: 'temperature',
        tag: 'TE-0302',
        model: 'Type K Inconel Sheathed RTD',
        locationFa: 'کانال چرخش و مبدل حرارتی روغن',
        locationEn: 'Quench oil circulation agitator',
        value: 68.4,
        unit: '°C',
        minSafe: 50.0,
        maxSafe: 85.0,
        samplingRate: '10 Hz',
        calibrationDate: '1404/11/10',
        calibrationExpiry: '1405/05/10',
        health: 95,
        status: 'normal'
      },
      {
        id: 'sn_3_3',
        nameFa: 'آنالایزر پتانسیل کربن و گاز محافظ اتمسفر',
        nameEn: 'Endothermic Atmosphere Carbon Probe',
        type: 'pressure',
        tag: 'AE-0303',
        model: 'Zirconia Oxygen Probe Econox',
        locationFa: 'محفظه واکنش گاز محافظ آستنیته',
        locationEn: 'Atmosphere retort chamber',
        value: 0.62,
        unit: '%C',
        minSafe: 0.52,
        maxSafe: 0.68,
        samplingRate: '1 Hz',
        calibrationDate: '1404/10/25',
        calibrationExpiry: '1405/04/25',
        health: 92,
        status: 'normal'
      }
    ],
    st4_temper: [
      {
        id: 'sn_4_1',
        nameFa: 'ترموکوپل زون هوای گرم کوره برگشت (۴۳۵°C)',
        nameEn: 'Hot Air Recirculation Tempering Sensor',
        type: 'temperature',
        tag: 'TE-0401',
        model: 'JUMO Type K Class 1',
        locationFa: 'کانال هوای سیرکولاسیون فن سانتریفیوژ',
        locationEn: 'Recirculation fan ducting',
        value: 435.5,
        unit: '°C',
        minSafe: 420.0,
        maxSafe: 450.0,
        samplingRate: '10 Hz',
        calibrationDate: '1404/10/18',
        calibrationExpiry: '1405/04/18',
        health: 97,
        status: 'normal'
      },
      {
        id: 'sn_4_2',
        nameFa: 'سنسور لرزش الکتروموتور فن دمنده کوره تمپر',
        nameEn: 'Blower Fan Motor Vibration Sensor',
        type: 'vibration',
        tag: 'VT-0402',
        model: 'Hansford Sensors HS-100',
        locationFa: 'پایه بلبرینگ درایو فن گردش هوا',
        locationEn: 'Fan drive bearing support',
        value: 0.74,
        unit: 'mm/s',
        minSafe: 0.2,
        maxSafe: 3.5,
        samplingRate: '5 kHz',
        calibrationDate: '1404/09/20',
        calibrationExpiry: '1405/09/20',
        health: 99,
        status: 'normal'
      }
    ],
    st5_grinder: [
      {
        id: 'sn_5_1',
        nameFa: 'شتاب‌سنج فرکانس بالای اسپیندل سنگ‌زنی بالا',
        nameEn: 'Upper Spindle High-Freq Accelerometer',
        type: 'vibration',
        tag: 'VT-0501',
        model: 'IFM Electronic VSA001 Piezo',
        locationFa: 'هوزینگ بالایی اسپیندل سنگ CBN',
        locationEn: 'Upper CBN wheel spindle housing',
        value: 3.42,
        unit: 'mm/s',
        minSafe: 0.8,
        maxSafe: 4.8,
        samplingRate: '20 kHz',
        calibrationDate: '1404/10/05',
        calibrationExpiry: '1405/04/05',
        health: 87,
        status: 'normal'
      },
      {
        id: 'sn_5_2',
        nameFa: 'سنسور دمای روان‌ساز مایع سنگ‌زنی (Coolant)',
        nameEn: 'Grinding Coolant Temperature Sensor',
        type: 'temperature',
        tag: 'TT-0502',
        model: 'Endress+Hauser TMR35',
        locationFa: 'نازل‌های پاشش امولسیون صابون آب',
        locationEn: 'Emulsion flood manifold',
        value: 58.2,
        unit: '°C',
        minSafe: 25.0,
        maxSafe: 70.0,
        samplingRate: '10 Hz',
        calibrationDate: '1404/11/12',
        calibrationExpiry: '1405/11/12',
        health: 94,
        status: 'normal'
      },
      {
        id: 'sn_5_3',
        nameFa: 'ترانسمیتر بار توان الکتروموتورهای سنگ‌زن (Load kW)',
        nameEn: 'Grinding Spindle Power Monitor (kW)',
        type: 'current',
        tag: 'WT-0503',
        model: 'Load Controls UPC Power Cell',
        locationFa: 'مدار موتور ۳۰ کیلووات اسپیندل',
        locationEn: '30kW spindle motor breaker',
        value: 55.4,
        unit: 'A',
        minSafe: 20.0,
        maxSafe: 72.0,
        samplingRate: '200 Hz',
        calibrationDate: '1404/10/22',
        calibrationExpiry: '1405/10/22',
        health: 96,
        status: 'normal'
      }
    ],
    st6_shotpeen: [
      {
        id: 'sn_6_1',
        nameFa: 'سنسور فلومتر فلوی ساچمه‌های کروی S230',
        nameEn: 'Steel Shot Mass Flow Sensor',
        type: 'pressure',
        tag: 'FT-0601',
        model: 'MagnaValve VLP-1000',
        locationFa: 'شیر مغناطیسی تنظیم دبی ساچمه توربین',
        locationEn: 'Blast turbine magnetic feed valve',
        value: 18.5,
        unit: 'kg/min',
        minSafe: 15.0,
        maxSafe: 22.0,
        samplingRate: '100 Hz',
        calibrationDate: '1404/09/25',
        calibrationExpiry: '1405/03/25',
        health: 95,
        status: 'normal'
      },
      {
        id: 'sn_6_2',
        nameFa: 'تاکومتر دور توربین گریز از مرکز (RPM)',
        nameEn: 'Centrifugal Turbine Wheel Tachometer',
        type: 'speed',
        tag: 'ST-0602',
        model: 'Turck Inductive Proximity M12',
        locationFa: 'پره‌های پرتاب ساچمه توربین اصلی',
        locationEn: 'Primary blast wheel impeller',
        value: 3200,
        unit: 'RPM',
        minSafe: 2800,
        maxSafe: 3400,
        samplingRate: '1 kHz',
        calibrationDate: '1404/10/15',
        calibrationExpiry: '1405/10/15',
        health: 98,
        status: 'normal'
      }
    ],
    st7_scragging: [
      {
        id: 'sn_7_1',
        nameFa: 'ترانسدیوسر فشار هیدرولیک جک پیش‌نشست',
        nameEn: 'Hydraulic Ram Pressure Transducer',
        type: 'pressure',
        tag: 'PT-0701',
        model: 'WIKA S-20 400 Bar',
        locationFa: 'سیلندر اصلی پرس خزش',
        locationEn: 'Main setting hydraulic cylinder',
        value: 185,
        unit: 'Bar',
        minSafe: 140,
        maxSafe: 220,
        samplingRate: '500 Hz',
        calibrationDate: '1404/11/02',
        calibrationExpiry: '1405/05/02',
        health: 99,
        status: 'normal'
      },
      {
        id: 'sn_7_2',
        nameFa: 'خط‌کش دیجیتال کورس حرکت سنبه (LVDT)',
        nameEn: 'Linear Displacement Transducer (LVDT)',
        type: 'laser',
        tag: 'DT-0702',
        model: 'Novotechnik LWG 500mm',
        locationFa: 'رام متحرک پرس هیدرولیک',
        locationEn: 'Moving press platen slide',
        value: 245.2,
        unit: 'mm',
        minSafe: 210.0,
        maxSafe: 260.0,
        samplingRate: '1 kHz',
        calibrationDate: '1404/10/30',
        calibrationExpiry: '1405/04/30',
        health: 97,
        status: 'normal'
      }
    ],
    st8_vision: [
      {
        id: 'sn_8_1',
        nameFa: 'دوربین صنعتی باسلر 5MP GigE (Basler ace2)',
        nameEn: 'Basler 5MP GigE Vision Camera',
        type: 'vision',
        tag: 'CAM-0801',
        model: 'Basler a2A2600-20gmPRO Sony Pregius',
        locationFa: 'پایه اپتیکال عمودی با لنز تله‌سنتریک Sill',
        locationEn: 'Vertical arm with Sill telecentric lens',
        value: 60,
        unit: 'FPS',
        minSafe: 45,
        maxSafe: 65,
        samplingRate: 'Global Shutter',
        calibrationDate: '1404/11/20',
        calibrationExpiry: '1405/05/20',
        health: 100,
        status: 'normal'
      },
      {
        id: 'sn_8_2',
        nameFa: 'اسکنر لیزری سه‌بعدی پروفیل‌سنجی (Laser Sheet)',
        nameEn: '3D Laser Profilometer Scanner',
        type: 'laser',
        tag: 'LSR-0802',
        model: 'Keyence LJ-X8000 Blue Laser (405nm)',
        locationFa: 'تونل بازرسی ابعادی پیوسته',
        locationEn: 'Continuous dimensional inspection tunnel',
        value: 3200,
        unit: 'pts/line',
        minSafe: 2500,
        maxSafe: 3200,
        samplingRate: '16 kHz',
        calibrationDate: '1404/11/25',
        calibrationExpiry: '1405/05/25',
        health: 100,
        status: 'normal'
      },
      {
        id: 'sn_8_3',
        nameFa: 'سنسور دما و رطوبت اتاقک تمیز بینایی ماشین',
        nameEn: 'Vision Enclosure Climate Sensor',
        type: 'temperature',
        tag: 'TH-0803',
        model: 'Sensirion SHT35 Digital',
        locationFa: 'داخل محفظه ایزوله ضدگردوغبار',
        locationEn: 'Inside dust-tight camera enclosure',
        value: 28.4,
        unit: '°C',
        minSafe: 18.0,
        maxSafe: 35.0,
        samplingRate: '1 Hz',
        calibrationDate: '1404/09/10',
        calibrationExpiry: '1405/09/10',
        health: 99,
        status: 'normal'
      }
    ],
    st9_sorter: [
      {
        id: 'sn_9_1',
        nameFa: 'ترانسمیتر فشار هوای فشرده جک پنوماتیک',
        nameEn: 'Pneumatic System Pressure Sensor',
        type: 'pressure',
        tag: 'PT-0901',
        model: 'Festo SPAB-P10R-G18',
        locationFa: 'منیفولد شیر سلنوئیدی پرسرعت ایجکت',
        locationEn: 'High-speed reject solenoid valve manifold',
        value: 6.3,
        unit: 'Bar',
        minSafe: 5.5,
        maxSafe: 8.0,
        samplingRate: '50 Hz',
        calibrationDate: '1404/10/14',
        calibrationExpiry: '1405/04/14',
        health: 98,
        status: 'normal'
      },
      {
        id: 'sn_9_2',
        nameFa: 'سنسور نوری مادون قرمز عبور فنر در شوت ضایعات',
        nameEn: 'Reject Chute Optical Verification Sensor',
        type: 'speed',
        tag: 'PE-0902',
        model: 'Omron E3Z-T81 Through-Beam',
        locationFa: 'گلویی مخزن فنرهای معیوب قرنطینه',
        locationEn: 'Quarantine reject bin entry throat',
        value: 42,
        unit: 'Pcs',
        minSafe: 0,
        maxSafe: 500,
        samplingRate: '100 Hz',
        calibrationDate: '1404/11/01',
        calibrationExpiry: '1405/11/01',
        health: 99,
        status: 'normal'
      }
    ],
    st10_packaging: [
      {
        id: 'sn_10_1',
        nameFa: 'اسکنر بارکدخوان صنعتی تأیید ردیابی ساپکو',
        nameEn: 'SAPCO Traceability Barcode Imager',
        type: 'vision',
        tag: 'BC-1001',
        model: 'Cognex DataMan 280 Series',
        locationFa: 'هد بازوی لیبل‌چسبان روی پالت',
        locationEn: 'Pallet labeling arm applicator',
        value: 100,
        unit: '% Read',
        minSafe: 99,
        maxSafe: 100,
        samplingRate: '20 Hz',
        calibrationDate: '1404/11/05',
        calibrationExpiry: '1405/11/05',
        health: 100,
        status: 'normal'
      },
      {
        id: 'sn_10_2',
        nameFa: 'لودسل وزن‌کشی پالت نهایی قطعات سالم',
        nameEn: 'Pallet Weight Verification Load Cell',
        type: 'pressure',
        tag: 'WT-1002',
        model: 'Mettler Toledo Ring Torsion 2t',
        locationFa: 'صفحه گردان استرچ‌پالت‌پیچ',
        locationEn: 'Stretch wrapper turntable base',
        value: 642,
        unit: 'kg',
        minSafe: 200,
        maxSafe: 1200,
        samplingRate: '10 Hz',
        calibrationDate: '1404/10/10',
        calibrationExpiry: '1405/04/10',
        health: 97,
        status: 'normal'
      }
    ]
  }), []);

  // Initial Maintenance Logs with authentic industrial engineering context
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([
    {
      id: 'ml_1',
      workOrderNumber: 'WO-2026-084',
      stationId: 'st5_grinder',
      type: 'pm',
      titleFa: 'تعویض چرخ سنگ‌زنی CBN و بالانس دینامیکی اسپیندل',
      titleEn: 'CBN Grinding Wheel Replacement & Spindle Balancing',
      date: '۱۴۰۴/۱۲/۰۵',
      technician: 'احمد رمضانی / تکنسین مکانیک',
      shift: 'A',
      status: 'completed',
      priority: 'high',
      findingsFa: 'کاهش ضخامت لایه ساینده دیسک پایینی به کمتر از ۱.۵ میلیمتر و زبری سطح ۰.۸ میکرون.',
      findingsEn: 'Lower abrasive layer depleted below 1.5mm and surface roughness Ra reached 0.8um.',
      actionTakenFa: 'سنگ نو CBN نصب، گشتاور پیچ‌ها با تورک‌متر تا ۴۵ N.m سفت شد و با بالانسر Schenck ارتعاشات به زیر ۱.۲ mm/s رسید.',
      actionTakenEn: 'New CBN disk installed, torqued to 45 N.m, dynamic balancing reduced vibration to under 1.2 mm/s.',
      partsReplacedFa: ['دیسک سنگ سرامیکی CBN سایز ۴۵۰mm', 'رینگ آب‌بند وایتون محور اصلی'],
      partsReplacedEn: ['CBN Ceramic Grinding Disk 450mm', 'Viton Shaft Seal Ring'],
      nextDueDate: '۱۴۰۵/۰۳/۰۵'
    },
    {
      id: 'ml_2',
      workOrderNumber: 'WO-2026-112',
      stationId: 'st5_grinder',
      type: 'pdm',
      titleFa: 'پایش طیف فرکانسی ارتعاشات بیرینگ هوزینگ بالایی',
      titleEn: 'Upper Bearing Housing FFT Vibration Spectrum Audit',
      date: '۱۴۰۴/۱۲/۱۴',
      technician: 'مهندس سهرابی / تحلیل‌گر ارتعاشات',
      shift: 'A',
      status: 'in_progress',
      priority: 'critical',
      findingsFa: 'مشاهده پیک هارمونیک ۱۸۲ هرتز متناظر با BPFO (عیب رینگ خارجی) با دامنه ۳.۴۲ mm/s در بار کامل.',
      findingsEn: 'BPFO outer race frequency peak (182 Hz) detected at 3.42 mm/s RMS under full machining load.',
      actionTakenFa: 'تزریق گریس سینتتیک نسوز Kluber ISOFLEX NBU 15 و بازتنظیم پیش‌بار بلبرینگ‌های تماس زاویه‌ای.',
      actionTakenEn: 'Replenished Kluber ISOFLEX NBU 15 synthetic grease and recalibrated angular contact bearing preload.',
      partsReplacedFa: ['گریس تخصصی Kluber ISOFLEX (۵۰ گرم)'],
      partsReplacedEn: ['Kluber ISOFLEX Specialty Grease (50g)'],
      nextDueDate: '۱۴۰۵/۰۱/۲۰'
    },
    {
      id: 'ml_3',
      workOrderNumber: 'WO-2026-095',
      stationId: 'st8_vision',
      type: 'calibration',
      titleFa: 'کالیبراسیون تارگت اپتیکی و لنز تله‌سنتریک دوربین باسلر',
      titleEn: 'Basler Telecentric Optical Calibration & Target Verification',
      date: '۱۴۰۴/۱۲/۱۰',
      technician: 'مهندس حسینی / اتوماسیون ابتکار ویستا',
      shift: 'B',
      status: 'completed',
      priority: 'medium',
      findingsFa: 'انحراف جزئی ۰.۰۳ میلیمتری در لبه‌های میدان دید ناشی از ارتعاش خط نقاله.',
      findingsEn: 'Minor 0.03mm field distortion at outer FOV corners due to conveyor resonance.',
      actionTakenFa: 'کالیبراسیون ۹ نقطه‌ای با تارگت شطرنجی استاندارد سرامیکی ساپکو انجام شد و ضرایب ماتریس دوربین در نرم‌افزار به‌روزرسانی گردید.',
      actionTakenEn: '9-point calibration performed with SAPCO master ceramic grid; updated camera calibration matrix.',
      partsReplacedFa: ['فیلتر پولاریزه دایروی لنز تله‌سنتریک'],
      partsReplacedEn: ['Circular Polarizer Lens Filter'],
      nextDueDate: '۱۴۰۵/۰۶/۱۰'
    },
    {
      id: 'ml_4',
      workOrderNumber: 'WO-2026-128',
      stationId: 'st8_vision',
      type: 'pdm',
      titleFa: 'به‌روزرسانی مدل هوش مصنوعی تشخیص ترک سطحی (Deep Vision v2.4)',
      titleEn: 'AI Surface Micro-Crack Detection Model Update (v2.4)',
      date: '۱۴۰۴/۱۲/۱۸',
      technician: 'تیم هوش مصنوعی ابتکار ویستا',
      shift: 'A',
      status: 'scheduled',
      priority: 'medium',
      findingsFa: 'لزوم تطبیق مدل یادگیری عمیق با گرید جدید مفتول کروم-سیلیکون با بازتاب نوری بالاتر.',
      findingsEn: 'Model adaptation required for high-reflectivity chrome-silicon batch wire finish.',
      actionTakenFa: 'آماده‌سازی مجموعه داده ۲۰,۰۰۰ تصویر برچسب‌گذاری‌شده و تست صحت در کامپیوتر لبه صنعتی IPC.',
      actionTakenEn: 'Dataset of 20,000 labeled frames prepared for TensorRT edge acceleration test.',
      nextDueDate: '۱۴۰۴/۱۲/۲۸'
    },
    {
      id: 'ml_5',
      workOrderNumber: 'WO-2026-077',
      stationId: 'st3_furnace',
      type: 'repair',
      titleFa: 'تعویض ترموکوپل تیپ S زون ۱ و تنظیم مشعل رکوپراتیو کوره',
      titleEn: 'Zone 1 Type S Thermocouple Replacement & Recuperative Burner Tuning',
      date: '۱۴۰۴/۱۱/۲۵',
      technician: 'حسین نظری / سرپرست شیفت کوره',
      shift: 'A',
      status: 'completed',
      priority: 'high',
      findingsFa: 'دریفت دمایی +۱۲ درجه سانتیگراد در غلاف سرامیکی اکسید شده ترموکوپل قدیمی.',
      findingsEn: '+12°C temperature drift found due to oxidized ceramic protection tube.',
      actionTakenFa: 'سنسور پلاتین-رودیوم نو ساخت JUMO آلمان نصب شد و هوای احتراق با آنالایزر تستو روی لامبدا ۱.۰۵ تنظیم گردید.',
      actionTakenEn: 'New German JUMO Pt-Rh thermocouple installed and combustion lambda tuned to 1.05.',
      partsReplacedFa: ['ترموکوپل سرامیکی Type S طول ۶۰۰mm', 'واشر نسوز گرافیکی فلنج مشعل'],
      partsReplacedEn: ['Type S Ceramic Thermocouple 600mm', 'Graphite High-Temp Flange Gasket'],
      nextDueDate: '۱۴۰۵/۰۵/۲۵'
    },
    {
      id: 'ml_6',
      workOrderNumber: 'WO-2026-103',
      stationId: 'st3_furnace',
      type: 'pm',
      titleFa: 'لجن‌زدایی و فیلتراسیون تانک روغن کوئنچ سریع',
      titleEn: 'Quench Oil Tank Sludge Removal & 10-Micron Filtration',
      date: '۱۴۰۴/۱۲/۰۸',
      technician: 'واحد تاسیسات و سیالات',
      shift: 'C',
      status: 'completed',
      priority: 'medium',
      findingsFa: 'افزایش ویسکوزیته روغن کوئنچ هیدروترمیک بر اثر اکسیداسیون و ذرات پوسته اکسیدی.',
      findingsEn: 'Quench oil kinematic viscosity increased slightly due to scale fine particles.',
      actionTakenFa: 'فیلتراسیون با دستگاه پرتابل ۱۰ میکرون انجام شد و نمونه جهت آزمایش سرعت سرمایش به آزمایشگاه متالورژی ارسال گردید.',
      actionTakenEn: 'Offline 10-micron filtration conducted and sample sent to lab for cooling curve evaluation.',
      nextDueDate: '۱۴۰۵/۰۲/۰۸'
    },
    {
      id: 'ml_7',
      workOrderNumber: 'WO-2026-091',
      stationId: 'st2_coiler',
      type: 'tooling',
      titleFa: 'تعویض سنبه فرم‌دهی تنگستن کارباید و بازرسی لقی گیربکس وافیوس',
      titleEn: 'Tungsten Carbide Coiling Mandrel Tooling & Backlash Inspection',
      date: '۱۴۰۴/۱۲/۰۲',
      technician: 'مهندس کاظمی / اپراتور ارشد CNC',
      shift: 'A',
      status: 'completed',
      priority: 'medium',
      findingsFa: 'سایش میکرونی روی سنبه فرم‌دهی گام ۳ که موجب خط افتادن روی پوسته مفتول می‌شد.',
      findingsEn: 'Micro-scratches on variable pitch mandrel causing fine wire surface indentations.',
      actionTakenFa: 'سنبه پولیش‌شده تنگستن کارباید نو گرید YG8 نصب شد و خطای قطری فنر به زیر ۰.۱mm رسید.',
      actionTakenEn: 'Brand-new mirror-polished YG8 tungsten carbide mandrel installed; OD error reduced under 0.1mm.',
      partsReplacedFa: ['سنبه فرم‌دهی فنر مارپیچ تنگستن کارباید', 'غلتک هدایت مفتول'],
      partsReplacedEn: ['Tungsten Carbide Forming Mandrel', 'Precision Wire Feed Roller'],
      nextDueDate: '۱۴۰۵/۰۳/۰۲'
    },
    {
      id: 'ml_8',
      workOrderNumber: 'WO-2026-119',
      stationId: 'st9_sorter',
      type: 'pdm',
      titleFa: 'سرویس سیل‌های جک پنوماتیک فستو و تنظیم رگلاتور باد سورتینگ',
      titleEn: 'Festo Pneumatic Cylinder Seals & Regulator Overhaul',
      date: '۱۴۰۴/۱۲/۱۲',
      technician: 'مرتضی قربانی / نگهداری و تعمیرات',
      shift: 'B',
      status: 'completed',
      priority: 'low',
      findingsFa: 'افت جزئی فشار تا ۵.۲ بار هنگام کارکرد پیوسته با نرخ ۱۲۰ شلیک در ساعت.',
      findingsEn: 'Transient pressure dip to 5.2 bar during rapid cyclic bursts at 120 shots/hr.',
      actionTakenFa: 'اورینگ‌های سیلندر Festo تعویض و مخزن رزرو ثانویه ۱۰ لیتری باد در کنار جک ایجکتور نصب گردید.',
      actionTakenEn: 'Festo cylinder O-rings renewed and local 10L air accumulator installed next to ejector.',
      partsReplacedFa: ['کیت اورینگ و پکینگ فستو سایز DNC-50', 'شیلنگ پلی‌یورتان ۱۰mm فشار قوی'],
      partsReplacedEn: ['Festo Seal Overhaul Kit DNC-50', 'Reinforced 10mm Polyurethane Hose'],
      nextDueDate: '۱۴۰۵/۰۶/۱۲'
    }
  ]);

  // Selected station data
  const currentStation = stations.find(s => s.id === selectedStationId) || stations[7];
  const stationSensors = sensorsDatabase[selectedStationId] || [
    {
      id: 'default_sn',
      nameFa: 'سنسور پایش دیجیتال چندمنظوره',
      nameEn: 'Multipurpose Digital IO Sensor',
      type: 'temperature',
      tag: 'PLC-DI-01',
      model: 'Siemens SM1221',
      locationFa: 'تابلو کنترل خط',
      locationEn: 'Line control cabinet',
      value: 24.5,
      unit: '°C',
      minSafe: 10,
      maxSafe: 60,
      samplingRate: '100 Hz',
      calibrationDate: '1404/10/01',
      calibrationExpiry: '1405/10/01',
      health: 98,
      status: 'normal'
    }
  ];

  const stationLogs = useMemo(() => {
    return maintenanceLogs.filter(log => {
      const matchesStation = log.stationId === selectedStationId;
      if (!matchesStation) return false;
      if (maintenanceFilter === 'all') return true;
      return log.status === maintenanceFilter;
    });
  }, [maintenanceLogs, selectedStationId, maintenanceFilter]);

  const handleSelectZone = (stationId: string) => {
    industrialAudio.playClick();
    onSelectStation(stationId);
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim()) return;

    industrialAudio.playPassChime();
    const newLog: MaintenanceLog = {
      id: `ml_${Date.now()}`,
      workOrderNumber: `WO-2026-${Math.floor(130 + Math.random() * 50)}`,
      stationId: selectedStationId,
      type: newLogType,
      titleFa: newLogTitle,
      titleEn: newLogTitle,
      date: new Date().toLocaleDateString('fa-IR'),
      technician: newLogTech,
      shift: 'A',
      status: 'in_progress',
      priority: newLogPriority,
      findingsFa: newLogNotes || 'ثبت‌شده در شیفت جاری دوقلوی دیجیتال.',
      findingsEn: newLogNotes || 'Logged during active digital twin shift.',
      actionTakenFa: 'سفارش کار ارجاع شد به شیفت مکانیک و برق جهت پیگیری فوری.',
      actionTakenEn: 'Work order dispatched to electrical and mechanical maintenance teams.',
      nextDueDate: '۱۴۰۵/۰۱/۱۵'
    };

    setMaintenanceLogs(prev => [newLog, ...prev]);
    setIsAddingLogModal(false);
    setNewLogTitle('');
    setNewLogNotes('');
  };

  // Alarm state management for animated zones
  const [alarmOverrides, setAlarmOverrides] = useState<Record<string, 'running' | 'warning' | 'critical'>>({});

  const getZoneStatus = (stationId: string): 'running' | 'warning' | 'critical' | 'idle' => {
    if (alarmOverrides[stationId]) {
      return alarmOverrides[stationId];
    }
    const st = stations.find(s => s.id === stationId);
    return st?.status || 'running';
  };

  const handleToggleZoneAlarm = (stationId: string) => {
    const currentStatus = getZoneStatus(stationId);
    let nextStatus: 'running' | 'warning' | 'critical';
    if (currentStatus === 'running' || currentStatus === 'idle') {
      nextStatus = 'warning';
      industrialAudio.playAlarmSiren();
    } else if (currentStatus === 'warning') {
      nextStatus = 'critical';
      industrialAudio.playAlarmSiren();
    } else {
      nextStatus = 'running';
      industrialAudio.playPassChime();
    }
    
    setAlarmOverrides(prev => ({ ...prev, [stationId]: nextStatus }));
    if (onTriggerAlarm) {
      onTriggerAlarm(stationId, nextStatus);
    }
  };

  const handleSetZoneAlarm = (stationId: string, status: 'running' | 'warning' | 'critical') => {
    if (status === 'critical' || status === 'warning') {
      industrialAudio.playAlarmSiren();
    } else {
      industrialAudio.playPassChime();
    }
    setAlarmOverrides(prev => ({ ...prev, [stationId]: status }));
    if (onTriggerAlarm) {
      onTriggerAlarm(stationId, status);
    }
  };

  const handleClearAllAlarms = () => {
    industrialAudio.playPassChime();
    const resetMap: Record<string, 'running' | 'warning' | 'critical'> = {};
    stations.forEach(s => {
      resetMap[s.id] = 'running';
      if (onTriggerAlarm) {
        onTriggerAlarm(s.id, 'running');
      }
    });
    setAlarmOverrides(resetMap);
  };

  const activeAlarms = useMemo(() => {
    return stations.map(s => ({
      id: s.id,
      number: s.number,
      nameFa: s.nameFa,
      nameEn: s.nameEn,
      status: getZoneStatus(s.id),
    })).filter(s => s.status === 'critical' || s.status === 'warning');
  }, [stations, alarmOverrides]);

  const zoneBoundsMap: Record<string, { x: number; y: number; width: number; height: number }> = {
    st1_dereeler: { x: 40, y: 50, width: 100, height: 100 },
    st2_coiler: { x: 170, y: 50, width: 110, height: 100 },
    st3_furnace: { x: 320, y: 40, width: 150, height: 120 },
    st4_temper: { x: 500, y: 40, width: 150, height: 120 },
    st5_grinder: { x: 530, y: 225, width: 130, height: 130 },
    st6_shotpeen: { x: 360, y: 235, width: 120, height: 115 },
    st7_scragging: { x: 200, y: 235, width: 110, height: 115 },
    st8_vision: { x: 510, y: 390, width: 120, height: 120 },
    st9_sorter: { x: 690, y: 395, width: 100, height: 115 },
    st10_packaging: { x: 850, y: 390, width: 130, height: 125 },
  };

  // Preset Views for the SVG Canvas
  const presetBounds = {
    all: '0 0 1100 600',
    thermal: '180 50 550 400',
    machining: '400 150 500 380',
    qc: '680 180 420 380'
  };

  return (
    <div className="space-y-6">
      {/* Interactive SVG Floor Map Container Card */}
      <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        {/* Map Header and Visual Overlays Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {isFa ? 'نقشه تعاملی سالن تولید و چیدمان استقرار ماشین‌آلات' : 'Interactive Factory Floor Plan & Machine Footprint'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    Iran Coil Spring Co. (سوله اصلی)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFa 
                    ? 'روی هر زون یا ایستگاه کلیک کنید تا وضعیت سنسورها و لاگ‌های تعمیرات همان تجهیز باز شود' 
                    : 'Click on any zone or machine footprint to inspect live telemetry and active maintenance work orders'}
                </p>
              </div>
            </div>
          </div>

          {/* Map Layer Toggles & View Zoom Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewPreset('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewPreset === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isFa ? 'کل کارخانه' : 'Full Floor'}
              </button>
              <button
                onClick={() => setViewPreset('thermal')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewPreset === 'thermal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isFa ? 'زون کوره‌ها' : 'Furnace Bay'}
              </button>
              <button
                onClick={() => setViewPreset('machining')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewPreset === 'machining' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isFa ? 'سنگ‌زنی و شات‌پین' : 'Machining'}
              </button>
              <button
                onClick={() => setViewPreset('qc')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewPreset === 'qc' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isFa ? 'دروازه هوش مصنوعی' : 'AI QC Gate'}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSensors(!showSensors)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showSensors 
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isFa ? 'سنسورها' : 'Sensors'}</span>
              </button>

              <button
                onClick={() => setShowLogistics(!showLogistics)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showLogistics 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isFa ? 'مسیر AGV' : 'AGV Track'}</span>
              </button>

              <button
                onClick={() => setShowThermalGlow(!showThermalGlow)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  showThermalGlow 
                    ? 'bg-rose-950/60 border-rose-500/50 text-rose-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isFa ? 'نقشه حرارتی' : 'Thermal'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alarm Status & Framer-Motion Pulse Simulation Bar */}
        <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 shadow-inner">
          {/* Active Alarms Indicator */}
          <div className="flex items-center gap-3">
            {activeAlarms.length > 0 ? (
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                      {isFa
                        ? `${activeAlarms.length} زون در وضعیت آلارم فعال:`
                        : `${activeAlarms.length} Zone(s) with Active Pulsing Alarm:`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activeAlarms.map(a => (
                      <button
                        key={a.id}
                        onClick={() => handleSelectZone(a.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                          a.status === 'critical'
                            ? 'bg-rose-950/90 text-rose-200 border border-rose-500/60 hover:bg-rose-900 shadow-sm shadow-rose-900/50 animate-pulse'
                            : 'bg-amber-950/90 text-amber-200 border border-amber-500/60 hover:bg-amber-900'
                        }`}
                      >
                        <span>{a.status === 'critical' ? '🚨 پالس قرمز' : '⚠️ پالس زرد'}</span>
                        <span>Z-0{a.number}</span>
                        <span>({isFa ? a.nameFa.split(' ')[0] : a.nameEn.split(' ')[0]})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">
                  {isFa
                    ? 'وضعیت تمامی ۱۰ زون کارخانه: عادی و ایمن (جهت مشاهده انیمیشن پالس، دکمه‌های تست را کلیک کنید)'
                    : 'All 10 Machine Zones Normal (Click Pulse Test buttons below to simulate Framer-Motion Alarms)'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Simulation Triggers & Zone Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto justify-end">
            <span className="text-[11px] text-slate-400 font-medium ml-1">
              {isFa ? 'تست پالس Framer-Motion:' : 'Pulse Test:'}
            </span>
            
            {/* Red Pulse Trigger 1 (Furnace) */}
            <button
              onClick={() => handleSetZoneAlarm('st3_furnace', 'critical')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 transition-all active:scale-95"
              title={isFa ? 'تحریک آلارم قرمز در کوره (دمای ۹۱۵°C)' : 'Trigger Red Pulse Alarm on Furnace (Z-03)'}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{isFa ? 'پالس قرمز (کوره Z-03)' : 'Red Pulse (Furnace)'}</span>
            </button>

            {/* Red Pulse Trigger 2 (Grinder) */}
            <button
              onClick={() => handleSetZoneAlarm('st5_grinder', 'critical')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 flex items-center gap-1.5 transition-all active:scale-95"
              title={isFa ? 'تحریک آلارم قرمز در سنگ‌زنی (ارتعاش ۵.۸mm/s)' : 'Trigger Red Pulse Alarm on Grinder (Z-05)'}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{isFa ? 'پالس قرمز (سنگ‌زنی Z-05)' : 'Red Pulse (Grinder)'}</span>
            </button>

            {/* Yellow Pulse Trigger 1 (Coiler) */}
            <button
              onClick={() => handleSetZoneAlarm('st2_coiler', 'warning')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition-all active:scale-95"
              title={isFa ? 'تحریک اخطار زرد در لول‌کنی CNC (انحراف گام)' : 'Trigger Yellow Pulse Warning on CNC (Z-02)'}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{isFa ? 'پالس زرد (لول‌کنی Z-02)' : 'Yellow (CNC)'}</span>
            </button>

            {/* Yellow Pulse Trigger 2 (Vision) */}
            <button
              onClick={() => handleSetZoneAlarm('st8_vision', 'warning')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition-all active:scale-95"
              title={isFa ? 'تحریک اخطار زرد در بینایی ماشین (خطای تلرانس)' : 'Trigger Yellow Pulse Warning on Vision (Z-08)'}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{isFa ? 'پالس زرد (بینایی Z-08)' : 'Yellow (Vision)'}</span>
            </button>

            {/* Reset All Alarms */}
            {activeAlarms.length > 0 && (
              <button
                onClick={handleClearAllAlarms}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 flex items-center gap-1 transition-all active:scale-95"
                title={isFa ? 'عادی‌سازی و خاموش کردن همه آلارم‌ها' : 'Reset and clear all zone alarms'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isFa ? 'ریست آلارم‌ها' : 'Reset All'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 10-Zone Interactive Status Quick Bar */}
        <div className="mt-2 px-1 flex flex-wrap items-center gap-1 text-[11px] font-mono">
          <span className="text-slate-500 text-[10px] ml-1">
            {isFa ? 'انتخاب و تحریک دستی زون‌ها:' : 'Zone Quick Toggle:'}
          </span>
          {stations.map(st => {
            const zStatus = getZoneStatus(st.id);
            const isSelected = selectedStationId === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleSelectZone(st.id)}
                onDoubleClick={() => handleToggleZoneAlarm(st.id)}
                title={isFa ? `کلیک برای انتخاب | دابل‌کلیک برای تغییر وضعیت آلارم (${zStatus})` : `Click to select | Double click to cycle alarm (${zStatus})`}
                className={`px-2 py-0.5 rounded flex items-center gap-1.5 border transition-all ${
                  zStatus === 'critical'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : zStatus === 'warning'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                    : isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    zStatus === 'critical'
                      ? 'bg-rose-400 animate-ping'
                      : zStatus === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>Z{st.number < 10 ? `0${st.number}` : st.number}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleZoneAlarm(st.id);
                  }}
                  className="hover:scale-125 transition-transform cursor-pointer opacity-75 hover:opacity-100"
                  title={isFa ? 'تغییر وضعیت آلارم این زون (عادی -> زرد -> قرمز)' : 'Cycle zone alarm status'}
                >
                  {zStatus === 'critical' ? '🔴' : zStatus === 'warning' ? '🟡' : '🟢'}
                </span>
              </button>
            );
          })}
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative mt-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80">
          {/* Subtle Grid Coordinates Overlay */}
          <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-500 pointer-events-none z-10 flex items-center gap-3">
            <span>GRID: HALL-B (54SiCr6 AUTOMOTIVE LINE)</span>
            <span>SCALE: 1:50 METRIC</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              CONVEYOR RUNNING
            </span>
          </div>

          <svg
            viewBox={presetBounds[viewPreset]}
            className="w-full h-auto max-h-[520px] select-none transition-all duration-700 ease-out"
            style={{ minHeight: '380px' }}
          >
            <defs>
              {/* CSS Animations for Framer-Motion & SVG Elements */}
              <style>{`
                @keyframes svgPulseRed {
                  0%, 100% {
                    filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.75)) drop-shadow(0 0 16px rgba(220, 38, 38, 0.4));
                    opacity: 0.85;
                  }
                  50% {
                    filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)) drop-shadow(0 0 36px rgba(220, 38, 38, 0.85));
                    opacity: 1;
                  }
                }
                @keyframes svgPulseYellow {
                  0%, 100% {
                    filter: drop-shadow(0 0 4px rgba(234, 179, 8, 0.65)) drop-shadow(0 0 12px rgba(202, 138, 4, 0.35));
                    opacity: 0.85;
                  }
                  50% {
                    filter: drop-shadow(0 0 16px rgba(234, 179, 8, 0.95)) drop-shadow(0 0 28px rgba(202, 138, 4, 0.75));
                    opacity: 1;
                  }
                }
                .svg-alarm-critical {
                  animation: svgPulseRed 0.95s infinite ease-in-out;
                }
                .svg-alarm-warning {
                  animation: svgPulseYellow 1.35s infinite ease-in-out;
                }
              `}</style>

              {/* Gradients */}
              <linearGradient id="wallGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="conveyorBelt" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              <linearGradient id="furnaceFlame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#991b1b" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="laserBeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
              </linearGradient>

              {/* Glowing Filters */}
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glowRedAlarm" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="glowYellowAlarm" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Hazard Patterns for Safety and Alarm Areas */}
              <pattern id="hazardPattern" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="8" height="16" fill="#f59e0b" fillOpacity="0.15" />
                <rect x="8" y="0" width="8" height="16" fill="#0f172a" />
              </pattern>

              <pattern id="hazardPatternRed" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="8" height="16" fill="#ef4444" fillOpacity="0.3" />
                <rect x="8" y="0" width="8" height="16" fill="#450a0a" fillOpacity="0.8" />
              </pattern>

              <pattern id="hazardPatternYellow" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="8" height="16" fill="#eab308" fillOpacity="0.3" />
                <rect x="8" y="0" width="8" height="16" fill="#422006" fillOpacity="0.8" />
              </pattern>

              <pattern id="conveyorRollers" width="14" height="20" patternUnits="userSpaceOnUse">
                <line x1="2" y1="0" x2="2" y2="20" stroke="#64748b" strokeWidth="1.5" />
              </pattern>

              {/* Floor Tile Grid */}
              <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.6" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* Background Factory Floor Canvas */}
            <rect x="0" y="0" width="1100" height="600" fill="#090d16" />
            <rect x="0" y="0" width="1100" height="600" fill="url(#floorGrid)" />

            {/* Architectural Concrete Factory Outer Wall */}
            <rect x="15" y="15" width="1070" height="570" fill="none" stroke="#334155" strokeWidth="3" rx="10" />
            
            {/* Structural Column Grid (A1 to D4) */}
            {[70, 320, 570, 820, 1030].map((cx, i) => (
              <g key={`col-top-${i}`}>
                <rect x={cx - 8} y="15" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
                <text x={cx} y="27" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  C{i + 1}
                </text>
              </g>
            ))}
            {[70, 320, 570, 820, 1030].map((cx, i) => (
              <g key={`col-bot-${i}`}>
                <rect x={cx - 8} y="569" width="16" height="16" fill="#475569" stroke="#64748b" strokeWidth="1" />
              </g>
            ))}

            {/* Safety Walkways & Pedestrian Paths (Green / Yellow dashed) */}
            {showLogistics && (
              <g id="safety_logistics_layer">
                {/* Forklift / AGV Route */}
                <path
                  d="M 30 180 L 220 180 L 220 530 L 1050 530 L 1050 360"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.5"
                />
                <text x="540" y="522" fill="#ca8a04" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  AGV LOGISTICS PATHWAY (AUTOMATED COIL & PALLET TRANSPORT)
                </text>

                {/* Pedestrian Safe Walkway */}
                <rect x="25" y="30" width="60" height="120" fill="url(#hazardPattern)" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
                <text x="55" y="95" fill="#fcd34d" fontSize="8" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 55 95)">
                  STORAGE BAY
                </text>
              </g>
            )}

            {/* ============================================================ */}
            {/* THE CONTINUOUS MATERIAL CONVEYOR LINE (U-SHAPE / S-SHAPE)     */}
            {/* Connects from Station 1 to 10 in manufacturing flow sequence  */}
            {/* ============================================================ */}
            <g id="conveyor_transport_line">
              {/* Wire feed line to Coiler */}
              <path d="M 120 100 L 180 100" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
              {/* Coiler to Furnace */}
              <path d="M 270 100 L 330 100" stroke="url(#conveyorBelt)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 270 100 L 330 100" stroke="url(#conveyorRollers)" strokeWidth="10" />
              {/* Austempering to Tempering */}
              <path d="M 460 100 L 510 100" stroke="url(#conveyorBelt)" strokeWidth="14" strokeLinecap="round" />
              {/* Tempering to Grinder (Curve downwards) */}
              <path d="M 640 100 L 720 100 Q 770 100 770 160 L 770 230 Q 770 290 720 290 L 650 290" fill="none" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* Grinder to Shot Peening */}
              <path d="M 540 290 L 470 290" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* Shot Peening to Scragging */}
              <path d="M 370 290 L 300 290" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* Scragging to AI Vision (Turns down and right) */}
              <path d="M 210 290 Q 150 290 150 350 L 150 410 Q 150 450 210 450 L 350 450 L 520 450" fill="none" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* AI Vision to Sorter */}
              <path d="M 620 450 L 700 450" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* Sorter to Packaging (OK path) */}
              <path d="M 780 450 L 870 450" stroke="url(#conveyorBelt)" strokeWidth="14" />
              {/* Sorter to Quarantine Bin (NG path downward) */}
              <path d="M 740 460 L 740 500" stroke="#f43f5e" strokeWidth="8" strokeDasharray="3 3" />

              {/* Animated Moving Springs on the Conveyor */}
              <g id="animated_springs">
                {/* Spring tokens moving along track */}
                <circle cx={290 + (simTick % 5) * 6} cy="100" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx={480 + (simTick % 4) * 6} cy="100" r="5" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />
                <circle cx={760} cy={130 + (simTick % 6) * 15} r="5" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
                <circle cx={500 - (simTick % 5) * 6} cy="290" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx={340 - (simTick % 5) * 6} cy="290" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx={420 + (simTick % 5) * 12} cy="450" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx={650 + (simTick % 4) * 8} cy="450" r="5" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
              </g>
            </g>

            {/* Thermal Glow Heatmap (Optional Toggle) */}
            {showThermalGlow && (
              <g id="thermal_heatmap_glow" opacity="0.6">
                <circle cx="395" cy="100" r="85" fill="#f97316" filter="url(#glowAmber)" opacity="0.35" />
                <circle cx="575" cy="100" r="70" fill="#f59e0b" filter="url(#glowAmber)" opacity="0.25" />
              </g>
            )}

            {/* ============================================================ */}
            {/* 10 INTERACTIVE MACHINE ZONES                                  */}
            {/* ============================================================ */}

            {/* ZONE 1: Raw Wire & Descaling Bay */}
            {/* ZONE 1: Wire Dereeler & Descaling Station */}
            {(() => {
              const zoneId = 'st1_dereeler';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st1"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={40}
                    y={50}
                    width={100}
                    height={100}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#22d3ee"
                    strokeDasharray={isSel ? 'none' : '4 2'}
                  />

                  {/* Machine Graphic: Wire Dereeler Drum & Rollers */}
                  <circle cx="85" cy="100" r="28" fill="#334155" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#64748b'} strokeWidth="2" />
                  <circle cx="85" cy="100" r="16" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                  <circle cx="85" cy="100" r="6" fill={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#0284c7'} />
                  {/* Descaling rollers */}
                  <rect x="112" y="88" width="16" height="24" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="112" y1="96" x2="128" y2="96" stroke="#f8fafc" strokeWidth="1.5" />
                  <line x1="112" y1="104" x2="128" y2="104" stroke="#f8fafc" strokeWidth="1.5" />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={128} y={62} isCritical={isCrit} isWarning={isWarn} />

                  {/* Text Label & Alarm Badge */}
                  <text x="90" y="70" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-01</text>
                  <text x="90" y="142" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">کلاف‌بازکن</text>
                  <ZoneAlarmTag x={90} y={118} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 2: CNC Coiling Bay (Wafios) */}
            {(() => {
              const zoneId = 'st2_coiler';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st2"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={170}
                    y={50}
                    width={110}
                    height={100}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#22d3ee"
                  />

                  {/* CNC Machine Body */}
                  <rect x="185" y="65" width="80" height="70" rx="4" fill="#1e293b" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#38bdf8'} strokeWidth="1.5" />
                  {/* CNC Screen & Spindle */}
                  <rect x="192" y="72" width="26" height="20" rx="2" fill={isCrit ? '#7f1d1d' : '#0284c7'} fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1" />
                  <circle cx="242" cy="100" r="14" fill="#334155" stroke="#f1f5f9" strokeWidth="1.5" />
                  <path d="M 234 94 Q 242 106 250 94" fill="none" stroke={isCrit ? '#ef4444' : isWarn ? '#facc15' : '#facc15'} strokeWidth="2.5" />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={268} y={62} isCritical={isCrit} isWarning={isWarn} />

                  <text x="225" y="62" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-02</text>
                  <text x="225" y="142" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">لول‌کنی CNC</text>
                  <ZoneAlarmTag x={225} y={120} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 3: Austempering & Quench Furnace */}
            {(() => {
              const zoneId = 'st3_furnace';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st3"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={320}
                    y={40}
                    width={150}
                    height={120}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#f97316"
                    defaultFill="#1e293b"
                  />

                  {/* Furnace Tunnel Body */}
                  <rect x="330" y="60" width="90" height="80" rx="4" fill="#33180c" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#f97316'} strokeWidth="1.5" />
                  {/* Heating Elements Glow */}
                  <rect x="338" y="72" width="74" height="40" rx="2" fill="url(#furnaceFlame)" />
                  {/* Quench Oil Tank at exit */}
                  <rect x="424" y="70" width="38" height="65" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
                  <path d="M 428 95 Q 443 85 458 95" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="443" y="115" fill="#38bdf8" fontSize="7" textAnchor="middle">کوئنچ روغن</text>

                  {/* Temperature Live Tag */}
                  <rect x="345" y="46" width="60" height="14" rx="3" fill="#000" fillOpacity="0.7" stroke={isCrit ? '#ef4444' : '#ea580c'} strokeWidth="0.8" />
                  <text x="375" y="56" fill={isCrit ? '#f87171' : '#fed7aa'} fontSize="8" fontFamily="monospace" textAnchor="middle">
                    {isCrit ? '۹۱۵°C (CRIT)' : '۸۸۵°C (HOT)'}
                  </text>

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={458} y={52} isCritical={isCrit} isWarning={isWarn} />

                  <text x="395" y="148" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">کوره آستنمپرینگ و کوئنچ</text>
                  <ZoneAlarmTag x={375} y={108} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 4: Tempering & Stress Relief Furnace */}
            {(() => {
              const zoneId = 'st4_temper';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st4"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={500}
                    y={40}
                    width={150}
                    height={120}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#eab308"
                    defaultFill="#1e293b"
                  />

                  <rect x="515" y="60" width="120" height="75" rx="4" fill="#2d2208" stroke={isCrit ? '#ef4444' : isWarn ? '#facc15' : '#eab308'} strokeWidth="1.5" />
                  <rect x="525" y="75" width="100" height="35" rx="2" fill="#ca8a04" fillOpacity="0.3" stroke="#fde047" strokeWidth="1" strokeDasharray="3 2" />

                  <rect x="535" y="46" width="60" height="14" rx="3" fill="#000" fillOpacity="0.7" stroke={isCrit ? '#ef4444' : '#eab308'} strokeWidth="0.8" />
                  <text x="565" y="56" fill={isCrit ? '#f87171' : '#fef08a'} fontSize="8" fontFamily="monospace" textAnchor="middle">۴۳۵°C تمپر</text>

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={638} y={52} isCritical={isCrit} isWarning={isWarn} />

                  <text x="575" y="148" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">کوره برگشت و تنش‌زدایی</text>
                  <ZoneAlarmTag x={575} y={108} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 5: OMD Dual-End Grinder */}
            {(() => {
              const zoneId = 'st5_grinder';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st5"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={530}
                    y={225}
                    width={130}
                    height={130}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#818cf8"
                    defaultFill="#1e293b"
                  />

                  {/* Rotary Grinding Carousel Plate */}
                  <circle cx="595" cy="285" r="38" fill="#1e1b4b" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#818cf8'} strokeWidth="2" />
                  {/* Dual grinding heads */}
                  <rect x="560" y="270" width="30" height="30" rx="3" fill="#312e81" stroke="#c7d2fe" strokeWidth="1.5" />
                  <rect x="600" y="270" width="30" height="30" rx="3" fill="#312e81" stroke="#c7d2fe" strokeWidth="1.5" />
                  <circle cx="575" cy="285" r="6" fill={isCrit ? '#ef4444' : '#f43f5e'} />
                  <circle cx="615" cy="285" r="6" fill={isCrit ? '#ef4444' : '#f43f5e'} />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={645} y={238} isCritical={isCrit} isWarning={isWarn} />

                  <text x="595" y="242" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-05</text>
                  <text x="595" y="345" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">سنگ‌زنی دوسر OMD</text>
                  <ZoneAlarmTag x={595} y={325} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 6: High-Velocity Shot Peening Chamber */}
            {(() => {
              const zoneId = 'st6_shotpeen';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st6"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={360}
                    y={235}
                    width={120}
                    height={115}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#22d3ee"
                  />

                  {/* Blast Cabinet Octagonal shape */}
                  <polygon points="385,255 455,255 470,290 455,325 385,325 370,290" fill="#0f172a" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#06b6d4'} strokeWidth="1.5" />
                  <circle cx="420" cy="290" r="16" fill="#164e63" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 2" />
                  {/* Impeller blades */}
                  <line x1="420" y1="278" x2="420" y2="302" stroke="#67e8f9" strokeWidth="2" />
                  <line x1="408" y1="290" x2="432" y2="290" stroke="#67e8f9" strokeWidth="2" />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={468} y={246} isCritical={isCrit} isWarning={isWarn} />

                  <text x="420" y="250" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-06</text>
                  <text x="420" y="340" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">شات‌پینینگ S230</text>
                  <ZoneAlarmTag x={420} y={320} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 7: Hot Scragging Press */}
            {(() => {
              const zoneId = 'st7_scragging';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st7"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={200}
                    y={235}
                    width={110}
                    height={115}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#22d3ee"
                  />

                  {/* Hydraulic press column & ram */}
                  <rect x="220" y="250" width="70" height="85" rx="3" fill="#0f172a" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#64748b'} strokeWidth="1.5" />
                  <rect x="240" y="255" width="30" height="25" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                  {/* Hydraulic Ram Platen */}
                  <rect x="230" y="280" width="50" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  <text x="255" y="315" fill="#38bdf8" fontSize="7" textAnchor="middle">پرس خزش</text>

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={298} y={246} isCritical={isCrit} isWarning={isWarn} />

                  <text x="255" y="248" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-07</text>
                  <text x="255" y="340" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">پیش‌نشست</text>
                  <ZoneAlarmTag x={255} y={320} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 8: AI Basler Vision & Laser Metrology Gate (HIGHLIGHT ZONE) */}
            {(() => {
              const zoneId = 'st8_vision';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st8"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={510}
                    y={390}
                    width={120}
                    height={120}
                    rx={10}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#10b981"
                    defaultFill="#1e293b"
                  />

                  {/* Optical Inspection Tunnel */}
                  <rect x="525" y="415" width="90" height="70" rx="4" fill="#022c22" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#10b981'} strokeWidth="1.5" />
                  {/* Basler Camera Icon Top Mount */}
                  <rect x="555" y="402" width="30" height="18" rx="2" fill={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#10b981'} stroke="#f8fafc" strokeWidth="1" />
                  <circle cx="570" cy="411" r="5" fill="#042f2e" stroke="#6ee7b7" strokeWidth="1" />
                  {/* Laser Line Scanning Downwards */}
                  <polygon points="560,420 580,420 605,475 535,475" fill="url(#laserBeam)" />
                  <line x1="535" y1="475" x2="605" y2="475" stroke={isCrit ? '#f87171' : isWarn ? '#fde047' : '#38bdf8'} strokeWidth="2" className="animate-pulse" />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={618} y={402} isCritical={isCrit} isWarning={isWarn} />

                  <text x="570" y="408" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-08</text>
                  <text x="570" y="500" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#a7f3d0'} fontSize="8.5" fontWeight="bold" textAnchor="middle">بینایی ماشین Basler</text>
                  <ZoneAlarmTag x={570} y={450} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 9: Pneumatic Sorter & Quarantine Chute */}
            {(() => {
              const zoneId = 'st9_sorter';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st9"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={690}
                    y={395}
                    width={100}
                    height={115}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#f43f5e"
                    defaultFill="#1e293b"
                  />

                  {/* Pneumatic cylinder arm */}
                  <rect x="710" y="420" width="50" height="20" rx="3" fill="#1e293b" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#f43f5e'} strokeWidth="1.5" />
                  <rect x="735" y="425" width="35" height="10" fill={isCrit ? '#ef4444' : '#fb7185'} />
                  {/* Quarantine Reject Bin Below */}
                  <rect x="715" y="475" width="50" height="28" rx="2" fill="#4c0519" stroke={isCrit ? '#ef4444' : '#f43f5e'} strokeWidth="1" />
                  <text x="740" y="492" fill="#fda4af" fontSize="7" textAnchor="middle">سبد ضایعات NG</text>

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={778} y={406} isCritical={isCrit} isWarning={isWarn} />

                  <text x="740" y="410" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-09</text>
                  <text x="740" y="520" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">سورتینگ پنوماتیک</text>
                  <ZoneAlarmTag x={740} y={455} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* ZONE 10: Automated Packaging & SAPCO Barcoding */}
            {(() => {
              const zoneId = 'st10_packaging';
              const zStatus = getZoneStatus(zoneId);
              const isCrit = zStatus === 'critical';
              const isWarn = zStatus === 'warning';
              const isSel = selectedStationId === zoneId;
              return (
                <g
                  id="zone_st10"
                  className="cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
                  onClick={() => handleSelectZone(zoneId)}
                  onMouseEnter={() => setHoveredZoneId(zoneId)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <ZoneFootprint
                    x={850}
                    y={390}
                    width={130}
                    height={125}
                    rx={8}
                    isSelected={isSel}
                    isCritical={isCrit}
                    isWarning={isWarn}
                    selectedColor="#34d399"
                    defaultFill="#1e293b"
                  />

                  {/* Pallet with boxed spring parts */}
                  <rect x="870" y="420" width="70" height="50" fill="#134e4a" stroke={isCrit ? '#ef4444' : isWarn ? '#eab308' : '#2dd4bf'} strokeWidth="1.5" />
                  {/* Wooden Pallet Base */}
                  <rect x="865" y="470" width="80" height="12" fill="#78350f" stroke="#b45309" strokeWidth="1" />
                  {/* QR Barcode icon */}
                  <rect x="915" y="425" width="20" height="20" fill="#f8fafc" />
                  <rect x="919" y="429" width="4" height="4" fill="#000" />
                  <rect x="927" y="429" width="4" height="4" fill="#000" />
                  <rect x="919" y="437" width="4" height="4" fill="#000" />

                  {/* Pulsing Alarm Beacon Top Corner */}
                  <ZoneAlarmBeacon x={968} y={402} isCritical={isCrit} isWarning={isWarn} />

                  <text x="915" y="410" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">Z-10</text>
                  <text x="915" y="505" fill={isCrit ? '#fca5a5' : isWarn ? '#fde047' : '#cbd5e1'} fontSize="8.5" textAnchor="middle">بسته‌بندی و بارکد ساپکو</text>
                  <ZoneAlarmTag x={915} y={455} isCritical={isCrit} isWarning={isWarn} isFa={isFa} />
                </g>
              );
            })()}

            {/* Central SCADA & IPC Edge Server Room (Top Right) */}
            <g id="scada_control_room">
              <rect x="830" y="50" width="220" height="140" rx="8" fill="#090d16" stroke="#0ea5e9" strokeWidth="1.5" />
              <rect x="840" y="60" width="200" height="24" rx="4" fill="#0284c7" fillOpacity="0.2" />
              <text x="940" y="76" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                اتاق مانیتورینگ مرکزی و سرور لبه IPC
              </text>
              {/* Multi-monitor video wall */}
              <rect x="850" y="95" width="50" height="32" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <rect x="905" y="95" width="50" height="32" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <rect x="960" y="95" width="50" height="32" rx="2" fill="#0f172a" stroke="#a855f7" strokeWidth="1" />
              {/* Rack cabinet */}
              <rect x="1015" y="95" width="22" height="75" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <circle cx="1026" cy="105" r="2" fill="#10b981" />
              <circle cx="1026" cy="115" r="2" fill="#38bdf8" />
              <circle cx="1026" cy="125" r="2" fill="#38bdf8" />
              <circle cx="1026" cy="135" r="2" fill="#f59e0b" />

              <text x="930" y="165" fill="#94a3b8" fontSize="8" textAnchor="middle">
                Siemens S7-1500 + Advantech IPC
              </text>
            </g>

            {/* SENSORS OVERLAY BADGES (Hover or Toggle) */}
            {showSensors && (
              <g id="sensors_overlay_layer">
                {/* Z1 Sensor */}
                <g transform="translate(130, 85)">
                  <rect width="68" height="18" rx="3" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
                  <text x="34" y="12" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">WIT 14.8kN</text>
                </g>
                {/* Z2 Sensor */}
                <g transform="translate(230, 115)">
                  <rect width="76" height="18" rx="3" fill="#020617" stroke="#22d3ee" strokeWidth="1" />
                  <text x="38" y="12" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle">VIB 2.18 mm/s</text>
                </g>
                {/* Z3 Sensor */}
                <g transform="translate(370, 115)">
                  <rect width="70" height="18" rx="3" fill="#020617" stroke="#f97316" strokeWidth="1" />
                  <text x="35" y="12" fill="#f97316" fontSize="8" fontFamily="monospace" textAnchor="middle">TE 885.0°C</text>
                </g>
                {/* Z5 Sensor */}
                <g transform="translate(635, 275)">
                  <rect width="74" height="18" rx="3" fill="#020617" stroke="#818cf8" strokeWidth="1" />
                  <text x="37" y="12" fill="#818cf8" fontSize="8" fontFamily="monospace" textAnchor="middle">VIB 3.42 mm/s</text>
                </g>
                {/* Z8 Sensor */}
                <g transform="translate(565, 375)">
                  <rect width="80" height="18" rx="3" fill="#020617" stroke="#10b981" strokeWidth="1" />
                  <text x="40" y="12" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle">BASLER 60FPS</text>
                </g>
                {/* Z9 Sensor */}
                <g transform="translate(730, 375)">
                  <rect width="72" height="18" rx="3" fill="#020617" stroke="#f43f5e" strokeWidth="1" />
                  <text x="36" y="12" fill="#f43f5e" fontSize="8" fontFamily="monospace" textAnchor="middle">AIR 6.3 Bar</text>
                </g>
              </g>
            )}

            {/* Dynamic Selection Crosshair / Brackets on Selected Zone */}
            {selectedStationId && zoneBoundsMap[selectedStationId] && (() => {
              const bounds = zoneBoundsMap[selectedStationId];
              const bx = bounds.x - 4;
              const by = bounds.y - 4;
              const bw = bounds.width + 8;
              const bh = bounds.height + 8;
              const zStatus = getZoneStatus(selectedStationId);
              const bracketColor = zStatus === 'critical'
                ? '#ef4444'
                : zStatus === 'warning'
                ? '#eab308'
                : '#06b6d4';
              return (
                <motion.g
                  id={`selection_brackets_${selectedStationId}`}
                  pointerEvents="none"
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d={`M ${bx} ${by} L ${bx + 14} ${by} M ${bx} ${by} L ${bx} ${by + 14}`} stroke={bracketColor} strokeWidth="2.5" fill="none" />
                  <path d={`M ${bx + bw} ${by} L ${bx + bw - 14} ${by} M ${bx + bw} ${by} L ${bx + bw} ${by + 14}`} stroke={bracketColor} strokeWidth="2.5" fill="none" />
                  <path d={`M ${bx} ${by + bh} L ${bx + 14} ${by + bh} M ${bx} ${by + bh} L ${bx} ${by + bh - 14}`} stroke={bracketColor} strokeWidth="2.5" fill="none" />
                  <path d={`M ${bx + bw} ${by + bh} L ${bx + bw - 14} ${by + bh} M ${bx + bw} ${by + bh} L ${bx + bw} ${by + bh - 14}`} stroke={bracketColor} strokeWidth="2.5" fill="none" />
                </motion.g>
              );
            })()}
          </svg>
        </div>

        {/* Quick legend footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              {isFa ? 'عادی / در حال تولید' : 'Normal / Running'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              {isFa ? 'هشدار حرارتی یا ارتعاش' : 'Warning Level'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              {isFa ? 'توقف / تفکیک ضایعات' : 'Reject / Eject'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            {isFa 
              ? 'راهنما: جهت جابجایی بین بخش‌ها روی ایستگاه‌های نقشه کلیک کنید' 
              : 'Hint: Click on any station zone above to display its sensor inventory'}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DETAILED SENSOR STATUS & ACTIVE MAINTENANCE LOGS PANEL       */}
      {/* ============================================================ */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6">
        {/* Selected Station Banner & Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
                Zone {currentStation.number} of 10
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentStation.id}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1 flex items-center gap-2">
              {isFa ? currentStation.nameFa : currentStation.nameEn}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
          </div>

          {/* Tab Switcher: Sensors vs Maintenance Logs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                industrialAudio.playClick();
                setActiveTab('sensors');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'sensors'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isFa ? 'سنسورهای نصب‌شده و تلمتری' : 'Active Sensors'}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {stationSensors.length}
              </span>
            </button>

            <button
              onClick={() => {
                industrialAudio.playClick();
                setActiveTab('maintenance');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'maintenance'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>{isFa ? 'لاگ‌های تعمیرات و نگهداری (PdM)' : 'Maintenance Logs'}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {stationLogs.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: DETAILED SENSOR STATUS */}
        {activeTab === 'sensors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                {isFa 
                  ? `فهرست سنسورهای پایش بلادرنگ و اینسترومنت‌های ایستگاه ${currentStation.nameFa}` 
                  : `Real-time Sensor Suite for ${currentStation.nameEn}`}
              </h4>
              <span className="text-xs font-mono text-slate-400">
                PLC Bus: Profinet / Modbus TCP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stationSensors.map((sensor) => {
                const safePercent = Math.min(100, Math.max(0, ((sensor.value - sensor.minSafe) / (sensor.maxSafe - sensor.minSafe)) * 100));

                return (
                  <div 
                    key={sensor.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold text-cyan-400">{sensor.tag}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sensor.samplingRate}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {isFa ? sensor.nameFa : sensor.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {sensor.model}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isFa ? sensor.locationFa : sensor.locationEn}
                      </div>
                    </div>

                    {/* Value Reading Gauge */}
                    <div className="pt-2 border-t border-slate-900">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">{isFa ? 'مقدار لحظه‌ای:' : 'Value:'}</span>
                        <span className="text-2xl font-black font-mono text-cyan-300">
                          {sensor.value} <span className="text-xs font-normal text-slate-400">{sensor.unit}</span>
                        </span>
                      </div>

                      {/* Bar Gauge */}
                      <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${safePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>Min: {sensor.minSafe}</span>
                        <span>Max: {sensor.maxSafe} {sensor.unit}</span>
                      </div>
                    </div>

                    {/* Calibration & Health Status */}
                    <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {isFa ? `سلامت: ${sensor.health}٪` : `Health: ${sensor.health}%`}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {isFa ? `انقضا: ${sensor.calibrationExpiry}` : `Exp: ${sensor.calibrationExpiry}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE MAINTENANCE LOGS & WORK ORDERS */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isFa ? 'فیلتر وضعیت:' : 'Filter Status:'}</span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setMaintenanceFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      maintenanceFilter === 'all' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isFa ? 'همه' : 'All'}
                  </button>
                  <button
                    onClick={() => setMaintenanceFilter('in_progress')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      maintenanceFilter === 'in_progress' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isFa ? 'در حال اقدام' : 'In Progress'}
                  </button>
                  <button
                    onClick={() => setMaintenanceFilter('completed')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      maintenanceFilter === 'completed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isFa ? 'تکمیل‌شده' : 'Completed'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  industrialAudio.playClick();
                  setIsAddingLogModal(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-all shadow-lg shadow-cyan-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isFa ? 'ثبت سفارش کار تعمیراتی جدید' : 'New Work Order'}</span>
              </button>
            </div>

            {/* List of Maintenance Cards */}
            <div className="space-y-3">
              {stationLogs.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                  {isFa 
                    ? 'هیچ رکورد تعمیراتی در این دسته‌بندی برای این ایستگاه ثبت نشده است.' 
                    : 'No active maintenance logs found matching this filter.'}
                </div>
              ) : (
                stationLogs.map((log) => {
                  const isCompleted = log.status === 'completed';
                  const isInProgress = log.status === 'in_progress';

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                            {log.workOrderNumber}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            log.priority === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                            log.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {log.priority}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {log.type.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className={`flex items-center gap-1 font-bold ${
                            isCompleted ? 'text-emerald-400' :
                            isInProgress ? 'text-amber-400' :
                            'text-slate-400'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {isCompleted ? (isFa ? 'تکمیل‌شده' : 'Completed') : (isFa ? 'در حال اقدام' : 'In Progress')}
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-400">{log.date}</span>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-bold text-white">
                          {isFa ? log.titleFa : log.titleEn}
                        </h5>
                        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">
                              {isFa ? 'مشاهدات فنی و شواهد خرابی:' : 'Diagnostic Findings:'}
                            </span>
                            <span className="text-slate-300">
                              {isFa ? log.findingsFa : log.findingsEn}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">
                              {isFa ? 'اقدامات انجام‌شده / اصلاحی:' : 'Actions Taken:'}
                            </span>
                            <span className="text-emerald-300">
                              {isFa ? log.actionTakenFa : log.actionTakenEn}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Info: Parts & Tech */}
                      <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{log.technician} (شیفت {log.shift})</span>
                        </div>

                        {log.partsReplacedFa && log.partsReplacedFa.length > 0 && (
                          <div className="flex items-center gap-1.5 font-mono text-slate-300">
                            <span className="text-slate-500">{isFa ? 'قطعات مصرفی:' : 'Parts:'}</span>
                            <span>{(isFa ? log.partsReplacedFa : log.partsReplacedEn)?.join('، ')}</span>
                          </div>
                        )}

                        <div className="text-slate-500 font-mono">
                          {isFa ? `سرویس آتی: ${log.nextDueDate}` : `Next PM: ${log.nextDueDate}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW WORK ORDER */}
      {isAddingLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                {isFa ? 'ثبت سفارش کار تعمیراتی جدید (Work Order)' : 'Dispatch New Work Order'}
              </h3>
              <button
                onClick={() => setIsAddingLogModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isFa ? 'ایستگاه مربوطه:' : 'Target Machine:'}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
                  {currentStation.nameFa} ({currentStation.nameEn})
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isFa ? 'عنوان اقدام تعمیراتی / شرح وظیفه:' : 'Task Title / Action Description:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFa ? 'مثال: روان‌کاری و بازرسی چشمی بلبرینگ‌های هوزینگ' : 'e.g. Bearing lubrication & seal inspection'}
                  value={newLogTitle}
                  onChange={(e) => setNewLogTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isFa ? 'دسته‌بندی:' : 'Category:'}
                  </label>
                  <select
                    value={newLogType}
                    onChange={(e) => setNewLogType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="pdm">{isFa ? 'پیش‌بینانه (PdM)' : 'Predictive (PdM)'}</option>
                    <option value="pm">{isFa ? 'پیشگیرانه دوره‌ای (PM)' : 'Preventive (PM)'}</option>
                    <option value="calibration">{isFa ? 'کالیبراسیون و ابزار دقیق' : 'Calibration'}</option>
                    <option value="repair">{isFa ? 'تعمیر اضطراری' : 'Emergency Repair'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isFa ? 'اولویت فوریت:' : 'Priority:'}
                  </label>
                  <select
                    value={newLogPriority}
                    onChange={(e) => setNewLogPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="medium">{isFa ? 'متوسط (عادی)' : 'Medium'}</option>
                    <option value="high">{isFa ? 'بالا (تا ۲۴ ساعت)' : 'High (24h)'}</option>
                    <option value="critical">{isFa ? 'بحرانی (فوری)' : 'Critical (Immediate)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isFa ? 'تکنسین / کارشناس مسئول:' : 'Assigned Technician:'}
                </label>
                <input
                  type="text"
                  value={newLogTech}
                  onChange={(e) => setNewLogTech(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isFa ? 'توضیحات و شواهد فنی:' : 'Technical Notes & Observations:'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isFa ? 'توضیحات مربوط به نویز غیرعادی، دمای غیرمجاز یا نتیجه پایش ارتعاشات...' : 'Vibration spectrum details, temperature readings, abnormal noises...'}
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-semibold"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/25"
                >
                  {isFa ? 'ثبت و ابلاغ سفارش کار' : 'Dispatch Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
