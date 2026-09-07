import React from 'react';
import { 
  Language, 
  TabId, 
  UserProfile 
} from '../types';
import { 
  Activity, 
  Eye, 
  Layers, 
  Network, 
  Wrench, 
  BarChart3, 
  Zap, 
  FileText, 
  Box, 
  User, 
  Bell, 
  Cpu, 
  CheckCircle2,
  Home,
  SlidersHorizontal,
  FlaskConical,
  Award,
  Camera,
  Calculator,
  BookOpen,
  HelpCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface HeaderProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  lang: Language;
  onToggleLang: () => void;
  currentUser: UserProfile;
  onOpenLoginModal: () => void;
  onOpenAlarmModal: () => void;
  simulating: boolean;
  onToggleSimulation: () => void;
  activeAlarmsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  currentUser,
  onOpenLoginModal,
  onOpenAlarmModal,
  simulating,
  onToggleSimulation,
  activeAlarmsCount,
}) => {
  const isFa = lang === 'fa';

  const navItems: { id: TabId; labelFa: string; labelEn: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'landing', labelFa: 'معرفی و لندینگ', labelEn: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'digital_twin', labelFa: 'دوقلوی دیجیتال ۳بعدی', labelEn: '3D Digital Twin', icon: <Box className="w-4 h-4 text-cyan-400" />, badge: 'AI/Twin' },
    { id: 'module1_vision', labelFa: '۱. بینایی ماشین', labelEn: '1. Vision QC', icon: <Eye className="w-4 h-4 text-emerald-400" /> },
    { id: 'module2_profilometry', labelFa: '۲. پروفیل‌سنجی ۳D', labelEn: '2. 3D Laser Profile', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
    { id: 'module3_central_qc', labelFa: '۳. پلتفرم مرکزی سمنان', labelEn: '3. Central QC Platform', icon: <Network className="w-4 h-4 text-blue-400" /> },
    { id: 'module4_pdm', labelFa: '۴. نگهداری پیش‌بینانه', labelEn: '4. Predictive PdM', icon: <Wrench className="w-4 h-4 text-amber-400" /> },
    { id: 'module5_oee', labelFa: '۵. بهره‌وری و OEE', labelEn: '5. OEE & Line Perf', icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
    { id: 'module6_energy', labelFa: '۶. مانیتورینگ انرژی', labelEn: '6. Smart Energy', icon: <Zap className="w-4 h-4 text-yellow-400" /> },
    { id: 'metallurgy_lab', labelFa: 'آزمایشگاه متالورژی و گودمن', labelEn: 'Metallurgy Lab', icon: <FlaskConical className="w-4 h-4 text-indigo-300" /> },
    { id: 'quality_certificate', labelFa: 'سرتیفیکیت ۳.۱ ساپکو', labelEn: '3.1 Certificate', icon: <Award className="w-4 h-4 text-emerald-300" /> },
    { id: 'live_camera', labelFa: 'دوربین و بینایی زنده', labelEn: 'Live Camera Vision', icon: <Camera className="w-4 h-4 text-cyan-300" />, badge: 'LIVE' },
    { id: 'engineering_tools', labelFa: 'محاسبه‌گر مهندسی فنر', labelEn: 'CAD/CAE Tools', icon: <Calculator className="w-4 h-4 text-indigo-300" /> },
    { id: 'factory_scada', labelFa: 'توپولوژی خط و SCADA', labelEn: 'Line SCADA Flow', icon: <Cpu className="w-4 h-4 text-cyan-400" />, badge: 'PLC' },
    { id: 'spc_control', labelFa: 'کنترل آماری و SPC', labelEn: 'Statistical SPC', icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, badge: 'Cpk' },
    { id: 'roi_calculator', labelFa: 'شبیه‌ساز مالی ROI', labelEn: 'Financial ROI', icon: <DollarSign className="w-4 h-4 text-amber-400" /> },
    { id: 'user_guide', labelFa: 'راهنمای جامع کاربری و SOP', labelEn: 'User Guide & SOP', icon: <BookOpen className="w-4 h-4 text-amber-300" /> },
    { id: 'proposals_roadmap', labelFa: 'پروپوزال و نقشه راه', labelEn: 'Proposals & Roadmap', icon: <FileText className="w-4 h-4 text-rose-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      {/* Top Bar: Company Identity & System Telemetry Status */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer" onClick={() => onSelectTab('landing')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-0.5 border border-slate-700/80 shadow-lg shadow-black/40 overflow-hidden flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="شرکت فنر لول ایران" 
                className="w-full h-full object-contain rounded-lg bg-white/95"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src.endsWith('.png')) {
                    target.src = '/logo.jpg';
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                {isFa ? 'کارخانه فنر لول ایران' : 'Iran Coil Spring Co.'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 font-mono font-medium">
                  {isFa ? 'دوقلوی دیجیتال نسل ۴' : 'Industry 4.0 Twin'}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {isFa 
                ? 'پلتفرم جامع تولید هوشمند، بینایی ماشین، نگهداری پیش‌بینانه و انرژی (همکاری ابتکار ویستا)' 
                : 'Integrated AI Smart Manufacturing, PdM & Quality Platform (Vesta Smart Network)'}
            </p>
          </div>
        </div>

        {/* Right Status Actions: Simulation Toggle, Alarms, User Profile & Lang */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Simulation status */}
          <button
            id="simulation-toggle-btn"
            onClick={onToggleSimulation}
            title={isFa ? 'توقف یا شروع شبیه‌سازی زنده سنسورها' : 'Toggle live telemetry simulation'}
            className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
              simulating
                ? 'bg-emerald-950/70 border-emerald-600/80 text-emerald-300 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${simulating ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden md:inline">
              {simulating ? (isFa ? 'شبیه‌سازی زنده: فعال' : 'Simulation: Active') : (isFa ? 'شبیه‌سازی: متوقف' : 'Simulation: Paused')}
            </span>
          </button>

          {/* Alarm alert badge */}
          <div 
            onClick={onOpenAlarmModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all border ${
              activeAlarmsCount > 0 
                ? 'bg-amber-950/60 border-amber-600/80 text-amber-300 animate-pulse' 
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={isFa ? `${activeAlarmsCount} هشدار فنی فعال (کلیک برای باز کردن کنسول SCADA)` : `${activeAlarmsCount} Active alerts (click to open SCADA console)`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{activeAlarmsCount}</span>
          </div>

          {/* User Role Switcher Button */}
          <button
            id="user-profile-login-btn"
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-all hover:border-slate-600"
          >
            <span className="text-sm">{currentUser.avatar}</span>
            <div className="text-right hidden sm:block">
              <div className="font-medium text-xs text-white leading-tight">
                {isFa ? currentUser.nameFa : currentUser.nameEn}
              </div>
              <div className="text-[10px] text-cyan-400 leading-tight">
                {isFa ? currentUser.roleTitleFa : currentUser.roleTitleEn}
              </div>
            </div>
            <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          {/* User Guide & SOP Shortcut Button */}
          <button
            id="user-guide-shortcut-btn"
            onClick={() => onSelectTab('user_guide')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors border ${
              currentTab === 'user_guide'
                ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title={isFa ? 'کتابچه راهنمای جامع کاربری و SOP' : 'User Guide & SOP Manual'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{isFa ? 'راهنمای کاربری' : 'Guide'}</span>
          </button>

          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={onToggleLang}
            className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 font-semibold"
          >
            {isFa ? 'EN' : 'فا'}
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Bar (Responsive Scrollable Tabs) */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-600/70 shadow-sm shadow-cyan-950/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{isFa ? item.labelFa : item.labelEn}</span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 font-mono border border-cyan-700/50">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
