import {lazy,Suspense} from 'react';
import {ArrowUpRight,BookOpen,ChevronDown,FlaskConical} from 'lucide-react';
import {useLocale,translate as t} from './i18n';
import {labGroups,labTools,type LabWords} from './labCatalog';
import {BenefitCalculator} from './BenefitCalculator';
const Workbench=lazy(()=>import('./IndustrialWorkbench'));
const Camera=lazy(()=>import('./CameraWorkbench'));
const copy={
 category:['حوزه کاربرد','Application area','مجال التطبيق','Uygulama alanı'],tool:['ابزار تحلیل','Analysis tool','أداة التحليل','Analiz aracı'],
 input:['ورودی مورد نیاز','Required inputs','المدخلات المطلوبة','Gerekli girdiler'],method:['روش و مدل','Method and model','الطريقة والنموذج','Yöntem ve model'],output:['خروجی قابل استفاده','Usable outputs','المخرجات القابلة للاستخدام','Kullanılabilir çıktılar'],
 steps:['راهنمای استفاده در سه گام','Three-step operating guide','دليل الاستخدام في ثلاث خطوات','Üç adımda kullanım rehberi'],related:['ادامه مسیر تحلیل','Continue the analysis workflow','متابعة مسار التحليل','Analiz akışına devam'],source:['مرجع مهندسی','Engineering reference','المرجع الهندسي','Mühendislik kaynağı'],
 stage:['فضای اجرای ابزار','Tool workbench','مساحة تشغيل الأداة','Araç çalışma alanı'],calculation:['محاسبه از ورودی شما','Calculated from your inputs','محسوب من مدخلاتك','Girdilerinizden hesaplanır'],evaluation:['ارزیابی شواهد آزمون','Test-evidence evaluation','تقييم أدلة الاختبار','Test kanıtı değerlendirmesi'],camera:['تصویر واقعی دستگاه','Live device video','فيديو فعلي من الجهاز','Gerçek cihaz görüntüsü']
} satisfies Record<string,LabWords>;

export default function Simulator({active,onChange}:{active:string;onChange:(key:string)=>void}){
 const {locale}=useLocale(),index=['fa','en','ar','tr'].indexOf(locale),s=(words:LabWords)=>words[index];
 const tool=labTools.find(item=>item.key===active)||labTools[0],group=labGroups.find(item=>item.id===tool.group)!;
 const related=tool.related.map(key=>labTools.find(item=>item.key===key)).filter((item):item is typeof tool=>Boolean(item));
 return <section className="lab-workspace" aria-label={t('آزمایشگاه')}>
  <div className="panel lab-overview">
   <div className="lab-controls"><label className="lab-selector-field">{s(copy.category)}<select value={tool.group} onChange={event=>{const next=labTools.find(item=>item.group===event.target.value);if(next)onChange(next.key);}}>{labGroups.map(item=><option key={item.id} value={item.id}>{s(item.title)}</option>)}</select></label><label className="lab-selector-field">{s(copy.tool)}<select value={tool.key} onChange={event=>onChange(event.target.value)}>{labTools.filter(item=>item.group===tool.group).map(item=><option key={item.key} value={item.key}>{t(item.title)}</option>)}</select></label></div>
   <div className="lab-overview-title"><div><span className="eyebrow">{s(group.title)}</span><h2><FlaskConical size={22} aria-hidden="true"/> {t(tool.title)}</h2></div><span className="lab-evidence">{s(copy[tool.evidence])}</span></div>
   <p className="section-caption">{s(tool.summary)}</p>
   <div className="lab-method-grid">{[[copy.input,tool.inputs],[copy.method,tool.method],[copy.output,tool.output]].map(([label,value])=><article className="lab-method-card" key={label[0]}><h3>{s(label)}</h3><p>{s(value)}</p></article>)}</div>
   <details className="lab-usage" key={tool.key}><summary><BookOpen size={16} aria-hidden="true"/>{s(copy.steps)}<ChevronDown size={16} aria-hidden="true"/></summary><ol className="lab-steps">{tool.steps.map((step,i)=><li key={step[0]}><span aria-hidden="true">{new Intl.NumberFormat(locale).format(i+1)}</span><p>{s(step)}</p></li>)}</ol></details>
  </div>
  <div className="lab-tool-stage"><h3 className="lab-stage-heading">{s(copy.stage)}</h3><Suspense fallback={<div className="panel" role="status">{t('در حال بارگذاری ابزار…')}</div>}>{tool.key==='roi'?<BenefitCalculator/>:tool.key==='camera'?<Camera/>:<Workbench key={tool.key} mode={tool.key}/>}</Suspense></div>
  <div className="lab-related"><span>{s(copy.related)}</span>{related.map(item=><button type="button" className="text-button" key={item.key} onClick={()=>onChange(item.key)}>{t(item.title)}</button>)}{tool.source&&<a className="text-button lab-source" href={tool.source} target="_blank" rel="noreferrer">{s(copy.source)}<ArrowUpRight size={14} aria-hidden="true"/></a>}</div>
 </section>;
}
