import React, { useState, useEffect } from 'react';
import { TabId, Language, UserProfile } from './types';
import { USER_PROFILES } from './mockData';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { AlarmModal } from './components/AlarmModal';
import { LandingPage } from './components/LandingPage';
import { DigitalTwinView } from './components/DigitalTwinView';
import { Module1Vision } from './components/Module1Vision';
import { Module2Profilometry } from './components/Module2Profilometry';
import { Module3CentralQC } from './components/Module3CentralQC';
import { Module4PdM } from './components/Module4PdM';
import { Module5OEE } from './components/Module5OEE';
import { Module6Energy } from './components/Module6Energy';
import { MetallurgyLab } from './components/MetallurgyLab';
import { QualityCertificate } from './components/QualityCertificate';
import { LiveCameraStation } from './components/LiveCameraStation';
import { SpringDesignTools } from './components/SpringDesignTools';
import { FactoryScadaTopology } from './components/FactoryScadaTopology';
import { ProcessControlSPC } from './components/ProcessControlSPC';
import { FinancialRoiSimulator } from './components/FinancialRoiSimulator';
import { UserGuideView } from './components/UserGuideView';
import { ProposalsRoadmap } from './components/ProposalsRoadmap';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabId>('landing');
  const [lang, setLang] = useState<Language>('fa');
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(true);
  const [activeAlarmsCount, setActiveAlarmsCount] = useState<number>(2);

  // Set document direction when language changes
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Periodic telemetry simulation ticker
  useEffect(() => {
    if (!simulating) return;
    const interval = setInterval(() => {
      // Small randomized heartbeat
      setActiveAlarmsCount((prev) => (Math.random() > 0.85 ? (prev === 2 ? 1 : 2) : prev));
    }, 8000);
    return () => clearInterval(interval);
  }, [simulating]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const isFa = lang === 'fa';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
        onToggleLang={toggleLanguage}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAlarmModal={() => setIsAlarmModalOpen(true)}
        simulating={simulating}
        onToggleSimulation={() => setSimulating(!simulating)}
        activeAlarmsCount={activeAlarmsCount}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {currentTab === 'landing' && (
          <LandingPage onSelectTab={setCurrentTab} lang={lang} />
        )}
        {currentTab === 'digital_twin' && (
          <DigitalTwinView lang={lang} />
        )}
        {currentTab === 'module1_vision' && (
          <Module1Vision lang={lang} />
        )}
        {currentTab === 'module2_profilometry' && (
          <Module2Profilometry lang={lang} />
        )}
        {currentTab === 'module3_central_qc' && (
          <Module3CentralQC lang={lang} />
        )}
        {currentTab === 'module4_pdm' && (
          <Module4PdM lang={lang} />
        )}
        {currentTab === 'module5_oee' && (
          <Module5OEE lang={lang} />
        )}
        {currentTab === 'module6_energy' && (
          <Module6Energy lang={lang} />
        )}
        {currentTab === 'metallurgy_lab' && (
          <MetallurgyLab lang={lang} />
        )}
        {currentTab === 'quality_certificate' && (
          <QualityCertificate lang={lang} />
        )}
        {currentTab === 'live_camera' && (
          <LiveCameraStation lang={lang} />
        )}
        {currentTab === 'engineering_tools' && (
          <SpringDesignTools lang={lang} />
        )}
        {currentTab === 'factory_scada' && (
          <FactoryScadaTopology lang={lang} />
        )}
        {currentTab === 'spc_control' && (
          <ProcessControlSPC lang={lang} />
        )}
        {currentTab === 'roi_calculator' && (
          <FinancialRoiSimulator lang={lang} />
        )}
        {currentTab === 'user_guide' && (
          <UserGuideView lang={lang} onNavigateToTab={setCurrentTab} />
        )}
        {currentTab === 'proposals_roadmap' && (
          <ProposalsRoadmap lang={lang} />
        )}
      </main>

      {/* Role Switcher & Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        lang={lang}
      />

      {/* Real-time SCADA Alarm Console Modal */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        lang={lang}
        onAcknowledgeAlarm={() => setActiveAlarmsCount(prev => Math.max(0, prev - 1))}
      />

      {/* Industrial Footer */}
      <footer className="mt-16 bg-slate-950 border-t border-slate-800/80 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center">
              <img src="/logo.png" alt="Iran Coil Spring Co." className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {isFa ? 'کارخانه فنر لول ایران (سهامی عام)' : 'Iran Coil Spring Company (P.J.S.)'}
              </div>
              <div className="text-xs text-slate-400">
                {isFa 
                  ? 'بزرگترین تولیدکننده انواع فنرهای لول سیستم تعلیق خودروهای سواری، تجاری و ادوات ریلی در خاورمیانه'
                  : 'Leading Manufacturer of Suspension Coil Springs in the Middle East'}
              </div>
            </div>
          </div>

          <div className="text-xs text-center md:text-right space-y-1">
            <div className="flex items-center justify-center md:justify-end gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isFa ? 'پلتفرم هوشمند طراحی‌شده توسط: شبکه هوشمند ابتکار ویستا' : 'Designed by: Vesta Smart Network'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {isFa ? 'مستقر در پارک علم و فناوری استان سمنان • سازمان نظام صنفی رایانه‌ای' : 'Semnan Science & Tech Park • Computer Guild Organization'}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <div>
            © {new Date().getFullYear()} {isFa ? 'تمامی حقوق مادی و معنوی متعلق به کارخانه فنر لول ایران و ابتکار ویستا می‌باشد.' : 'All rights reserved. Iran Coil Spring Co. & Vesta Smart Network.'}
          </div>
          <div className="flex items-center gap-4 font-mono text-slate-400">
            <span>DIN EN 13906-1</span>
            <span>•</span>
            <span>DIN 2095</span>
            <span>•</span>
            <span>ISO 10816-3</span>
            <span>•</span>
            <span>ANSI/ISA-95</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
