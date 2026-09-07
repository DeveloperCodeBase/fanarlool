import React from 'react';
import { UserProfile, Language } from '../types';
import { USER_PROFILES } from '../mockData';
import { X, ShieldCheck, Check, Key, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  lang: Language;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  lang,
}) => {
  if (!isOpen) return null;
  const isFa = lang === 'fa';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 relative"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Header with Logo */}
        <div className="p-6 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-700/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-600 shadow-md flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="فنر لول ایران" 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} 
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isFa ? 'ورود به پلتفرم هوشمند فنر لول ایران' : 'Fanar Lool Iran Smart Portal'}
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa 
                  ? 'انتخاب نقش کاربری و دسترسی به سامانه‌های بینایی، نت، OEE و انرژی' 
                  : 'Select your operational persona to explore designated privileges'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            {isFa ? 'نقش‌های سازمانی فعال در خطوط تولید:' : 'Active Operational Roles:'}
          </div>

          {USER_PROFILES.map((profile) => {
            const isSelected = profile.id === currentUser.id;
            return (
              <div
                key={profile.id}
                onClick={() => {
                  onSelectUser(profile);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-sm shadow-cyan-900/30'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-2xl w-10 h-10 rounded-lg bg-slate-950/80 border border-slate-700 flex items-center justify-center">
                    {profile.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-2">
                      {isFa ? profile.nameFa : profile.nameEn}
                      {isSelected && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.2 rounded-full">
                          {isFa ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-300 font-medium">
                      {isFa ? profile.roleTitleFa : profile.roleTitleEn}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isFa ? profile.departmentFa : profile.departmentEn}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700/40 text-slate-400 border border-slate-700 flex items-center justify-center group-hover:text-white">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'امنیت دسترسی مبتنی بر نقش (RBAC) با استانداردهای ISA-95' : 'Role-Based Access Control (ISA-95 compliant)'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700"
          >
            {isFa ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
