import {lazy,Suspense} from 'react';
import {useLocale,translate as t} from './i18n';
import {labTools} from './labCatalog';
import {BenefitCalculator} from './BenefitCalculator';
const modules={
 twin:lazy(()=>import('../components/DigitalTwinView').then(m=>({default:m.DigitalTwinView}))),
 vision:lazy(()=>import('../components/Module1Vision').then(m=>({default:m.Module1Vision}))),
 profile:lazy(()=>import('../components/Module2Profilometry').then(m=>({default:m.Module2Profilometry}))),
 quality:lazy(()=>import('../components/Module3CentralQC').then(m=>({default:m.Module3CentralQC}))),
 pdm:lazy(()=>import('../components/Module4PdM').then(m=>({default:m.Module4PdM}))),
 oee:lazy(()=>import('../components/Module5OEE').then(m=>({default:m.Module5OEE}))),
 energy:lazy(()=>import('../components/Module6Energy').then(m=>({default:m.Module6Energy}))),
 engineering:lazy(()=>import('../components/SpringDesignTools').then(m=>({default:m.SpringDesignTools}))),
 metallurgy:lazy(()=>import('../components/MetallurgyLab').then(m=>({default:m.MetallurgyLab}))),
 spc:lazy(()=>import('../components/ProcessControlSPC').then(m=>({default:m.ProcessControlSPC}))),
 scada:lazy(()=>import('../components/FactoryScadaTopology').then(m=>({default:m.FactoryScadaTopology}))),
 camera:lazy(()=>import('../components/LiveCameraStation').then(m=>({default:m.LiveCameraStation}))),
};
export default function Simulator({active,onChange}:{active:string;onChange:(key:string)=>void}){const{locale}=useLocale(),index=['fa','en','ar','tr'].indexOf(locale),tool=labTools.find(m=>m.key===active)||labTools[0];const C=modules[tool.key as keyof typeof modules];return <section><div className="panel lab-guide"><span className="eyebrow">{['روش، کاربرد و معیار پذیرش','Method, application and acceptance','الطريقة والتطبيق والقبول','Yöntem, uygulama ve kabul'][index]}</span><h2>{t(tool.title)}</h2><p className="section-caption">{tool.summary[index]}</p>{tool.source&&<a className="text-button" href={tool.source} target="_blank" rel="noreferrer">{['مرجع روش','Method reference','مرجع الطريقة','Yöntem kaynağı'][index]}</a>}</div><div className="simulation-tabs">{labTools.map(m=><button key={m.key} className={active===m.key?'selected':''} onClick={()=>onChange(m.key)}>{t(m.title)}</button>)}</div><div className="simulation-panel"><Suspense fallback={<p>{t('در حال بارگذاری ابزار…')}</p>}>{tool.key==='roi'?<BenefitCalculator/>:<C key={tool.key} lang={locale}/>}</Suspense></div></section>;}
