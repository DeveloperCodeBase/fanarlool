import React, { useState } from 'react';
import { Language, PlantAlarm } from '../types';
import { PLANT_ALARMS } from '../mockData';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAcknowledgeAlarm?: (id: string) => void;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({ 
  isOpen, 
  onClose, 
  lang,
  onAcknowledgeAlarm 
}) => {
  const isFa = lang === 'fa';

  const [alarms, setAlarms] = useState<PlantAlarm[]>(PLANT_ALARMS);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'major' | 'minor'>('all');
  const [muted, setMuted] = useState(false);

  if (!isOpen) return null;

  const handleAcknowledge = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    if (onAcknowledgeAlarm) {
      onAcknowledgeAlarm(id);
    }
  };

  const filteredAlarms = alarms.filter(a => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const unacknowledgedCount = alarms.filter(a => !a.acknowledged).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-600 flex items-center justify-center text-rose-400 animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isFa ? 'کنسول آلارم‌های بلادرنگ کارخانه (SCADA Annunciator)' : 'Real-Time SCADA Alarm Annunciator'}
                </h3>
                {unacknowledgedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold">
                    {unacknowledgedCount} {isFa ? 'هشدار باز' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isFa ? 'پایش هشدارهای مطابق با استاندارد ISA-18.2' : 'ISA-18.2 Alarm Management Protocol'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className={`p-2 rounded-lg border transition-colors ${
                muted ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-rose-950 text-rose-300 border-rose-800'
              }`}
              title={muted ? (isFa ? 'صدا قطع است' : 'Unmute') : (isFa ? 'قطع صدای آژیر' : 'Mute')}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{isFa ? 'فیلتر شدت:' : 'Severity:'}</span>
            {(['all', 'critical', 'major', 'minor'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition-colors uppercase text-[11px] ${
                  filterSeverity === sev
                    ? 'bg-slate-800 text-white font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev === 'all' ? (isFa ? 'همه' : 'All') : sev}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500">
            {filteredAlarms.length} {isFa ? 'مورد یافت شد' : 'Items'}
          </span>
        </div>

        {/* Alarms List */}
        <div className="p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-800/60">
          {filteredAlarms.map((alarm) => (
            <div 
              key={alarm.id} 
              className={`pt-3.5 first:pt-0 p-3 rounded-xl transition-all border ${
                alarm.acknowledged 
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-70' 
                  : alarm.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-800/70 shadow-md'
                  : 'bg-amber-950/20 border-amber-800/70 shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      alarm.severity === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : alarm.severity === 'major'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-blue-950 text-blue-300 border border-blue-700'
                    }`}>
                      {alarm.severity}
                    </span>

                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {alarm.machineId} (ایستگاه {alarm.stageNumber})
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {alarm.timestamp}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{isFa ? alarm.titleFa : alarm.titleEn}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{isFa ? alarm.descriptionFa : alarm.descriptionEn}</p>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 flex items-start gap-2 mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-400 ml-1">{isFa ? 'اقدام اصلاحی توصیه‌شده (SOP):' : 'Corrective Action:'}</span>
                      {isFa ? alarm.recommendedActionFa : alarm.recommendedActionEn}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  {alarm.acknowledged ? (
                    <span className="text-[11px] font-mono text-slate-400 px-3 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {isFa ? 'تأیید شد' : 'Acknowledged'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alarm.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-slate-950 text-xs font-bold transition-all shadow-md font-mono"
                    >
                      {isFa ? 'تأیید مشاهده (ACK)' : 'Acknowledge'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>استاندارد ایمنی: ANSI/ISA-18.2-2016</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {isFa ? 'بستن کنسول' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
