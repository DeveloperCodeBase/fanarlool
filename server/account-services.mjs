import {roles,schemas,can} from './domain.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const uuidPattern=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const shiftOptions=['day','morning','evening','night','rotating','unassigned'];
const integrityCache=new WeakMap();
export function databaseIntegrity(db,q,now=Date.now()){
 const cached=integrityCache.get(db);if(cached&&now-cached.checkedAtMs<300000)return cached;
 const result={database:q('PRAGMA quick_check').get().quick_check,checkedAt:new Date(now).toISOString(),checkedAtMs:now};integrityCache.set(db,result);return result;
}
const localizedDigits=value=>value.replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c<='٩'?0x660:0x6f0)));
const bounded=(value,max,min=0)=>typeof value==='string'&&value.length<=max&&value.trim().length>=min&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const pagination=query=>{const page=Number(query.get('page')||1),pageSize=Number(query.get('pageSize')||20);if(!Number.isInteger(page)||page<1||page>100000||!Number.isInteger(pageSize)||pageSize<1||pageSize>50)fail(400,'صفحه یا اندازه صفحه معتبر نیست');return{page,pageSize};};
const pageItems=(items,page,pageSize)=>({items:items.slice((page-1)*pageSize,page*pageSize),total:items.length,page,pageSize,totalPages:Math.ceil(items.length/pageSize),limited:false});
export function safeRequestRoute(path){
 const value=String(path||'').split('?')[0].replace(/\/api\/demo(?=\/)/,'/api');
 if(/^\/api\/(health|profile|activity|system|workspace|twin|audit|users)$/.test(value)||/^\/api\/auth\/(login|logout|me|password|sessions|revoke-others)$/.test(value)||/^\/api\/(records\/search|reports\/production|twin\/preview)$/.test(value))return value;
 if(/^\/api\/auth\/sessions\/(?:[a-f\d]{64}|:session)$/i.test(value))return'/api/auth/sessions/:session';
 if(/^\/api\/operations(?:\/(orders|lots|tasks|movements)(?:\/(?:[a-f\d-]{36}|:id))?)?$/.test(value))return value.replace(/\/[a-f\d-]{36}$/i,'/:id');
 if(/^\/api\/(records|users|twin)\/(?:[a-f\d-]{36}|:id)(?:\/(history|reset-password))?$/.test(value))return value.replace(/\/[a-f\d-]{36}(?=\/|$)/i,'/:id');
 return'/api/[unknown-route]';
}
export function safeAudit(row){
 let parsed={};try{const value=JSON.parse(row.details);if(value&&typeof value==='object'&&!Array.isArray(value))parsed=value;}catch{}
 const details={};
 for(const key of ['kind','from','to','status','previous','version','previousVersion','sourceId','ownerId','previousOwnerId','dueDate','previousDueDate','modelId','entityType','role','active','count','current','reason','note']){
  const value=parsed[key];if(typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))details[key]=value;else if(typeof value==='string')details[key]=value.slice(0,['note','reason'].includes(key)?1000:120);
 }
 if(Array.isArray(parsed.changedFields))details.changedFields=parsed.changedFields.filter(value=>typeof value==='string'&&/^[a-zA-Z_]{1,40}$/.test(value)).slice(0,20);
 return{id:row.id,action:typeof row.action==='string'&&/^[a-z_.]{1,80}$/.test(row.action)?row.action:'unknown',target:typeof row.target==='string'&&uuidPattern.test(row.target)?row.target:null,actorId:row.actor||null,actorName:row.actor_name||null,actorRole:row.actor_role||null,createdAt:row.created_at,details};
}
export function createAccountServices({db,q=sql=>db.prepare(sql),mutate,audit,userView,startedAt,requests,sha,demo,recoveryStatus}){
 const source=demo?'browser-demo-sqlite':'project-sqlite';
 const allowed=role=>Object.keys(schemas).filter(kind=>can(role,kind));
 const eventForRole=(row,role)=>{
  if(row.action?.startsWith('record.')||row.action?.startsWith('demo.record.')){const r=q('SELECT kind FROM records WHERE id=?').get(row.target);if(r&&!can(role,r.kind))return null;}
  if(row.action?.startsWith('twin.')&&!(can(role,'recipe')&&can(role,'asset')))return null;
  const result=safeAudit(row);
  if(row.action?.startsWith('operations.task.')){const task=q('SELECT kind FROM operation_tasks WHERE id=?').get(row.target);if(task&&!can(role,task.kind==='capa'?'ncr':'maintenance')){delete result.details.note;delete result.details.reason;}}
  return result;
 };
 const summary=u=>{
  const kinds=allowed(u.role),slots=kinds.map(()=>'?').join(','),owned=q(`SELECT status,COUNT(*) n FROM records WHERE creator=? AND kind IN (${slots}) GROUP BY status`).all(u.id,...kinds),ownedStatuses={draft:0,submitted:0,approved:0,rejected:0};for(const row of owned)ownedStatuses[row.status]=Number(row.n);
  const approving=kinds.filter(kind=>can(u.role,kind,'approve')),review=approving.length?Number(q(`SELECT COUNT(*) n FROM records WHERE status='submitted' AND creator<>? AND kind IN (${approving.map(()=>'?').join(',')})`).get(u.id,...approving).n):0;
  const taskKinds=['maintenance',...(can(u.role,'ncr')?['capa']:[])],openAssignedTasks=Number(q(`SELECT COUNT(*) n FROM operation_tasks WHERE owner_id=? AND status<>'closed' AND kind IN (${taskKinds.map(()=>'?').join(',')})`).get(u.id,...taskKinds).n);
  const auditWhere=`a.actor=? AND (a.action NOT LIKE 'record.%' AND a.action NOT LIKE 'demo.record.%' OR a.target IN (SELECT id FROM records WHERE kind IN (${slots})))${can(u.role,'recipe')&&can(u.role,'asset')?'':" AND a.action NOT LIKE 'twin.%'"}`;
  const recent=q('SELECT a.*,u.name actor_name,u.role actor_role FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE '+auditWhere+' ORDER BY a.id DESC LIMIT 20').all(u.id,...kinds).map(row=>eventForRole(row,u.role)).filter(Boolean);
  const cutoff=new Date(Date.now()-7*86400000).toISOString(),lastActive=q('SELECT MAX(last_seen) last FROM sessions WHERE user_id=?').get(u.id).last;
  return{ownedStatuses,ownedRecords:Object.values(ownedStatuses).reduce((a,b)=>a+b,0),ownDrafts:ownedStatuses.draft,awaitingReview:review,openAssignedTasks,activityLast7Days:Number(q('SELECT COUNT(*) n FROM audit a WHERE '+auditWhere+' AND a.created_at>=?').get(u.id,...kinds,cutoff).n),lastActiveAt:lastActive?new Date(lastActive).toISOString():null,recentEvents:recent,accessScope:kinds.map(kind=>({kind,read:true,write:can(u.role,kind,'write'),approve:can(u.role,kind,'approve')})),generatedAt:new Date().toISOString(),source};
 };
 const profile=u=>{const p=q('SELECT * FROM user_profiles WHERE user_id=?').get(u.id);let saved={};try{const value=JSON.parse(p?.preferences||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))saved=value;}catch{}const start=saved.startPage;const pages=['overview','profile','settings','activity','execution','reports','security','knowledge','models',...(u.role==='admin'?['system','users']:[]),...(can(u.role,'recipe')&&can(u.role,'asset')?['twin']:[])];return{user:userView(q('SELECT * FROM users WHERE id=?').get(u.id)),department:p?.department||'',jobTitle:p?.job_title||'',email:p?.email||'',phone:p?.phone||'',shift:p?.shift||'unassigned',location:p?.location||'',extension:p?.extension||'',bio:p?.bio||'',version:p?.version||0,updatedAt:p?.updated_at||null,preferences:{density:saved.density==='compact'?'compact':'comfortable',startPage:pages.includes(start)||Object.hasOwn(schemas,start)&&can(u.role,start)?start:'overview',notifications:saved.notifications!==false,locale:['fa','en','ar','tr'].includes(saved.locale)?saved.locale:'fa',dateFormat:'jalali',timezone:'Asia/Tehran'},summary:summary(u)};};
 const monitoring=(u,query)=>{
  if(u.role!=='admin')fail(403,'مانیتورینگ سامانه فقط برای مدیر سامانه است');
  const {page,pageSize}=pagination(query),term=(query.get('q')||'').trim(),role=query.get('role')||'',action=query.get('action')||'',statusClass=query.get('statusClass')||'',tab=query.get('tab')||'requests';
  if(term.length>120||role&&!roles[role]||action&&!/^[a-z_.]{1,80}$/.test(action)||statusClass&&!['2xx','3xx','4xx','5xx'].includes(statusClass)||!['requests','audit','sessions'].includes(tab))fail(400,'فیلتر مانیتورینگ معتبر نیست');
  const at=new Date().toISOString(),now=Date.now(),cutoff=new Date(now-86400000).toISOString();
  const total=table=>Number(q(`SELECT COUNT(*) n FROM ${table}`).get().n),liveSessions=q('SELECT user_id,MAX(last_seen) last,MAX(expires) expiry,COUNT(*) count FROM sessions WHERE expires>? AND last_seen>? GROUP BY user_id').all(now,now-1800000);
  const requestRows=requests.slice(-500).map(r=>{const person=r.actor?q('SELECT name,role FROM users WHERE id=?').get(r.actor):null;return{at:r.at,method:r.method,path:safeRequestRoute(r.path),status:r.status,durationMs:r.durationMs,actorId:r.actor||null,actorName:person?.name||null,actorRole:person?.role||null};});
  const requestFilter=requestRows.filter(r=>(!term||[r.path,r.actorName].join(' ').toLocaleLowerCase().includes(term.toLocaleLowerCase()))&&(!role||r.actorRole===role)&&(!statusClass||Math.floor(r.status/100)===Number(statusClass[0]))).reverse();
  const condition=[],params=[];if(term){condition.push("(u.name LIKE ? ESCAPE '\\' OR a.action LIKE ? ESCAPE '\\')");const pattern='%'+term.replace(/[\\%_]/g,'\\$&')+'%';params.push(pattern,pattern);}if(role){condition.push('u.role=?');params.push(role);}if(action){condition.push('a.action=?');params.push(action);}
  const where=condition.length?' WHERE '+condition.join(' AND '):'',auditTotal=Number(q('SELECT COUNT(*) n FROM audit a LEFT JOIN users u ON u.id=a.actor'+where).get(...params).n);
  const auditPage={items:q('SELECT a.*,u.name actor_name,u.role actor_role FROM audit a LEFT JOIN users u ON u.id=a.actor'+where+' ORDER BY a.id DESC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize).map(safeAudit),total:auditTotal,page,pageSize,totalPages:Math.ceil(auditTotal/pageSize),limited:false};
  const sessionRows=liveSessions.map(s=>{const person=q('SELECT name,role FROM users WHERE id=?').get(s.user_id);return{userId:s.user_id,userName:person?.name||null,role:person?.role||null,activeSessions:Number(s.count),lastSeen:new Date(s.last).toISOString(),maxExpiresAt:new Date(s.expiry).toISOString()};}).filter(s=>(!role||s.role===role)&&(!term||String(s.userName).toLocaleLowerCase().includes(term.toLocaleLowerCase()))).sort((a,b)=>b.lastSeen.localeCompare(a.lastSeen));
  const latencies=requestRows.map(r=>r.durationMs).sort((a,b)=>a-b),requestStats={sampleSize:requestRows.length,capacity:500,successes:requestRows.filter(r=>r.status<400).length,clientErrors:requestRows.filter(r=>r.status>=400&&r.status<500).length,serverErrors:requestRows.filter(r=>r.status>=500).length,averageMs:latencies.length?latencies.reduce((a,b)=>a+b,0)/latencies.length:null,p95Ms:latencies.length?latencies[Math.max(0,Math.ceil(latencies.length*0.95)-1)]:null,firstAt:requestRows[0]?.at||null,lastAt:requestRows.at(-1)?.at||null,source:'bounded-in-memory-request-ring'};
  const integrity=databaseIntegrity(db,q,now),database=integrity.database,schema=Number(q('PRAGMA user_version').get().user_version),databaseSizeBytes=Number(q('PRAGMA page_count').get().page_count)*Number(q('PRAGMA page_size').get().page_size);
  return{sha,demo,generatedAt:at,source,startedAt,uptimeSeconds:Math.round(process.uptime()),memoryMb:Math.round(process.memoryUsage().rss/1048576),memoryScope:'dedicated-api-process-including-demo-spaces',database,databaseSizeBytes,databaseSizeSource:'sqlite-page-count-times-page-size-excludes-wal',schema,health:{status:database==='ok'?'ok':'degraded',checkedAt:integrity.checkedAt,source:'sqlite-quick-check-cache',cacheTtlSeconds:300,queriesResponding:true,industrialConnectivity:false},transport:'Unix socket',backup:recoveryStatus?.('backup')||null,recovery:recoveryStatus?.('recovery')||null,counts:{users:total('users'),activeUsers:Number(q('SELECT COUNT(*) n FROM users WHERE active=1').get().n),records:total('records'),audit:total('audit'),sessions:liveSessions.reduce((n,s)=>n+Number(s.count),0),orders:total('operation_orders'),lots:total('operation_lots'),tasks:total('operation_tasks'),movements:total('operation_movements'),twinScenarios:total('twin_scenarios')},statuses:q('SELECT status,COUNT(*) count FROM records GROUP BY status').all(),statistics:{request:requestStats,audit:{total:total('audit'),last24h:Number(q('SELECT COUNT(*) n FROM audit WHERE created_at>=?').get(cutoff).n),failedLogins24h:Number(q("SELECT COUNT(*) n FROM audit WHERE action='auth.failed' AND created_at>=?").get(cutoff).n)},sessions:{active:liveSessions.reduce((n,s)=>n+Number(s.count),0),users:liveSessions.length,requiresPasswordChange:Number(q('SELECT COUNT(*) n FROM users WHERE active=1 AND must_change=1').get().n)},source},requestPage:pageItems(requestFilter,page,pageSize),auditPage,sessionPage:pageItems(sessionRows,page,pageSize),requests:requestFilter.slice(0,100),filters:{tab,q:term,role,action,statusClass},permissions:{read:true,manageAccounts:true},timezone:'Asia/Tehran'};
 };
 return async({path,method,body,u,query=new URLSearchParams(),send})=>{
  if(path==='/api/system'&&method==='GET'){send(200,monitoring(u,query));return true;}
  if(path!=='/api/profile')return false;
  if(method==='GET'){send(200,profile(u));return true;}
  if(method!=='PATCH')fail(404,'مسیر پروفایل پیدا نشد');
  const b=await body(),current=profile(u),values={name:b.name,department:b.department,jobTitle:b.jobTitle,email:b.email,phone:b.phone,shift:b.shift??current.shift,location:b.location??current.location,extension:b.extension??current.extension,bio:b.bio??current.bio};
  if(!bounded(values.name,100,2)||!bounded(values.department,100)||!bounded(values.jobTitle,100)||!bounded(values.email,120)||!bounded(values.phone,30)||!bounded(values.location,120)||!bounded(values.extension,8)||!bounded(values.bio,500)||!shiftOptions.includes(values.shift))fail(400,'اطلاعات پروفایل معتبر نیست');
  values.phone=localizedDigits(values.phone.trim());values.extension=localizedDigits(values.extension.trim());
  if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())||values.phone&&(!/^\+?[\d ()-]{5,30}$/.test(values.phone)||values.phone.replace(/\D/g,'').length<7||values.phone.replace(/\D/g,'').length>15)||values.extension&&!/^\d{1,8}$/.test(values.extension))fail(400,'ایمیل، تلفن یا داخلی پروفایل معتبر نیست');
  if(['role','active','password','username','userId'].some(key=>Object.hasOwn(b,key)))fail(400,'نقش و هویت سازمانی از پروفایل قابل تغییر نیست');
  const prefs=b.preferences;if(!prefs||Array.isArray(prefs)||!['comfortable','compact'].includes(prefs.density)||typeof prefs.notifications!=='boolean')fail(400,'تنظیمات شخصی معتبر نیست');
  const pages=['overview','profile','settings','activity','execution','reports','security','knowledge','models',...(u.role==='admin'?['system','users']:[]),...(can(u.role,'recipe')&&can(u.role,'asset')?['twin']:[])];
  if(typeof prefs.startPage!=='string'||!pages.includes(prefs.startPage)&&!(Object.hasOwn(schemas,prefs.startPage)&&can(u.role,prefs.startPage))||prefs.locale!==undefined&&!['fa','en','ar','tr'].includes(prefs.locale)||prefs.dateFormat!==undefined&&prefs.dateFormat!=='jalali'||prefs.timezone!==undefined&&prefs.timezone!=='Asia/Tehran')fail(400,'تنظیمات شخصی معتبر نیست');
  const preferences=JSON.stringify({density:prefs.density,startPage:prefs.startPage,notifications:prefs.notifications,locale:prefs.locale??current.preferences.locale,dateFormat:'jalali',timezone:'Asia/Tehran'});
  if(b.version!==undefined&&(!Number.isInteger(b.version)||b.version<0))fail(400,'نسخه پروفایل معتبر نیست');
  mutate(()=>{const actual=q('SELECT version FROM user_profiles WHERE user_id=?').get(u.id)?.version||0;if(b.version!==undefined&&b.version!==actual)fail(409,'پروفایل تغییر کرده؛ دوباره دریافت کنید');const at=new Date().toISOString();q('UPDATE users SET name=? WHERE id=?').run(values.name.trim(),u.id);q('INSERT INTO user_profiles(user_id,department,job_title,email,phone,preferences,shift,location,extension,bio,version,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET department=excluded.department,job_title=excluded.job_title,email=excluded.email,phone=excluded.phone,preferences=excluded.preferences,shift=excluded.shift,location=excluded.location,extension=excluded.extension,bio=excluded.bio,version=excluded.version,updated_at=excluded.updated_at').run(u.id,values.department.trim(),values.jobTitle.trim(),values.email.trim(),values.phone,preferences,values.shift,values.location.trim(),values.extension,values.bio.trim(),actual+1,at);audit(u.id,'profile.updated',u.id,{version:actual+1,changedFields:['name','department','jobTitle','email','phone','preferences','shift','location','extension','bio']});});send(200,profile(u));return true;
 };
}
