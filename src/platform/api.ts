import {getLocale,translate as t} from './i18n';
import {csvCell} from './csv';
export type User={id:string;username:string;name:string;role:string;roleLabel:string;mustChange:boolean};
export type Field={key:string;label:string;type:string;optional?:boolean;options?:string[];min?:number;max?:number;integer?:boolean};
export type Catalog={kind:string;title:string;description:string;fields:Field[];write:boolean;approve:boolean};
export type RecordRow={id:string;kind:string;data:Record<string,string|number>;status:string;creator:string;creator_name:string;version:number;created_at:string;updated_at:string};
export type Workspace={records:RecordRow[];catalog:Catalog[];roles:Record<string,string>;mode:string;sha:string;limited:boolean;kpis:{total:number;good:number;scrap:number;shifts:number;oee:number|null;availability:number|null;performance:number|null;quality:number|null}};
let csrf='';
let mode=sessionStorage.getItem('fanar-mode')==='demo'?'demo':'production';
export function setApiMode(value:'demo'|'production'){mode=value;csrf='';sessionStorage.setItem('fanar-mode',value);}
export function getApiMode(){return mode;}
export function setCsrf(value:string){csrf=value;}
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),30000);
 let response:Response;try{response=await fetch(`/api${mode==='demo'?'/demo':''}${path}`,{signal:controller.signal,method,credentials:'same-origin',headers:body!==undefined?{'Content-Type':'application/json','X-CSRF-Token':csrf,'Accept-Language':getLocale()}:{'X-CSRF-Token':csrf,'Accept-Language':getLocale()},body:body!==undefined?JSON.stringify(body):undefined});}catch{throw new ApiError(0,'ارتباط با سرور قطع شد؛ وضعیت ثبت را پس از اتصال از سوابق بررسی کنید.');}finally{window.clearTimeout(timer);}
 let value:any;try{value=await response.json();}catch{throw new ApiError(response.ok?502:response.status,'پاسخ سامانه معتبر نیست');}if(!response.ok)throw new ApiError(response.status,value.error||'عملیات انجام نشد');return value;
}
export const faNumber=(n:number|null|undefined,digits=0)=>n==null?'—':new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits}).format(n);
export const faDate=(s:string)=>new Intl.DateTimeFormat(getLocale()+'-u-ca-persian',{dateStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(s));
export const faDateTime=(s:string)=>new Intl.DateTimeFormat(getLocale()+'-u-ca-persian',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(s));
export const statusLabels:Record<string,string>={draft:'پیش‌نویس',submitted:'در انتظار بررسی',approved:'تأیید شده',rejected:'رد شده'};
export function exportCsv(records:RecordRow[],catalog:Catalog){const rows=[[t('شناسه'),t('وضعیت'),t('ثبت‌کننده'),...catalog.fields.map(f=>t(f.label))],...records.map(r=>[r.id,t(statusLabels[r.status]),r.creator_name,...catalog.fields.map(f=>f.type==='date'?faDate(String(r.data[f.key])):f.type==='select'?t(r.data[f.key]):r.data[f.key])])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Tehran'}).formatToParts(new Date()).map(p=>[p.type,p.value]));a.download=`fanarlool-${catalog.kind}-${parts.year}-${parts.month}-${parts.day}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
