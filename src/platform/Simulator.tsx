import {lazy,Suspense,useState} from 'react';
const modules=[
{key:'twin',title:'دوقلوی دیجیتال',component:lazy(()=>import('../components/DigitalTwinView').then(m=>({default:m.DigitalTwinView})))},
{key:'vision',title:'بینایی ماشین',component:lazy(()=>import('../components/Module1Vision').then(m=>({default:m.Module1Vision})))},
{key:'profile',title:'پروفیل‌سنجی',component:lazy(()=>import('../components/Module2Profilometry').then(m=>({default:m.Module2Profilometry})))},
{key:'quality',title:'کیفیت مرکزی',component:lazy(()=>import('../components/Module3CentralQC').then(m=>({default:m.Module3CentralQC})))},
{key:'pdm',title:'نگهداری پیش‌بینانه',component:lazy(()=>import('../components/Module4PdM').then(m=>({default:m.Module4PdM})))},
{key:'oee',title:'بهره‌وری',component:lazy(()=>import('../components/Module5OEE').then(m=>({default:m.Module5OEE})))},
{key:'energy',title:'انرژی',component:lazy(()=>import('../components/Module6Energy').then(m=>({default:m.Module6Energy})))},
{key:'engineering',title:'محاسبه‌گر فنر',component:lazy(()=>import('../components/SpringDesignTools').then(m=>({default:m.SpringDesignTools})))},
{key:'metallurgy',title:'متالورژی',component:lazy(()=>import('../components/MetallurgyLab').then(m=>({default:m.MetallurgyLab})))},
{key:'spc',title:'کنترل آماری',component:lazy(()=>import('../components/ProcessControlSPC').then(m=>({default:m.ProcessControlSPC})))},
{key:'scada',title:'توپولوژی خط',component:lazy(()=>import('../components/FactoryScadaTopology').then(m=>({default:m.FactoryScadaTopology})))},
{key:'roi',title:'سناریوی اقتصادی',component:lazy(()=>import('../components/FinancialRoiSimulator').then(m=>({default:m.FinancialRoiSimulator})))},
{key:'camera',title:'آزمایش دوربین',component:lazy(()=>import('../components/LiveCameraStation').then(m=>({default:m.LiveCameraStation})))},
];
export default function Simulator(){const[active,setActive]=useState('twin');const C=modules.find(m=>m.key===active)!.component;return <section><div className="notice amber"><strong>محیط شبیه‌سازی و مهندسی</strong><p>داده و تشخیص‌ها نمونه‌اند؛ اتصال PLC، هوش مصنوعی عملیاتی یا گواهی رسمی ارائه نمی‌شود. این بخش در شاخص‌های واقعی کارخانه محاسبه نمی‌شود. دوربین فقط با انتخاب شما و اجازه مرورگر فعال می‌شود.</p></div><div className="simulation-tabs">{modules.map(m=><button key={m.key} className={active===m.key?'selected':''} onClick={()=>setActive(m.key)}>{m.title}</button>)}</div><div className="simulation-panel"><Suspense fallback={<p>در حال بارگذاری ابزار…</p>}><C lang="fa"/></Suspense></div></section>;}
