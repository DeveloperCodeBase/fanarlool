import React, { useState } from 'react';
import { Language, SpringPhysicalSpec } from '../types';
import { HEAT_CHEMICAL_COMPOSITION, SPRING_CATALOG } from '../mockData';
import { 
  FileCheck, 
  Printer, 
  Download, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Stamp, 
  Building2, 
  Calendar, 
  Award,
  Hash,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface QualityCertificateProps {
  lang: Language;
}

export const QualityCertificate: React.FC<QualityCertificateProps> = ({ lang }) => {
  const isFa = lang === 'fa';

  const [selectedModel, setSelectedModel] = useState(SPRING_CATALOG[0]);
  const [certId, setCertId] = useState('CERT-EN10204-1404-0915-0842');
  const [printSuccess, setPrintSuccess] = useState(false);

  const handlePrintSimulation = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 4000);
  };

  return (
    <div className="space-y-8 pb-12" dir={isFa ? 'rtl' : 'ltr'}>
      
      {/* Title Header */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>{isFa ? 'گواهینامه بازرسی متالورژیکی و ابعادی ۳.۱' : 'EN 10204 Type 3.1 Inspection Certificate'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isFa ? 'نمونه آموزشی برگه کیفیت محصول' : 'Educational sample quality sheet'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {isFa 
              ? 'این نمونه با داده نمایشی تهیه شده است و گواهی رسمی، امضای دیجیتال یا تأییدیه مشتری محسوب نمی‌شود.'
              : 'Demonstration data only. This is not an official certificate, digital signature, or customer approval.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintSimulation}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isFa ? 'نمایش نمونه آموزشی' : 'Show educational sample'}</span>
          </button>
        </div>
      </div>

      {printSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isFa ? 'نمونه نمایشی آماده است؛ صدور یا چاپ رسمی انجام نشده است.' : 'Sample ready; no official issuance or printing took place.'}</span>
          </div>
          <span className="font-mono text-[10px]">SAMPLE ONLY</span>
        </div>
      )}

      {/* Part Model Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 shrink-0">{isFa ? 'انتخاب پارت‌نامبر جهت صدور:' : 'Select Part:'}</span>
        {SPRING_CATALOG.map((m: SpringPhysicalSpec) => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m)}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-mono ${
              selectedModel.id === m.id
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {m.modelName} ({m.application})
          </button>
        ))}
      </div>

      {/* The Printable Official Certificate Document Sheet */}
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 max-w-5xl mx-auto text-slate-100">
        
        {/* Certificate Letterhead */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-700 pb-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-600 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Iran Coil Spring Co." 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg'; }}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white">
                {isFa ? 'شرکت کارخانه فنر لول ایران (سهامی عام)' : 'IRAN COIL SPRING COMPANY (P.J.S.)'}
              </h1>
              <div className="text-xs text-slate-300">
                {isFa ? 'معاونت تضمین کیفیت و آزمایشگاه‌های متالورژی • سمنان، شهرک صنعتی' : 'Quality Assurance Division & Metallurgy Central Laboratories • Semnan'}
              </div>
            </div>
          </div>

          <div className="text-right sm:text-left text-xs font-mono space-y-1">
            <div className="text-emerald-400 font-bold text-sm">INSPECTION CERTIFICATE 3.1</div>
            <div className="text-slate-400 text-[11px]">Acc. to EN 10204 : 2004</div>
            <div className="text-slate-300">شماره سند: <strong className="text-white">{certId}</strong></div>
            <div className="text-slate-400">تاریخ صدور: {new Date().toLocaleDateString('fa-IR')}</div>
          </div>
        </div>

        {/* Customer & Product Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">مشتری / سفارش‌دهنده:</span>
            <strong className="text-slate-200">شرکت ساپکو (SAPCO - ایران‌خودرو)</strong>
          </div>
          <div>
            <span className="text-slate-500 block">نام و کد محصول:</span>
            <strong className="text-cyan-300">{selectedModel.id}</strong>
            <div className="text-[10px] text-slate-400">{selectedModel.application}</div>
          </div>
          <div>
            <span className="text-slate-500 block">شماره بچ و ذوب فولاد:</span>
            <strong className="text-amber-300">BT-1404-09B-12 / HT-98421</strong>
          </div>
          <div>
            <span className="text-slate-500 block">گرید آلیاژ فولاد:</span>
            <strong className="text-emerald-300">{selectedModel.material} (DIN EN 10089)</strong>
          </div>
        </div>

        {/* Section 1: Quantometric Chemical Heat Analysis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>۱. آنالیز کوانتومتری ترکیب شیمیایی ذوب (Chemical Composition Analysis - % wt)</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">روش آزمون: ASTM E415</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-slate-800 text-center">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2 px-3 text-right">عنصر</th>
                  <th className="py-2 px-2">نماد</th>
                  <th className="py-2 px-2">حد مجاز استاندارد</th>
                  <th className="py-2 px-2">مقدار آزمون کارخانه</th>
                  <th className="py-2 px-2">نتیجه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {HEAT_CHEMICAL_COMPOSITION.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-3 text-right text-slate-300">{c.element}</td>
                    <td className="py-1.5 px-2 font-bold text-cyan-300">{c.symbol}</td>
                    <td className="py-1.5 px-2 text-slate-400">{c.minVal.toFixed(2)} - {c.maxVal.toFixed(2)} %</td>
                    <td className="py-1.5 px-2 font-bold text-white">{c.actualVal.toFixed(2)} %</td>
                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        PASS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Mechanical & Metallurgical Properties */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>۲. خواص مکانیکی و عملیات حرارتی (Mechanical & Heat Treatment Verification)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">سختی مغز و سطح (DIN EN ISO 6508-1):</span>
              <strong className="text-base text-emerald-400 mt-1 block">51.8 HRC</strong>
              <span className="text-[10px] text-slate-500">مشخصه استاندارد: 50 الی 54 HRC</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">عمق کربن‌زدایی (Decarburization):</span>
              <strong className="text-base text-emerald-400 mt-1 block">0.03 mm</strong>
              <span className="text-[10px] text-slate-500">حداکثر مجاز: 0.12 mm (&lt; 1% d)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[11px]">شدت شات‌پینینگ (Almen A):</span>
              <strong className="text-base text-cyan-400 mt-1 block">0.36 mmA / 200%</strong>
              <span className="text-[10px] text-slate-500">مشخصه: 0.30 - 0.40 mmA (ساچمه S230)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Dimensional Verification (DIN 2095 Grade 1) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>۳. بازرسی هندسی و ابعادی (Dimensional Verification acc. to DIN 2095 Grade 1)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ارتفاع آزاد (L0):</span>
              <span className="text-sm font-bold text-white">{selectedModel.freeLength_L0} mm</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">قطر خارجی (Do):</span>
              <span className="text-sm font-bold text-white">{selectedModel.outerDiameter_Do} mm</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ثابت فنر (k):</span>
              <span className="text-sm font-bold text-emerald-400">{selectedModel.nominalRate_k.toFixed(1)} N/mm</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">عیوب سطحی بینایی:</span>
              <span className="text-sm font-bold text-emerald-400">ZERO DEFECTS</span>
            </div>
          </div>
        </div>

        {/* Digital Signatures, QR Code & Stamp Footer */}
        <div className="pt-6 border-t-2 border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-600 flex items-center justify-center">
              <QrCode className="w-14 h-14 text-slate-950" />
            </div>
            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
              <div>نمونه آموزشی بدون امضای دیجیتال</div>
              <div className="text-[10px] text-cyan-400 break-all max-w-xs">No verified certificate hash</div>
              <div className="text-amber-400 font-bold">برای ارائه به مشتری یا ارزیاب معتبر نیست.</div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-xs font-mono text-center">
            <div className="space-y-1">
              <div className="text-slate-400 text-[10px]">مسئول متالورژی و آزمایشگاه:</div>
              <div className="font-bold text-white">دکتر سارا حسینی</div>
              <div className="text-[10px] text-emerald-400">تأیید متالورژیکی شده</div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400 text-[10px]">مدیر تضمین کیفیت (QA Director):</div>
              <div className="font-bold text-white">مهندس احسان مرادی</div>
              <div className="text-[10px] text-emerald-400">تأیید نهایی و مجاز به ارسال</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
