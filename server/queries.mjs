import {can,schemas} from './domain.mjs';
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function authorizedKinds(role){return Object.keys(schemas).filter(kind=>can(role,kind));}
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function recordQuery(db,role,query=new URLSearchParams()){
 const allowed=authorizedKinds(role),kind=query.get('kind')||'',status=query.get('status')||'',text=query.get('q')||'',from=query.get('from')||'',to=query.get('to')||'';
 const page=Number(query.get('page')||1),pageSize=Number(query.get('pageSize')||25);
 if(!Number.isSafeInteger(page)||page<1||page>100000||![25,50,100].includes(pageSize)||text.length>120)throw fail(400,'پارامتر جستجو معتبر نیست');
 if(kind&&!allowed.includes(kind))throw fail(403,'اجازه مشاهده این حوزه را ندارید');
 if(status&&!['draft','submitted','approved','rejected'].includes(status))throw fail(400,'وضعیت جستجو معتبر نیست');
 if((from&&!validDate(from))||(to&&!validDate(to))||(from&&to&&from>to))throw fail(400,'بازه تاریخ معتبر نیست');
 const clauses=[`r.kind IN (${allowed.map(()=>'?').join(',')})`],params=[...allowed];
 if(kind){clauses.push('r.kind=?');params.push(kind);}if(status){clauses.push('r.status=?');params.push(status);}
 if(text){clauses.push("(r.data LIKE ? ESCAPE '\\' OR r.id LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\')");const term='%'+text.replace(/[\\%_]/g,'\\$&')+'%';params.push(term,term,term);}
 const date="COALESCE(json_extract(r.data,'$.date'),json_extract(r.data,'$.due'),json_extract(r.data,'$.calibratedAt'),substr(r.created_at,1,10))";
 if(from){clauses.push(`${date}>=?`);params.push(from);}if(to){clauses.push(`${date}<=?`);params.push(to);}
 const where=clauses.join(' AND '),total=Number(db.prepare(`SELECT COUNT(*) n FROM records r JOIN users u ON u.id=r.creator WHERE ${where}`).get(...params).n);
 const records=db.prepare(`SELECT r.*,u.name creator_name FROM records r JOIN users u ON u.id=r.creator WHERE ${where} ORDER BY r.updated_at DESC,r.id LIMIT ? OFFSET ?`).all(...params,pageSize,(page-1)*pageSize).map(r=>({...r,data:JSON.parse(r.data)}));
 return {records,total,page,pageSize,pages:Math.ceil(total/pageSize),filter:{kind,status,q:text,from,to}};
}
export function productionSummary(db,from='',to=''){
 if((from&&!validDate(from))||(to&&!validDate(to))||(from&&to&&from>to))throw fail(400,'بازه تاریخ معتبر نیست');
 const clauses=["kind='production'","status='approved'"],params=[];
 if(from){clauses.push("json_extract(data,'$.date')>=?");params.push(from);}if(to){clauses.push("json_extract(data,'$.date')<=?");params.push(to);}
 const where=clauses.join(' AND ');
 const sums="COUNT(*) shifts, COALESCE(SUM(json_extract(data,'$.plannedMinutes')),0) planned, COALESCE(SUM(json_extract(data,'$.runMinutes')),0) run, COALESCE(SUM(json_extract(data,'$.total')),0) total, COALESCE(SUM(json_extract(data,'$.good')),0) good, COALESCE(SUM(json_extract(data,'$.idealCycleSeconds')*json_extract(data,'$.total')/60.0),0) ideal";
 const derive=r=>{const availability=r.planned?r.run/r.planned:null,performance=r.run?r.ideal/r.run:null,quality=r.total?r.good/r.total:null;return {...r,scrap:r.total-r.good,downtime:r.planned-r.run,availability,performance,quality,oee:availability!==null&&performance!==null&&quality!==null?availability*performance*quality:null};};
 const summary=derive(db.prepare(`SELECT ${sums} FROM records WHERE ${where}`).get(...params));
 const days=db.prepare(`SELECT json_extract(data,'$.date') date,${sums} FROM records WHERE ${where} GROUP BY json_extract(data,'$.date') ORDER BY date DESC LIMIT 366`).all(...params).map(derive);
 const dayCount=Number(db.prepare(`SELECT COUNT(DISTINCT json_extract(data,'$.date')) n FROM records WHERE ${where}`).get(...params).n);
 return {summary,days,dayCount,daysLimited:dayCount>days.length,scope:'all_approved_matching',from,to};
}
