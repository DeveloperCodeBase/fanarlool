export type User={id:string;username:string;name:string;role:string;roleLabel:string;mustChange:boolean};
export type Field={key:string;label:string;type:string;optional?:boolean;options?:string[];min?:number;max?:number;integer?:boolean};
export type Catalog={kind:string;title:string;description:string;fields:Field[];write:boolean;approve:boolean};
export type RecordRow={id:string;kind:string;data:Record<string,string|number>;status:string;creator:string;creator_name:string;version:number;created_at:string;updated_at:string};
export type Workspace={records:RecordRow[];catalog:Catalog[];roles:Record<string,string>;mode:string;sha:string;limited:boolean;kpis:{total:number;good:number;scrap:number;shifts:number;oee:number|null;availability:number|null;performance:number|null;quality:number|null}};
let csrf='';
export function setCsrf(value:string){csrf=value;}
export class ApiError extends Error{constructor(public status:number,message:string){super(message);}}
export async function api<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:body!==undefined?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{'X-CSRF-Token':csrf},body:body!==undefined?JSON.stringify(body):undefined});
 const value=await response.json().catch(()=>({error:'پاسخ سامانه معتبر نیست'}));if(!response.ok)throw new ApiError(response.status,value.error||'عملیات انجام نشد');return value;
}
export const faNumber=(n:number|null|undefined,digits=0)=>n==null?'—':new Intl.NumberFormat('fa-IR',{maximumFractionDigits:digits}).format(n);
export const faDate=(s:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(s));
export const statusLabels:Record<string,string>={draft:'پیش‌نویس',submitted:'در انتظار بررسی',approved:'تأیید شده',rejected:'رد شده'};
export function exportCsv(records:RecordRow[],catalog:Catalog){const safe=(s:unknown)=>'"'+String(s??'').replace(/^[=+\-@]/,"'").replace(/"/g,'""')+'"';const rows=[['شناسه','وضعیت','ثبت‌کننده',...catalog.fields.map(f=>f.label)],...records.map(r=>[r.id,statusLabels[r.status],r.creator_name,...catalog.fields.map(f=>r.data[f.key])])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`fanarlool-${catalog.kind}-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
