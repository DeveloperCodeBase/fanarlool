import { 
  SpringPhysicalSpec, 
  MachineTelemetry, 
  OeeMetric, 
  EnergyMetric, 
  AiModelItem, 
  WorkOrder, 
  PlantBenchmark,
  UserProfile,
  InspectionRecord
} from './types';

// Spring catalog manufactured by Iran Coil Spring Co.
export const SPRING_MODELS: SpringPhysicalSpec[] = [
  {
    id: 'SP-IKCO-TARA-F',
    modelName: 'فنر لول جلو تارا و پژو ۳۰۱ (IKCO Tara Front)',
    application: 'سیستم تعلیق مک‌فرسون جلو خودرو تارا و دنا پلاس',
    material: 'فولاد آلیاژی 54SiCr6 (سختی 50-54 HRC)',
    wireDiameter_d: 12.8,
    meanDiameter_D: 124.0,
    outerDiameter_Do: 136.8,
    freeLength_L0: 385.0,
    totalCoils_nt: 6.8,
    activeCoils_na: 5.2,
    shearModulus_G: 78500,
    nominalRate_k: 24.8,
    solidHeight_Hs: 87.0,
    maxLoad_F: 5800,
    designedDeflection_s: 180.0
  },
  {
    id: 'SP-SAIPA-QUICK-R',
    modelName: 'فنر لول عقب کوییک و ساینا (Saipa Quick Rear)',
    application: 'اکسل عقب سیستم تعلیق توئیست بیم',
    material: 'فولاد فنر 55Cr3 بهینه‌شده با عملیات حرارتی',
    wireDiameter_d: 11.5,
    meanDiameter_D: 108.0,
    outerDiameter_Do: 119.5,
    freeLength_L0: 340.0,
    totalCoils_nt: 7.2,
    activeCoils_na: 5.6,
    shearModulus_G: 78500,
    nominalRate_k: 28.5,
    solidHeight_Hs: 82.8,
    maxLoad_F: 5200,
    designedDeflection_s: 155.0
  },
  {
    id: 'SP-PEUGEOT-206-F',
    modelName: 'فنر لول جلو پژو ۲۰۶ و ۲۰۷ (Peugeot 206 Front)',
    application: 'تعلیق جلو خانواده پژو ۲۰۶ / ۲۰۷ هاچ‌بک و صندوقدار',
    material: 'فولاد 54SiCr6 با شات‌پینینگ دو مرحله‌ای',
    wireDiameter_d: 12.2,
    meanDiameter_D: 118.0,
    outerDiameter_Do: 130.2,
    freeLength_L0: 375.0,
    totalCoils_nt: 6.5,
    activeCoils_na: 4.8,
    shearModulus_G: 78500,
    nominalRate_k: 26.2,
    solidHeight_Hs: 79.3,
    maxLoad_F: 5400,
    designedDeflection_s: 168.0
  },
  {
    id: 'SP-RAIL-BOGIE-H',
    modelName: 'فنر سنگین بوژی واگن قطار (Heavy Bogie Coil Spring)',
    application: 'سیستم تعلیق بوژی واگن‌های باری و مسافری راه‌آهن جمهوری اسلامی',
    material: 'فولاد آلیاژی سنگین 50CrV4 با فرآیند فنرپیچ گرم',
    wireDiameter_d: 28.0,
    meanDiameter_D: 185.0,
    outerDiameter_Do: 213.0,
    freeLength_L0: 460.0,
    totalCoils_nt: 6.0,
    activeCoils_na: 4.2,
    shearModulus_G: 79000,
    nominalRate_k: 142.0,
    solidHeight_Hs: 168.0,
    maxLoad_F: 34000,
    designedDeflection_s: 195.0
  }
];

export const SPRING_CATALOG = SPRING_MODELS;

// 8 Production Line Stations (Digital Twin Topology)
export const FACTORY_STAGES: MachineTelemetry[] = [
  {
    id: 'ST-01-FEED',
    nameFa: 'ایستگاه ۱: بازکننده و صاف‌کننده کلاف مفتول (Wire Pay-off & Straightener)',
    nameEn: 'Stage 1: Wire Pay-off & Straightener',
    stageNumber: 1,
    category: 'feed',
    status: 'normal',
    healthScore: 94,
    rulHours: 1840,
    vibrationRms: 1.8,
    vibrationPeakFreq: 24,
    temperatureC: 48,
    motorCurrentAmps: 18.5,
    acousticDb: 72,
    rpm: 420,
    operatingHours: 4280,
    lastServiceDate: '1404/08/10',
    predictedFailureComponentFa: 'یاتاقان رولیک هدایت مفتول',
    predictedFailureComponentEn: 'Wire guide roller bearing'
  },
  {
    id: 'ST-02-COIL',
    nameFa: 'ایستگاه ۲: دستگاه فنرپیچ اتوماتیک CNC (CNC Helical Coiler)',
    nameEn: 'Stage 2: CNC Helical Coiling Machine',
    stageNumber: 2,
    category: 'coiling',
    status: 'warning',
    healthScore: 78,
    rulHours: 320,
    vibrationRms: 4.6,
    vibrationPeakFreq: 142,
    temperatureC: 68,
    motorCurrentAmps: 46.2,
    acousticDb: 86,
    rpm: 1450,
    operatingHours: 6120,
    lastServiceDate: '1404/07/15',
    predictedFailureComponentFa: 'گیربکس سرووموتور تغذیه گام (Pitch Servo Gearbox)',
    predictedFailureComponentEn: 'Pitch feed servo gearbox backlash',
    sensorAlertFa: 'افزایش لرزش هارمونیک فرکانس درگیری چرخدنده (GMF) در بیرینگ شفت ثانویه'
  },
  {
    id: 'ST-03-FURNACE',
    nameFa: 'ایستگاه ۳: کوره پیوسته آستنیته و سخت‌کاری (Austenitizing Heat Treatment)',
    nameEn: 'Stage 3: Continuous Austenitizing Furnace',
    stageNumber: 3,
    category: 'furnace',
    status: 'normal',
    healthScore: 91,
    rulHours: 2400,
    vibrationRms: 1.2,
    vibrationPeakFreq: 15,
    temperatureC: 885, // Operating zone temp
    motorCurrentAmps: 32.0,
    acousticDb: 68,
    rpm: 60,
    operatingHours: 12400,
    lastServiceDate: '1404/06/20',
    predictedFailureComponentFa: 'مبدل مشعل گازی زون ۲ کوره',
    predictedFailureComponentEn: 'Burner recuperator heat exchanger'
  },
  {
    id: 'ST-04-QUENCH',
    nameFa: 'ایستگاه ۴: مخزن کوئنچ در روغن داغ و کوره تمپر (Quench Tank & Tempering)',
    nameEn: 'Stage 4: Oil Quenching & Tempering Line',
    stageNumber: 4,
    category: 'quench',
    status: 'normal',
    healthScore: 88,
    rulHours: 1520,
    vibrationRms: 2.1,
    vibrationPeakFreq: 30,
    temperatureC: 440,
    motorCurrentAmps: 28.4,
    acousticDb: 74,
    rpm: 380,
    operatingHours: 8500,
    lastServiceDate: '1404/07/28',
    predictedFailureComponentFa: 'پمپ سیرکولاسیون روغن کوئیچ',
    predictedFailureComponentEn: 'Quench oil circulation impeller'
  },
  {
    id: 'ST-05-GRIND',
    nameFa: 'ایستگاه ۵: سنگ‌زن دوسر هم‌زمان فنر (Double-Disc End Grinding)',
    nameEn: 'Stage 5: Double-Disc End Face Grinder',
    stageNumber: 5,
    category: 'grinding',
    status: 'warning',
    healthScore: 72,
    rulHours: 190,
    vibrationRms: 5.2,
    vibrationPeakFreq: 280,
    temperatureC: 76,
    motorCurrentAmps: 64.8,
    acousticDb: 92,
    rpm: 1780,
    operatingHours: 5400,
    lastServiceDate: '1404/07/02',
    predictedFailureComponentFa: 'اسپیندل سنگ بالایی و سایش دیسک ساینده',
    predictedFailureComponentEn: 'Top grinding spindle & ceramic disc wear',
    sensorAlertFa: 'تکانه‌های فرکانس بالا در اسپیندل فوقانی - نیاز به بالانس مجدد دیسک سنگ'
  },
  {
    id: 'ST-06-PEEN',
    nameFa: 'ایستگاه ۶: شات‌پینینگ توربینی ضدخستگی (Stress-Peening Machine)',
    nameEn: 'Stage 6: Turbine Shot Peening Cell',
    stageNumber: 6,
    category: 'shotpeening',
    status: 'normal',
    healthScore: 89,
    rulHours: 1100,
    vibrationRms: 3.4,
    vibrationPeakFreq: 95,
    temperatureC: 58,
    motorCurrentAmps: 52.1,
    acousticDb: 95,
    rpm: 2800,
    operatingHours: 4900,
    lastServiceDate: '1404/08/01',
    predictedFailureComponentFa: 'پره‌های توربین پاشش ساچمه چدنی',
    predictedFailureComponentEn: 'Centrifugal blast wheel throwing blades'
  },
  {
    id: 'ST-07-SCRAG',
    nameFa: 'ایستگاه ۷: پرس نشست گرم و رفع تنش پسماند (Hot Scragging & Pre-setting)',
    nameEn: 'Stage 7: Hot Setting & Scragging Hydraulic Press',
    stageNumber: 7,
    category: 'scragging',
    status: 'normal',
    healthScore: 96,
    rulHours: 3100,
    vibrationRms: 1.4,
    vibrationPeakFreq: 18,
    temperatureC: 52,
    motorCurrentAmps: 38.0,
    acousticDb: 79,
    rpm: 0,
    operatingHours: 7200,
    lastServiceDate: '1404/08/18',
    predictedFailureComponentFa: 'سیل و کاسه‌نمد پیستون هیدرولیک',
    predictedFailureComponentEn: 'Hydraulic ram high-pressure seals'
  },
  {
    id: 'ST-08-QC',
    nameFa: 'ایستگاه ۸: سلول روباتیک بینایی ماشین و پروفیل‌سنج لیزری (Vision & Laser QC)',
    nameEn: 'Stage 8: AI Vision & 3D Laser Profilometry Cell',
    stageNumber: 8,
    category: 'inspection',
    status: 'normal',
    healthScore: 99,
    rulHours: 8500,
    vibrationRms: 0.6,
    vibrationPeakFreq: 12,
    temperatureC: 38,
    motorCurrentAmps: 8.2,
    acousticDb: 58,
    rpm: 0,
    operatingHours: 2100,
    lastServiceDate: '1404/08/25',
    predictedFailureComponentFa: 'فن خنک‌کننده دوربین صنعتی Basler',
    predictedFailureComponentEn: 'Edge IPC cooling fan'
  }
];

// OEE metrics for production lines in Fanar Lool Iran
export const OEE_METRICS: OeeMetric[] = [
  {
    lineId: 'LINE-01-PASSENGER',
    lineNameFa: 'خط ۱ تولید فنر لول سواری (ایران خودرو - تارا / ۲۰۶)',
    lineNameEn: 'Line 1: Passenger Vehicle Suspension Springs',
    availability: 91.4,
    performance: 89.2,
    quality: 97.8,
    oee: 79.7,
    targetOutput: 4200,
    actualOutput: 3810,
    goodCount: 3726,
    rejectCount: 84,
    scrapRate: 2.2,
    shift: 'شیفت روز (۰۶:۰۰ الی ۱۴:۰۰)',
    mtbfHours: 42.5,
    mttrMinutes: 38.0
  },
  {
    lineId: 'LINE-02-SAIPA',
    lineNameFa: 'خط ۲ تولید فنر لول سایپا (کوییک / ساینا)',
    lineNameEn: 'Line 2: SAIPA Passenger Suspension Springs',
    availability: 88.0,
    performance: 86.5,
    quality: 96.9,
    oee: 73.8,
    targetOutput: 3600,
    actualOutput: 3180,
    goodCount: 3081,
    rejectCount: 99,
    scrapRate: 3.1,
    shift: 'شیفت روز (۰۶:۰۰ الی ۱۴:۰۰)',
    mtbfHours: 31.0,
    mttrMinutes: 44.0
  },
  {
    lineId: 'LINE-03-HEAVY',
    lineNameFa: 'خط ۳ فنرهای سنگین ریلی و واگن (راه‌آهن / تجاری)',
    lineNameEn: 'Line 3: Heavy Freight & Railway Springs',
    availability: 94.2,
    performance: 92.0,
    quality: 98.6,
    oee: 85.5,
    targetOutput: 850,
    actualOutput: 805,
    goodCount: 794,
    rejectCount: 11,
    scrapRate: 1.4,
    shift: 'شیفت روز (۰۶:۰۰ الی ۱۴:۰۰)',
    mtbfHours: 68.0,
    mttrMinutes: 28.0
  }
];

// Energy Telemetry
export const CURRENT_ENERGY_METRIC: EnergyMetric = {
  timestamp: '1404/09/15 11:42:00',
  totalPowerKw: 845.6,
  furnaceGasM3Hour: 284.2,
  compressedAirM3Min: 42.8,
  compressedAirPressureBar: 6.8,
  powerFactor: 0.94,
  lineCostTomanPerHour: 1425000,
  specificEnergyPerTon: 342.5, // kWh/ton
  co2EmissionsKgHour: 620.4,
  anomaliesDetected: 1 // Pneumatic leak detected at grinding station
};

// Registered AI Models in Central MLOps Registry (Module 3)
export const AI_MODELS_REGISTRY: AiModelItem[] = [
  {
    id: 'MDL-YOLO-DEFECT-V3',
    name: 'Fanar-DefectNet-YOLOv10m',
    version: 'v3.2.1',
    architecture: 'YOLOv10 with Industrial Attention Mechanism',
    taskFa: 'شناسایی و تفکیک عیوب سطحی (ترک، کربن‌زدایی، خط و خش و لب‌پریدگی)',
    taskEn: 'Surface defect detection (cracks, decarburization, scratches, flaking)',
    accuracy: 98.4,
    f1Score: 0.978,
    latencyMs: 14.2,
    deployedLines: ['LINE-01-PASSENGER', 'LINE-02-SAIPA'],
    status: 'active',
    lastUpdated: '1404/08/20',
    datasetSamples: 48600
  },
  {
    id: 'MDL-LASER-3D-PROFILE',
    name: 'Laser-Helix-Profiler-PointNet',
    version: 'v2.1.0',
    architecture: 'PointNet++ / 3D Height-Map Spline Reconstruction',
    taskFa: 'استخراج سه‌بعدی گام فنر، قطر خارجی، گونیایی و زاویه سنگ‌زنی دوسر',
    taskEn: '3D helical pitch extraction, outer diameter, squareness & grinding angle',
    accuracy: 99.2,
    f1Score: 0.991,
    latencyMs: 22.5,
    deployedLines: ['LINE-01-PASSENGER', 'LINE-03-HEAVY'],
    status: 'active',
    lastUpdated: '1404/08/28',
    datasetSamples: 24200
  },
  {
    id: 'MDL-PDM-VIBE-RUL',
    name: 'Industrial-PdM-TemporalTransformer',
    version: 'v1.8.4',
    architecture: 'Informer / Temporal Convolutional Network (TCN)',
    taskFa: 'پیش‌بینی زمان تا خرابی بیرینگ‌ها و گیربکس بر اساس لرزش و دمای موتور',
    taskEn: 'RUL estimation & early anomaly detection from tri-axial vibration & temperature',
    accuracy: 94.6,
    f1Score: 0.939,
    latencyMs: 38.0,
    deployedLines: ['LINE-01-PASSENGER', 'LINE-02-SAIPA', 'LINE-03-HEAVY'],
    status: 'active',
    lastUpdated: '1404/09/01',
    datasetSamples: 142000
  },
  {
    id: 'MDL-ENERGY-LEAK-ANOMALY',
    name: 'MultiCarrier-Energy-AutoEncoder',
    version: 'v1.4.0',
    architecture: 'Deep Variational Autoencoder (VAE)',
    taskFa: 'تشخیص ناهنجاری مصرف انرژی الکتریکی، نشتی هوای فشرده و افت راندمان مشعل کوره',
    taskEn: 'Multi-carrier energy anomaly detection & compressed air leak localization',
    accuracy: 96.1,
    f1Score: 0.952,
    latencyMs: 5.4,
    deployedLines: ['LINE-01-PASSENGER', 'LINE-02-SAIPA', 'LINE-03-HEAVY'],
    status: 'active',
    lastUpdated: '1404/09/10',
    datasetSamples: 86400
  }
];

// Predictive Work Orders
export const PREDICTIVE_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-1404-09-082',
    machineId: 'ST-02-COIL',
    machineNameFa: 'دستگاه فنرپیچ CNC خط ۱',
    machineNameEn: 'Line 1 CNC Spring Coiler',
    titleFa: 'سرویس اضطراری و تعویض بیرینگ سرووموتور گام‌دهنده',
    titleEn: 'Pitch servo bearing overhaul before catastrophic seizure',
    priority: 'high',
    issuedAt: '1404/09/14 16:30',
    dueAt: '1404/09/16 12:00',
    status: 'in_progress',
    assignedTeamFa: 'تیم مکانیک نگهداری پیش‌بینانه (مهندس اکبری)',
    reasonFa: 'الگوریتم پایش وضعیت افزایش ۶ برابری مؤلفه فرکانسی ۱۲۴ هرتز در حوزه FFT را گزارش کرد (تخمین عمر باقی‌مانده ۳۲۰ ساعت)',
    sensorTrigger: 'RMS لرزش به ۴.۶ میلی‌متر بر ثانیه رسید (حد هشدار: ۴.۰)'
  },
  {
    id: 'WO-1404-09-079',
    machineId: 'ST-05-GRIND',
    machineNameFa: 'سنگ‌زن دوسر خط ۱',
    machineNameEn: 'Line 1 End Grinder',
    titleFa: 'تنظیم توازن دینامیکی دیسک ساینده فوقانی و اصلاح فید سنگ‌زنی',
    titleEn: 'Dynamic balancing of top grinding wheel & feed rate recalibration',
    priority: 'critical',
    issuedAt: '1404/09/15 08:15',
    dueAt: '1404/09/15 18:00',
    status: 'pending',
    assignedTeamFa: 'واحد تراشکاری و بالانسینگ صنعتی',
    reasonFa: 'دمای یاتاقان به ۷۶ درجه سانتی‌گراد رسیده و شتاب ارتعاش فرکانس بالا زنگ خطر خرابی ساچمه‌ها را فعال کرده است.',
    sensorTrigger: 'سنسور IEPE لرزش ۵.۲ میلی‌متر بر ثانیه را ثبت کرد'
  },
  {
    id: 'WO-1404-09-071',
    machineId: 'ST-06-PEEN',
    machineNameFa: 'سلول شات‌پینینگ توربینی',
    machineNameEn: 'Shot Peening Cell',
    titleFa: 'بازرسی دوره‌ای تیغه‌های توربین و کنترل شدت آلمن (Almen A)',
    titleEn: 'Turbine blade inspection & Almen intensity verification',
    priority: 'medium',
    issuedAt: '1404/09/12 10:00',
    dueAt: '1404/09/17 14:00',
    status: 'pending',
    assignedTeamFa: 'واحد بازرسی فنی و کیفیت فرآیند',
    reasonFa: 'رسیدن به ۴۹۰۰ ساعت کارکرد و افت جزئی در آمپراژ موتور پروانه',
    sensorTrigger: 'کنترل دوره‌ای ساعت کارکرد و پایش جریان مصرفی'
  }
];

// Multi-Plant Benchmarking in Semnan Province (Module 3)
export const PROVINCIAL_PLANTS: PlantBenchmark[] = [
  {
    plantId: 'PLANT-FANAR-01',
    plantNameFa: 'کارخانه فنر لول ایران - سایت اصلی سمنان',
    plantNameEn: 'Iran Coil Spring Co. - Main Plant Semnan',
    locationFa: 'شهرک صنعتی بزرگ سمنan - میدان صنعت',
    totalTonnageMonth: 480,
    averageOee: 81.2,
    scrapRate: 2.1,
    energyPerTon: 342,
    pdmHealthIndex: 88,
    connectivityStatus: 'online'
  },
  {
    plantId: 'PLANT-STABILIZER-02',
    plantNameFa: 'کارخانه فنر لول ایران - سالن میل تعادل و فنرهای تخت',
    plantNameEn: 'Iran Coil Spring - Stabilizer Bar & Leaf Division',
    locationFa: 'شهرک صنعتی سمنان - فاز ۲',
    totalTonnageMonth: 320,
    averageOee: 76.5,
    scrapRate: 2.8,
    energyPerTon: 395,
    pdmHealthIndex: 82,
    connectivityStatus: 'online'
  },
  {
    plantId: 'PLANT-SEMNAN-MEMBER-03',
    plantNameFa: 'صنایع فورج و قطعه‌سازی شرق سمنان (عضو آزمایشی پلتفرم)',
    plantNameEn: 'East Semnan Forging & Components (Pilot Member)',
    locationFa: 'شهرک صنعتی شاهرود',
    totalTonnageMonth: 210,
    averageOee: 69.4,
    scrapRate: 4.4,
    energyPerTon: 460,
    pdmHealthIndex: 74,
    connectivityStatus: 'online'
  },
  {
    plantId: 'PLANT-GARMSAR-PARTS-04',
    plantNameFa: 'شرکت تولید قطعات خودرو گرمسار (عضو شبکه)',
    plantNameEn: 'Garmsar Auto Parts Mfg (Network Member)',
    locationFa: 'شهرک صنعتی گرمسار',
    totalTonnageMonth: 185,
    averageOee: 72.8,
    scrapRate: 3.9,
    energyPerTon: 430,
    pdmHealthIndex: 79,
    connectivityStatus: 'warning'
  }
];

// Mock user profiles
export const USER_PROFILES: UserProfile[] = [
  {
    id: 'USR-GM-01',
    nameFa: 'مهندس محمدرضا یوسفی / دکتر مسعود بخشی',
    nameEn: 'M. Reza Yousefi / Dr. Masoud Bakhshi',
    role: 'general_manager',
    roleTitleFa: 'مدیریت ارشد کارخانه و توسعه فناوری',
    roleTitleEn: 'Plant General Manager & Tech Director',
    departmentFa: 'هیئت مدیره و مدیریت اجرایی',
    departmentEn: 'Executive Board',
    avatar: '👨‍💼'
  },
  {
    id: 'USR-QC-02',
    nameFa: 'مهندس سارا احمدی',
    nameEn: 'Eng. Sara Ahmadi',
    role: 'qc_engineer',
    roleTitleFa: 'سرپرست کنترل کیفیت و بینایی ماشین',
    roleTitleEn: 'Head of Quality & Machine Vision',
    departmentFa: 'واحد کنترل و تضمین کیفیت (QC/QA)',
    departmentEn: 'Quality Assurance',
    avatar: '👩‍🔬'
  },
  {
    id: 'USR-PDM-03',
    nameFa: 'مهندس علی اکبری',
    nameEn: 'Eng. Ali Akbari',
    role: 'maintenance_lead',
    roleTitleFa: 'سرپرست نگهداری و تعمیرات پیش‌بینانه (PdM)',
    roleTitleEn: 'Predictive Maintenance Supervisor',
    departmentFa: 'واحد نگهداری، تعمیرات و پایدارسازی (نت)',
    departmentEn: 'Maintenance & Reliability',
    avatar: '👨‍🔧'
  },
  {
    id: 'USR-ENG-04',
    nameFa: 'مهندس حمید کاظمی',
    nameEn: 'Eng. Hamid Kazemi',
    role: 'energy_supervisor',
    roleTitleFa: 'سرپرست تأسیسات و بهینه‌سازی انرژی',
    roleTitleEn: 'Energy & Utilities Supervisor',
    departmentFa: 'واحد انرژی، کوره‌ها و تأسیسات صنعتی',
    departmentEn: 'Energy & Utilities',
    avatar: '⚡'
  }
];

// Recent spring inspection records for Module 1 & 2
export const RECENT_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'INSP-1404-0915-0842',
    timestamp: '11:41:22',
    partModel: 'SP-IKCO-TARA-F',
    batchNumber: 'BT-1404-09B-12',
    lineId: 'LINE-01-PASSENGER',
    status: 'pass',
    cycleTimeMs: 1420,
    ejectorTriggered: false,
    dimensions: [
      { parameterFa: 'ارتفاع آزاد (L0)', parameterEn: 'Free Length (L0)', nominal: 385.0, actual: 385.4, minTol: 381.0, maxTol: 389.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر خارجی (Do)', parameterEn: 'Outer Diameter (Do)', nominal: 136.8, actual: 136.9, minTol: 135.5, maxTol: 138.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر مفتول (d)', parameterEn: 'Wire Diameter (d)', nominal: 12.8, actual: 12.81, minTol: 12.75, maxTol: 12.85, unit: 'mm', status: 'pass' },
      { parameterFa: 'گونیایی انتها (e1)', parameterEn: 'Squareness (e1)', nominal: 0.0, actual: 0.7, minTol: 0.0, maxTol: 1.5, unit: 'mm', status: 'pass' },
      { parameterFa: 'تختی سطح سنگ‌خورده (α)', parameterEn: 'Ground Angle (α)', nominal: 270.0, actual: 272.0, minTol: 260.0, maxTol: 285.0, unit: 'deg', status: 'pass' }
    ],
    defects: []
  },
  {
    id: 'INSP-1404-0915-0841',
    timestamp: '11:41:18',
    partModel: 'SP-IKCO-TARA-F',
    batchNumber: 'BT-1404-09B-12',
    lineId: 'LINE-01-PASSENGER',
    status: 'reject',
    cycleTimeMs: 1380,
    ejectorTriggered: true,
    dimensions: [
      { parameterFa: 'ارتفاع آزاد (L0)', parameterEn: 'Free Length (L0)', nominal: 385.0, actual: 391.2, minTol: 381.0, maxTol: 389.0, unit: 'mm', status: 'fail' },
      { parameterFa: 'قطر خارجی (Do)', parameterEn: 'Outer Diameter (Do)', nominal: 136.8, actual: 137.4, minTol: 135.5, maxTol: 138.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر مفتول (d)', parameterEn: 'Wire Diameter (d)', nominal: 12.8, actual: 12.82, minTol: 12.75, maxTol: 12.85, unit: 'mm', status: 'pass' },
      { parameterFa: 'گونیایی انتها (e1)', parameterEn: 'Squareness (e1)', nominal: 0.0, actual: 2.3, minTol: 0.0, maxTol: 1.5, unit: 'mm', status: 'fail' },
      { parameterFa: 'تختی سطح سنگ‌خورده (α)', parameterEn: 'Ground Angle (α)', nominal: 270.0, actual: 268.0, minTol: 260.0, maxTol: 285.0, unit: 'deg', status: 'pass' }
    ],
    defects: [
      {
        id: 'DEF-CRACK-99',
        nameFa: 'ترک طولی ناشی از تنش پیچش سرد (Longitudinal Crack)',
        nameEn: 'Torsional Surface Crack',
        type: 'crack',
        confidence: 0.96,
        severity: 'critical',
        boundingBox: { x: 42, y: 56, width: 14, height: 18 },
        descriptionFa: 'ایجاد شیار ناشی از ناخالصی سطحی مفتول یا گام نایکنواخت در فنرپیچی سرد',
        descriptionEn: 'Surface seam caused by raw wire flaw or excessive coiling stress',
        recommendationFa: 'جلوگیری از ورود به کوره سخت‌کاری - قطعه توسط اجکتور پنوماتیک به مخزن ضایعات پرتاب شد.'
      }
    ]
  },
  {
    id: 'INSP-1404-0915-0840',
    timestamp: '11:41:14',
    partModel: 'SP-IKCO-TARA-F',
    batchNumber: 'BT-1404-09B-12',
    lineId: 'LINE-01-PASSENGER',
    status: 'pass',
    cycleTimeMs: 1400,
    ejectorTriggered: false,
    dimensions: [
      { parameterFa: 'ارتفاع آزاد (L0)', parameterEn: 'Free Length (L0)', nominal: 385.0, actual: 384.8, minTol: 381.0, maxTol: 389.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر خارجی (Do)', parameterEn: 'Outer Diameter (Do)', nominal: 136.8, actual: 136.6, minTol: 135.5, maxTol: 138.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر مفتول (d)', parameterEn: 'Wire Diameter (d)', nominal: 12.8, actual: 12.79, minTol: 12.75, maxTol: 12.85, unit: 'mm', status: 'pass' },
      { parameterFa: 'گونیایی انتها (e1)', parameterEn: 'Squareness (e1)', nominal: 0.0, actual: 0.9, minTol: 0.0, maxTol: 1.5, unit: 'mm', status: 'pass' },
      { parameterFa: 'تختی سطح سنگ‌خورده (α)', parameterEn: 'Ground Angle (α)', nominal: 270.0, actual: 271.0, minTol: 260.0, maxTol: 285.0, unit: 'deg', status: 'pass' }
    ],
    defects: []
  },
  {
    id: 'INSP-1404-0915-0839',
    timestamp: '11:41:09',
    partModel: 'SP-IKCO-TARA-F',
    batchNumber: 'BT-1404-09B-12',
    lineId: 'LINE-01-PASSENGER',
    status: 'rework',
    cycleTimeMs: 1450,
    ejectorTriggered: true,
    dimensions: [
      { parameterFa: 'ارتفاع آزاد (L0)', parameterEn: 'Free Length (L0)', nominal: 385.0, actual: 386.1, minTol: 381.0, maxTol: 389.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر خارجی (Do)', parameterEn: 'Outer Diameter (Do)', nominal: 136.8, actual: 136.7, minTol: 135.5, maxTol: 138.0, unit: 'mm', status: 'pass' },
      { parameterFa: 'قطر مفتول (d)', parameterEn: 'Wire Diameter (d)', nominal: 12.8, actual: 12.80, minTol: 12.75, maxTol: 12.85, unit: 'mm', status: 'pass' },
      { parameterFa: 'گونیایی انتها (e1)', parameterEn: 'Squareness (e1)', nominal: 0.0, actual: 1.7, minTol: 0.0, maxTol: 1.5, unit: 'mm', status: 'warning' },
      { parameterFa: 'تختی سطح سنگ‌خورده (α)', parameterEn: 'Ground Angle (α)', nominal: 270.0, actual: 255.0, minTol: 260.0, maxTol: 285.0, unit: 'deg', status: 'warning' }
    ],
    defects: [
      {
        id: 'DEF-SCRATCH-41',
        nameFa: 'خط و خش سطحی روی پوشش رنگ پودری (Coating Scratch)',
        nameEn: 'Powder Coat Scratch',
        type: 'coating',
        confidence: 0.89,
        severity: 'minor',
        boundingBox: { x: 68, y: 32, width: 12, height: 10 },
        descriptionFa: 'خراش موضعی در اثر برخورد بازوی انتقال دهنده',
        descriptionEn: 'Surface abrasion from conveyor guide rail',
        recommendationFa: 'ارسال به ایستگاه بازپوشش و اصلاح رنگ موضعی'
      }
    ]
  }
];

// Aliases and structured data for modules
export const WORK_ORDERS = PREDICTIVE_WORK_ORDERS;

export interface ShiftInfo {
  shiftId: string;
  shiftNameFa: string;
  shiftNameEn: string;
  availability: number;
  performance: number;
  quality: number;
  downtimeMinutes: number;
  productionUnits: number;
  targetUnits: number;
  scrapUnits: number;
}

export const SHIFT_DATA: ShiftInfo[] = [
  {
    shiftId: 'SHIFT-01',
    shiftNameFa: 'شیفت صبح (۰۶:۰۰ الی ۱۴:۰۰)',
    shiftNameEn: 'Morning Shift (06:00 - 14:00)',
    availability: 91.5,
    performance: 89.4,
    quality: 97.8,
    downtimeMinutes: 41,
    productionUnits: 2860,
    targetUnits: 3200,
    scrapUnits: 63
  },
  {
    shiftId: 'SHIFT-02',
    shiftNameFa: 'شیفت عصر (۱۴:۰۰ الی ۲۲:۰۰)',
    shiftNameEn: 'Evening Shift (14:00 - 22:00)',
    availability: 88.2,
    performance: 87.1,
    quality: 97.2,
    downtimeMinutes: 56,
    productionUnits: 2690,
    targetUnits: 3100,
    scrapUnits: 75
  },
  {
    shiftId: 'SHIFT-03',
    shiftNameFa: 'شیفت شب (۲۲:۰۰ الی ۰۶:۰۰)',
    shiftNameEn: 'Night Shift (22:00 - 06:00)',
    availability: 93.0,
    performance: 91.2,
    quality: 98.4,
    downtimeMinutes: 34,
    productionUnits: 2940,
    targetUnits: 3200,
    scrapUnits: 47
  }
];

export const DOWNTIME_PARETO = [
  { causeFa: 'گیرکردن مفتول کلاف‌بازکن', causeEn: 'Wire De-coiler Jam', hoursLost: 18.2, machineId: 'ST-01-FEED' },
  { causeFa: 'تعویض سنگ سنباده دیسک دوسر', causeEn: 'Grinding Wheel Dressing', hoursLost: 12.4, machineId: 'ST-05-GRIND' },
  { causeFa: 'افزایش دمای روغن کوئنچ', causeEn: 'Quench Oil Temp High', hoursLost: 8.5, machineId: 'ST-04-QUENCH' },
  { causeFa: 'سایش تیغه توربین شات‌پینینگ', causeEn: 'Shot Peening Blade Wear', hoursLost: 6.8, machineId: 'ST-06-PEEN' },
  { causeFa: 'تنظیم کولیس و فیکسچر فنرپیچ', causeEn: 'CNC Tooling Setup', hoursLost: 4.2, machineId: 'ST-02-COIL' },
  { causeFa: 'نوسان فشار هوای فشرده', causeEn: 'Pneumatic Pressure Drop', hoursLost: 2.4, machineId: 'ST-08-VISION' }
];

export const ENERGY_DATA = {
  currentPowerKw: 428.5,
  furnaceGasFlowM3h: 185.0,
  compressedAirPressureBar: 7.1,
  specificEnergyKwhPerTon: 338.2,
  airLeaksDetectedCount: 1,
  carbonOffsetTons: 14.8
};

// SCADA Real-Time Plant Alarms (ISA-18.2 Compliant)
export const PLANT_ALARMS = [
  {
    id: 'ALM-1404-0915-01',
    timestamp: '11:38:22',
    machineId: 'ST-05-GRIND',
    machineNameFa: 'سنگ‌زن دوسر خط ۱ (دیسک فوقانی)',
    machineNameEn: 'End Grinder Top Spindle',
    stageNumber: 5,
    severity: 'critical' as const,
    titleFa: 'افزایش دمای یاتاقان اسپیندل به ۷۶.۴°C و شتاب ارتعاش بالا',
    titleEn: 'Spindle Bearing Overheat (76.4°C) & High RMS Vibration',
    descriptionFa: 'سنسور IEPE شتاب ۶.۲ میلی‌متر بر ثانیه را در هارمونیک دوم فرکانس چرخش ثبت کرد که نشان‌دهنده نقص ساچمه‌های یاتاقان است.',
    descriptionEn: 'IEPE sensor recorded 6.2 mm/s at 2x running speed, indicating bearing cage spalling defect.',
    recommendedActionFa: 'کاهش نرخ پیشروی فید سنگ‌زنی، بازرسی فوری سیستم روان‌کاری و اعزام اکیپ نت.',
    recommendedActionEn: 'Reduce grinding feed rate, inspect lubrication header, dispatch maintenance crew.',
    acknowledged: false
  },
  {
    id: 'ALM-1404-0915-02',
    timestamp: '11:40:15',
    machineId: 'ST-02-COIL',
    machineNameFa: 'دستگاه فنرپیچ CNC خط ۱',
    machineNameEn: 'CNC Spring Coiler Line 1',
    stageNumber: 2,
    severity: 'major' as const,
    titleFa: 'انحراف گام فنرپیچی و نوسان گشتاور سرووموتور',
    titleEn: 'Pitch Feed Deviation & Servo Torque Ripple',
    descriptionFa: 'سامانه بینایی و انکودر سروو، انحراف ۰.۸ میلیمتری در گام حلقه سوم را تشخیص دادند.',
    descriptionEn: 'Encoder detected 0.8mm pitch discrepancy on 3rd active coil.',
    recommendedActionFa: 'تنظیم کشش کلاف‌بازکن و کالیبراسیون فیدر مفتول.',
    recommendedActionEn: 'Re-align de-coiler tension brake and recalibrate wire guide.',
    acknowledged: false
  },
  {
    id: 'ALM-1404-0915-03',
    timestamp: '11:22:40',
    machineId: 'ST-06-PEEN',
    machineNameFa: 'سلول شات‌پینینگ تنشی توربینی',
    machineNameEn: 'Shot Peening Cell',
    stageNumber: 6,
    severity: 'minor' as const,
    titleFa: 'افت جزئی شدت آلمن (Almen Intensity Drop)',
    titleEn: 'Almen Intensity Marginal Drop (0.31A vs Target 0.35A)',
    descriptionFa: 'سایش تیغه‌های پرتاب ساچمه فولادی باعث افت راندمان پرتاب شده است.',
    descriptionEn: 'Turbine impeller vane erosion causing slight velocity drop.',
    recommendedActionFa: 'تزریق ۱۰۰ کیلوگرم ساچمه کروی نو S230 و تعویض پره‌ها در پایان شیفت.',
    recommendedActionEn: 'Top up 100kg fresh S230 steel shots, replace vanes on shift handover.',
    acknowledged: true
  }
];

// Spring Steel Alloys & Metallurgical Characteristics
export const ALLOY_MATERIALS = [
  {
    code: '54SiCr6',
    standard: 'DIN EN 10089 (1.7102)',
    nameFa: 'فولاد فنر سیلیکون-کروم ۵۴سیلیکون‌کروم۶',
    nameEn: 'Silicon-Chromium Spring Steel (54SiCr6)',
    density: 7.85, // g/cm³
    elasticModulusE: 206000, // MPa
    shearModulusG: 78500, // MPa
    tensileStrengthRm: 1750, // MPa
    yieldStrengthRp02: 1550, // MPa
    hardnessHrc: '50 - 54 HRC',
    decarbLimitPercent: 1.0, // max 1.0% wire diameter
    corrosionProtection: 'فسفاته روی + رنگ پودری الکترواستاتیک اپوکسی-پلی‌استر (حداقل ۹۶۰ ساعت سالت اسپری ASTM B117)',
    typicalUse: 'فنرهای تعلیق سیستم مک‌فرسون خودروهای سواری (تارا، دنا، پژو، شاهین)',
    goodmanLimits: {
      tauZero: 480, // MPa torsional fatigue limit at zero mean stress
      slope: 0.38
    }
  },
  {
    code: '51CrV4',
    standard: 'DIN EN 10089 (1.8159)',
    nameFa: 'فولاد فنر کروم-وانادیوم ۵۱کروم‌وانادیوم۴',
    nameEn: 'Chromium-Vanadium Spring Steel (51CrV4)',
    density: 7.85,
    elasticModulusE: 210000,
    shearModulusG: 79000,
    tensileStrengthRm: 1650,
    yieldStrengthRp02: 1450,
    hardnessHrc: '48 - 52 HRC',
    decarbLimitPercent: 1.2,
    corrosionProtection: 'زینک فلیک (Geomet / Dacromet) + پوشش اپوکسی انعطاف‌پذیر',
    typicalUse: 'میل تعادل خودرو (Anti-Roll Bar) و فنرهای باری سنگین',
    goodmanLimits: {
      tauZero: 450,
      slope: 0.36
    }
  },
  {
    code: '60SiCr7',
    standard: 'DIN EN 10089 (1.7108)',
    nameFa: 'فولاد فنر پرسیلیکون ۶۰سیلیکون‌کروم۷',
    nameEn: 'High-Silicon Spring Steel (60SiCr7)',
    density: 7.85,
    elasticModulusE: 205000,
    shearModulusG: 78000,
    tensileStrengthRm: 1800,
    yieldStrengthRp02: 1600,
    hardnessHrc: '52 - 55 HRC',
    decarbLimitPercent: 0.8,
    corrosionProtection: 'فسفاته سنگین + پرایمر ضدخوردگی دو جزئی',
    typicalUse: 'فنرهای بوژی واگن‌های قطار باری و مسافری راه‌آهن جمهوری اسلامی ایران',
    goodmanLimits: {
      tauZero: 510,
      slope: 0.40
    }
  }
];

// Heat Chemical Composition Certificate (EN 10204 Type 3.1)
export const HEAT_CHEMICAL_COMPOSITION = [
  { element: 'کربن (Carbon)', symbol: 'C', minVal: 0.51, maxVal: 0.59, actualVal: 0.55, unit: '%', status: 'pass' as const },
  { element: 'سیلیسیم (Silicon)', symbol: 'Si', minVal: 1.20, maxVal: 1.60, actualVal: 1.42, unit: '%', status: 'pass' as const },
  { element: 'منگنز (Manganese)', symbol: 'Mn', minVal: 0.50, maxVal: 0.80, actualVal: 0.65, unit: '%', status: 'pass' as const },
  { element: 'کروم (Chromium)', symbol: 'Cr', minVal: 0.50, maxVal: 0.80, actualVal: 0.68, unit: '%', status: 'pass' as const },
  { element: 'فسفر (Phosphorus)', symbol: 'P', minVal: 0.00, maxVal: 0.025, actualVal: 0.012, unit: '%', status: 'pass' as const },
  { element: 'گوگرد (Sulfur)', symbol: 'S', minVal: 0.00, maxVal: 0.025, actualVal: 0.008, unit: '%', status: 'pass' as const },
  { element: 'مس (Copper)', symbol: 'Cu', minVal: 0.00, maxVal: 0.25, actualVal: 0.09, unit: '%', status: 'pass' as const }
];


