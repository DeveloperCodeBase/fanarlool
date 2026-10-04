// Legacy screens retain their original contract; production uses platform/i18n.Language.
export type Language = 'fa' | 'en';

export type TabId = 
  | 'landing'
  | 'digital_twin'
  | 'module1_vision'
  | 'module2_profilometry'
  | 'module3_central_qc'
  | 'module4_pdm'
  | 'module5_oee'
  | 'module6_energy'
  | 'metallurgy_lab'
  | 'quality_certificate'
  | 'live_camera'
  | 'engineering_tools'
  | 'factory_scada'
  | 'spc_control'
  | 'roi_calculator'
  | 'user_guide'
  | 'proposals_roadmap';

export interface PlantAlarm {
  id: string;
  timestamp: string;
  machineId: string;
  machineNameFa: string;
  machineNameEn: string;
  stageNumber: number;
  severity: 'critical' | 'major' | 'minor' | 'info';
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  recommendedActionFa: string;
  recommendedActionEn: string;
  acknowledged: boolean;
}

export interface ChemicalComposition {
  element: string;
  symbol: string;
  minVal: number;
  maxVal: number;
  actualVal: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
}

export type UserRole = 
  | 'general_manager'       // مدیر ارشد کارخانه
  | 'qc_engineer'          // مهندس کنترل کیفیت و بینایی ماشین
  | 'maintenance_lead'      // سرپرست نگهداری و تعمیرات پیش‌بینانه
  | 'energy_supervisor'     // سرپرست انرژی و تأسیسات
  | 'guest';               // بازدیدکننده مهمان

export interface UserProfile {
  id: string;
  nameFa: string;
  nameEn: string;
  role: UserRole;
  roleTitleFa: string;
  roleTitleEn: string;
  departmentFa: string;
  departmentEn: string;
  avatar: string;
}

export interface SpringPhysicalSpec {
  id: string;
  modelName: string;
  application: string; // e.g., 'IKCO Tara Front Suspension' / 'پژو ۲۰۶ جلو'
  material: string;    // e.g., '54SiCr6 Alloy Steel'
  wireDiameter_d: number;      // mm (e.g. 12.5)
  meanDiameter_D: number;      // mm (e.g. 120.0)
  outerDiameter_Do: number;    // mm (e.g. 132.5)
  freeLength_L0: number;       // mm (e.g. 380.0)
  totalCoils_nt: number;       // (e.g. 7.5)
  activeCoils_na: number;      // (e.g. 5.5)
  shearModulus_G: number;      // MPa (78500)
  nominalRate_k: number;       // N/mm
  solidHeight_Hs: number;      // mm
  maxLoad_F: number;           // N (e.g. 6500)
  designedDeflection_s: number;// mm
}

export interface SpringDefect {
  id: string;
  nameFa: string;
  nameEn: string;
  type: 'crack' | 'decarburization' | 'scratch' | 'coating' | 'pitch' | 'squareness';
  confidence: number;
  severity: 'minor' | 'moderate' | 'critical';
  boundingBox: { x: number; y: number; width: number; height: number }; // percentages
  descriptionFa: string;
  descriptionEn: string;
  recommendationFa: string;
}

export interface DimensionalMeasurement {
  parameterFa: string;
  parameterEn: string;
  nominal: number;
  actual: number;
  minTol: number;
  maxTol: number;
  unit: string;
  status: 'pass' | 'warning' | 'fail';
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  partModel: string;
  batchNumber: string;
  lineId: string;
  status: 'pass' | 'reject' | 'rework';
  dimensions: DimensionalMeasurement[];
  defects: SpringDefect[];
  cycleTimeMs: number;
  ejectorTriggered: boolean;
}

export interface MachineTelemetry {
  id: string;
  nameFa: string;
  nameEn: string;
  stageNumber: number;
  category: 'feed' | 'coiling' | 'furnace' | 'quench' | 'grinding' | 'shotpeening' | 'scragging' | 'coating' | 'inspection';
  status: 'normal' | 'warning' | 'critical' | 'maintenance';
  healthScore: number; // 0 to 100
  rulHours: number; // Remaining Useful Life in operating hours
  vibrationRms: number; // mm/s
  vibrationPeakFreq: number; // Hz
  temperatureC: number;
  motorCurrentAmps: number;
  acousticDb: number;
  rpm: number;
  operatingHours: number;
  lastServiceDate: string;
  predictedFailureComponentFa: string;
  predictedFailureComponentEn: string;
  sensorAlertFa?: string;
}

export interface OeeMetric {
  lineId: string;
  lineNameFa: string;
  lineNameEn: string;
  availability: number; // percentage
  performance: number; // percentage
  quality: number; // percentage
  oee: number; // percentage
  targetOutput: number;
  actualOutput: number;
  goodCount: number;
  rejectCount: number;
  scrapRate: number; // percentage
  shift: string;
  mtbfHours: number;
  mttrMinutes: number;
}

export interface DowntimeEvent {
  id: string;
  lineId: string;
  reasonFa: string;
  reasonEn: string;
  category: 'mechanical' | 'electrical' | 'setup' | 'material' | 'operator';
  durationMinutes: number;
  impactLostPieces: number;
  timestamp: string;
}

export interface EnergyMetric {
  timestamp: string;
  totalPowerKw: number;
  furnaceGasM3Hour: number;
  compressedAirM3Min: number;
  compressedAirPressureBar: number;
  powerFactor: number;
  lineCostTomanPerHour: number;
  specificEnergyPerTon: number; // kWh/ton
  co2EmissionsKgHour: number;
  anomaliesDetected: number;
}

export interface AiModelItem {
  id: string;
  name: string;
  version: string;
  architecture: string;
  taskFa: string;
  taskEn: string;
  accuracy: number;
  f1Score: number;
  latencyMs: number;
  deployedLines: string[];
  status: 'active' | 'evaluating' | 'deprecated';
  lastUpdated: string;
  datasetSamples: number;
}

export interface WorkOrder {
  id: string;
  machineId: string;
  machineNameFa: string;
  machineNameEn: string;
  titleFa: string;
  titleEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  issuedAt: string;
  dueAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTeamFa: string;
  assignedTo?: string;
  reasonFa: string;
  sensorTrigger: string;
  sparePartsNeeded?: string[];
  estimatedDurationHours?: number;
}

export interface PlantBenchmark {
  plantId: string;
  plantNameFa: string;
  plantNameEn: string;
  locationFa: string;
  totalTonnageMonth: number;
  averageOee: number;
  scrapRate: number;
  energyPerTon: number;
  pdmHealthIndex: number;
  connectivityStatus: 'online' | 'warning' | 'offline';
}
