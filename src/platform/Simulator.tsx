import {lazy,Suspense} from 'react';
import {useLocale,translate as t} from './i18n';
import {labTools} from './labCatalog';
import {BenefitCalculator} from './BenefitCalculator';
const Workbench=lazy(()=>import('./IndustrialWorkbench'));
const Camera=lazy(()=>import('./CameraWorkbench'));
export default function Simulator({active,onChange}:{active:string;onChange:(key:string)=>void}){const{locale}=useLocale(),index=['fa','en','ar','tr'].indexOf(locale),tool=labTools.find(m=>m.key===active)||labTools[0];return <section><div className="panel lab-guide"><span className="eyebrow">{['روش، کاربرد و معیار پذیرش','Method, application and acceptance','الطريقة والتطبيق والقبول','Yöntem, uygulama ve kabul'][index]}</span><h2>{t(tool.title)}</h2><p className="section-caption">{tool.summary[index]}</p>{tool.source&&<a className="text-button" href={tool.source} target="_blank" rel="noreferrer">{['مرجع روش','Method reference','مرجع الطريقة','Yöntem kaynağı'][index]}</a>}</div><div className="simulation-tabs">{labTools.map(m=><button key={m.key} className={active===m.key?'selected':''} onClick={()=>onChange(m.key)}>{t(m.title)}</button>)}</div><div className="simulation-panel"><Suspense fallback={<p>{t('در حال بارگذاری ابزار…')}</p>}>{tool.key==='roi'?<BenefitCalculator/>:tool.key==='camera'?<Camera/>:<Workbench key={tool.key} mode={tool.key}/>}</Suspense></div></section>;}
