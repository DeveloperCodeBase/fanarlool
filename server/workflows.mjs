import {randomUUID} from 'node:crypto';
import {roles,can} from './domain.mjs';

const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const idPattern=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const uuid=value=>{if(typeof value!=='string'||!idPattern.test(value))fail(400,'شناسه مرجع معتبر نیست');return value;};
const text=(value,label,max=120,min=1)=>{if(typeof value!=='string'||value.length>max||value.trim().length<min)fail(400,`${label} معتبر نیست`);return value.trim();};
const amount=(value,integer=false,zero=false)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<(zero?0:Number.MIN_VALUE)||value>1e7||(integer&&!Number.isInteger(value)))fail(400,'مقدار یا تعداد معتبر نیست');return value;};
const iso=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'2000-01-01'||value>'2100-12-31'||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)fail(400,'تاریخ معتبر نیست');return value;};
const note=(value,required=false)=>value===undefined&&!required?'':text(value,'شرح تصمیم',1000,required?10:0);
const today=()=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}`;};
const tableByType={order:'operation_orders',lot:'operation_lots',task:'operation_tasks',movement:'operation_movements'};
const permissionsFor=role=>({plan:['admin','production','executive'].includes(role),releaseOrders:['admin','executive'].includes(role),execute:['admin','production'].includes(role),quality:['admin','quality'].includes(role),assignMaintenance:['admin','executive','maintenance'].includes(role),assignCapa:['admin','executive','quality'].includes(role),inventory:['admin','production','engineering'].includes(role)});
const view=r=>Object.fromEntries(Object.entries(r).map(([key,value])=>[key==='creator'?'creatorId':key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),value]));

// The caller authenticates, validates CSRF and provides its session-bound transaction.
export function createWorkflows({db,q=sql=>db.prepare(sql),mutate,audit}){
 const get=(type,id)=>{const row=q(`SELECT * FROM ${tableByType[type]} WHERE id=?`).get(uuid(id));if(!row)fail(404,'پرونده عملیاتی پیدا نشد');return row;};
 const reference=(id,kind)=>{const row=q('SELECT * FROM records WHERE id=?').get(uuid(id));if(!row||row.kind!==kind)fail(404,'رکورد مرجع پیدا نشد');if(row.status!=='approved')fail(409,'مرجع باید تأییدشده باشد');return {...row,data:JSON.parse(row.data)};};
 const transact=fn=>{try{return mutate(fn);}catch(e){if(String(e.code||'').startsWith('SQLITE_CONSTRAINT')||/UNIQUE constraint failed/.test(e.message||''))fail(409,'کد تکراری یا کار فعال موجود است');throw e;}};
 const log=(u,type,id,action,details)=>audit(u.id,`operations.${type}.${action}`,id,{entityType:type,...details});
 const version=(row,b)=>{if(!Number.isInteger(b.version)||b.version<1)fail(400,'نسخه پرونده معتبر نیست');if(row.version!==b.version)fail(409,'نسخه پرونده تغییر کرده؛ اطلاعات را به‌روز کنید');};
 const change=(u,type,row,action,next,comment,extras={})=>{
  const changes={...extras,status:next,version:row.version+1,updated_at:new Date().toISOString()};
  const result=q(`UPDATE ${tableByType[type]} SET ${Object.keys(changes).map(k=>k+'=?').join(',')} WHERE id=? AND version=?`).run(...Object.values(changes),row.id,row.version);
  if(result.changes!==1)fail(409,'نسخه پرونده تغییر کرده؛ اطلاعات را به‌روز کنید');
  log(u,type,row.id,action,{from:row.status,to:next,version:row.version+1,note:comment,code:row.code,...(type==='task'?{kind:row.kind}:{}),...(action==='edit'?{changedFields:Object.keys(extras)}:{}),...(action==='assign'?{previousOwnerId:row.owner_id,ownerId:extras.owner_id,previousDueDate:row.due_date,dueDate:extras.due_date}:{})});
  return view({...row,...changes});
 };
 const refs=order=>{const recipe=reference(order.recipe_id,'recipe'),asset=reference(order.asset_id,'asset');if(recipe.data.part!==order.product)fail(409,'کد محصول با دستور ساخت یکسان نیست');return{recipe,asset};};
 const unresolved=(recordId)=>!q("SELECT id FROM operation_tasks WHERE record_id=? AND status='closed' AND NOT EXISTS (SELECT 1 FROM operation_tasks t WHERE t.record_id=? AND t.status<>'closed')").get(recordId,recordId);
 const maintenanceBlocked=asset=>q("SELECT id,data FROM records WHERE kind='maintenance' AND status<>'rejected'").all().some(r=>{const d=JSON.parse(r.data);return(d.asset===asset.id||d.asset===asset.data.code)&&d.priority==='بحرانی'&&unresolved(r.id);});
 const openNcr=code=>q("SELECT id,data FROM records WHERE kind='ncr' AND status<>'rejected'").all().some(r=>JSON.parse(r.data).batch===code&&unresolved(r.id));
 const qualityGate=(lot,order,inspectionId)=>{
  refs(order);
  const inspection=reference(inspectionId,'inspection'),d=inspection.data;
  if(d.batch!==lot.code||d.part!==order.product)fail(409,'بازرسی باید متعلق به همین بچ و محصول باشد');
  if(!Number.isInteger(lot.good)||lot.good<=0)fail(409,'بچ بدون قطعه سالم قابل آزادسازی نیست');
  if(d.defects!==0)fail(409,'بازرسی دارای عیب نیازمند بازکاری و بازرسی مجدد است');
  const timestamps=[inspection.created_at,inspection.updated_at,lot.created_at,lot.updated_at].map(value=>Date.parse(value));
  if(!timestamps.every(Number.isFinite)||timestamps[0]<timestamps[2]||timestamps[1]<timestamps[3])fail(409,'بازرسی باید پس از ایجاد بچ و اتمام تولید ثبت یا تأیید شده باشد');
  if(![d.measured,d.nominal,d.tolerance].every(Number.isFinite)||Math.abs(d.measured-d.nominal)>d.tolerance)fail(409,'اندازه بازرسی خارج از تلرانس است');
  const inspectedAt=inspection.created_at.slice(0,10),releaseDay=today();
  const calibration=q("SELECT data FROM records WHERE kind='calibration' AND status='approved'").all().some(r=>{const c=JSON.parse(r.data);return c.instrument===d.instrument&&c.calibratedAt<=inspectedAt&&c.expiresAt>=inspectedAt&&c.calibratedAt<=releaseDay&&c.expiresAt>=releaseDay;});
  if(!calibration)fail(409,'کالیبراسیون ابزار در بازرسی و آزادسازی معتبر نیست');
  if(openNcr(lot.code))fail(409,'عدم انطباق باز برای این بچ وجود دارد');
  return inspection;
 };
 const balance=(material,lot,unit)=>Number(q("SELECT COALESCE(SUM(CASE WHEN direction='issue' THEN -CAST(ROUND(quantity*1000) AS INTEGER) ELSE CAST(ROUND(quantity*1000) AS INTEGER) END),0)/1000.0 AS balance FROM operation_movements WHERE material=? AND lot=? AND unit=?").get(material,lot,unit).balance);
 const stockRows=()=>q("SELECT material,lot,unit,SUM(CASE WHEN direction='issue' THEN -CAST(ROUND(quantity*1000) AS INTEGER) ELSE CAST(ROUND(quantity*1000) AS INTEGER) END)/1000.0 AS balance FROM operation_movements GROUP BY material,lot,unit ORDER BY material,lot,unit").all();
 const recordView=(role,id)=>{const r=q('SELECT * FROM records WHERE id=?').get(id);return r&&can(role,r.kind)?{...r,data:JSON.parse(r.data)}:null;};
 const eventView=(r,role)=>{let d={};try{d=JSON.parse(r.details);}catch{}const details={};const task=r.action.startsWith('operations.task.')?q('SELECT kind FROM operation_tasks WHERE id=?').get(r.target):null;const allowNote=!task||can(role,task.kind==='capa'?'ncr':'maintenance');for(const key of ['from','to','version','note','code','kind','previousOwnerId','ownerId','previousDueDate','dueDate'])if((key!=='note'||allowNote)&&(typeof d[key]==='string'||typeof d[key]==='number'))details[key]=d[key];if(Array.isArray(d.changedFields))details.changedFields=d.changedFields.filter(key=>['customer','product','quantity','start_date','due_date','priority','recipe_id','asset_id'].includes(key));return{id:r.id,entityType:['order','lot','task','movement'].includes(d.entityType)?d.entityType:r.action.split('.')[1],entityId:r.target,action:r.action,actorId:r.actor,actorName:r.name||null,actorRole:r.role||null,createdAt:r.created_at,details};};
 const searchList=(type,query)=>{
  const tab=type+'s';
  if(query.get('tab')&&query.get('tab')!==tab)return{rows:[],count:0};
  const conditions=[],params=[],term=query.get('q')?.trim()||'',status=query.get('status');
  if(term){const columns={order:['code','customer','product'],lot:['code','material_lot'],task:['record_id','owner_id','kind'],movement:['code','material','lot']}[type];conditions.push('('+columns.map(c=>c+" LIKE ? ESCAPE '\\'").join(' OR ')+')');const pattern='%'+term.replace(/[\\%_]/g,'\\$&')+'%';params.push(...columns.map(()=>pattern));}
  if(status){conditions.push(type==='movement'?'direction=?':'status=?');params.push(status);}
  const where=conditions.length?' WHERE '+conditions.join(' AND '):'',table=tableByType[type];
  return{rows:q(`SELECT * FROM ${table}${where} ORDER BY created_at DESC,id DESC LIMIT 200`).all(...params).map(view),count:Number(q(`SELECT COUNT(*) AS count FROM ${table}${where}`).get(...params).count)};
 };
 return async function handle({path,method,body,u,send,query=new URLSearchParams()}){
  if(path!=='/api/operations'&&!path.startsWith('/api/operations/'))return false;
  if(!u||!roles[u.role])fail(403,'دسترسی به عملیات مجاز نیست');
  const p=permissionsFor(u.role),allow=flag=>{if(!flag)fail(403,'دسترسی این عملیات برای نقش شما مجاز نیست');};
  if(path==='/api/operations'&&method==='GET'){
   if((query.get('q')||'').length>120)fail(400,'عبارت جستجو طولانی است');
   if(query.get('tab')&&!['orders','lots','tasks','movements'].includes(query.get('tab')))fail(400,'حوزه جستجو معتبر نیست');
   const allowedStatuses=query.get('tab')==='movements'?['receipt','issue','return']:['draft','released','cancelled','completed','queued','running','quality_hold','blocked','open','in_progress','verification','closed'];
   if(query.get('status')&&!allowedStatuses.includes(query.get('status')))fail(400,'وضعیت جستجو معتبر نیست');
   const lists=Object.fromEntries(Object.keys(tableByType).map(type=>[type+'s',searchList(type,query)])),stock=stockRows();
   const events=q("SELECT a.id,a.actor,a.action,a.target,a.details,a.created_at,u.name,u.role FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE a.action LIKE 'operations.%' ORDER BY a.id DESC LIMIT 200").all().map(r=>eventView(r,u.role));
   send(200,{...Object.fromEntries(Object.entries(lists).map(([key,value])=>[key,value.rows])),stock,events,staff:q('SELECT id,name,role FROM users WHERE active=1 ORDER BY name').all(),permissions:p,totalCounts:Object.fromEntries(Object.entries(lists).map(([key,value])=>[key,value.count])),limited:Object.fromEntries(Object.entries(lists).map(([key,value])=>[key,value.count>200])),summary:{activeOrders:Number(q("SELECT COUNT(*) n FROM operation_orders WHERE status='released'").get().n),overdueOrders:Number(q("SELECT COUNT(*) n FROM operation_orders WHERE status='released' AND due_date<?").get(today()).n),heldLots:Number(q("SELECT COUNT(*) n FROM operation_lots WHERE status IN ('quality_hold','blocked')").get().n),openTasks:Number(q("SELECT COUNT(*) n FROM operation_tasks WHERE status<>'closed'").get().n),zeroStock:stock.filter(s=>s.balance<=0).length}});return true;
  }
  const match=path.match(/^\/api\/operations\/(orders|lots|tasks|movements)(?:\/([^/]+))?$/);
  if(!match)fail(404,'مسیر عملیات پیدا نشد');
  const [,plural,id]=match,type=plural.slice(0,-1);
  if(method==='GET'&&id){
   const entity=get(type,id);
   if(type==='lot'){
    const order=get('order',entity.order_id),movementCount=Number(q('SELECT COUNT(*) n FROM operation_movements WHERE production_lot_id=?').get(id).n);
    const where="a.action LIKE 'operations.%' AND (a.target IN (?,?) OR a.target IN (SELECT id FROM operation_movements WHERE production_lot_id=?))";
    const eventCount=Number(q(`SELECT COUNT(*) n FROM audit a WHERE ${where}`).get(id,order.id,id).n);
    send(200,{lot:view(entity),order:view(order),recipe:recordView(u.role,order.recipe_id),asset:recordView(u.role,order.asset_id),inspection:entity.inspection_id?recordView(u.role,entity.inspection_id):null,movements:q('SELECT * FROM operation_movements WHERE production_lot_id=? ORDER BY created_at DESC,id DESC LIMIT 200').all(id).map(view),events:q(`SELECT a.*,u.name,u.role FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE ${where} ORDER BY a.id DESC LIMIT 200`).all(id,order.id,id).map(r=>eventView(r,u.role)),totalCounts:{movements:movementCount,events:eventCount},limited:{movements:movementCount>200,events:eventCount>200}});
   }else if(type==='order'){const count=Number(q('SELECT COUNT(*) n FROM operation_lots WHERE order_id=?').get(id).n);send(200,{order:view(entity),lots:q('SELECT * FROM operation_lots WHERE order_id=? ORDER BY created_at DESC,id DESC LIMIT 200').all(id).map(view),totalCounts:{lots:count},limited:{lots:count>200}});}
   else if(type==='task')send(200,{task:view(entity),record:recordView(u.role,entity.record_id)});
   else send(200,{movement:view(entity)});
   return true;
  }
  if((method!=='POST'||id)&&(method!=='PATCH'||!id))fail(404,'مسیر عملیات پیدا نشد');
  if(type==='movement'&&method==='PATCH')fail(409,'گردش ثبت‌شده قابل تغییر نیست');
  const b=typeof body==='function'?await body():body;
  if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'درخواست معتبر نیست');
  if(method==='POST'){
   const createdAt=new Date().toISOString(),newId=randomUUID();let row;
   if(type==='order'){
    allow(p.plan);
    const values={id:newId,code:text(b.code,'کد سفارش',80),customer:text(b.customer,'مشتری',200),product:text(b.product,'محصول'),quantity:amount(b.quantity,true),start_date:iso(b.startDate),due_date:iso(b.dueDate),priority:b.priority,recipe_id:uuid(b.recipeId),asset_id:uuid(b.assetId),creator:u.id,status:'draft',version:1,created_at:createdAt,updated_at:createdAt};
    if(values.start_date>values.due_date||!['normal','high','critical'].includes(values.priority))fail(400,'بازه سفارش یا اولویت معتبر نیست');
    row=transact(()=>{refs(values);q(`INSERT INTO operation_orders(${Object.keys(values).join(',')}) VALUES(${Object.keys(values).map(()=>'?').join(',')})`).run(...Object.values(values));log(u,type,newId,'created',{to:'draft',version:1,code:values.code});return view(values);});
   }else if(type==='lot'){
    allow(p.execute);const orderId=uuid(b.orderId),code=text(b.code,'کد بچ',80),materialLot=text(b.materialLot,'بچ مواد'),quantity=amount(b.quantity,true);
    row=transact(()=>{const order=get('order',orderId);if(order.status!=='released')fail(409,'سفارش باید آزادشده باشد');refs(order);const planned=Number(q("SELECT COALESCE(SUM(CASE WHEN status='released' THEN good ELSE quantity END),0) n FROM operation_lots WHERE order_id=?").get(order.id).n);if(planned+quantity>order.quantity)fail(409,'مجموع برنامه بچ از مقدار سفارش بیشتر است');
     const values={id:newId,order_id:order.id,code,material_lot:materialLot,quantity,good:null,scrap:null,inspection_id:null,creator:u.id,status:'queued',version:1,created_at:createdAt,updated_at:createdAt};q(`INSERT INTO operation_lots(${Object.keys(values).join(',')}) VALUES(${Object.keys(values).map(()=>'?').join(',')})`).run(...Object.values(values));log(u,type,newId,'created',{to:'queued',version:1,code});return view(values);});
   }else if(type==='task'){
    const recordId=uuid(b.recordId),ownerId=uuid(b.ownerId),dueDate=iso(b.dueDate);
    row=transact(()=>{const record=q('SELECT * FROM records WHERE id=?').get(recordId);if(!record||!['maintenance','ncr'].includes(record.kind))fail(404,'مرجع کار اجرایی پیدا نشد');const kind=record.kind==='maintenance'?'maintenance':'capa';allow(kind==='maintenance'?p.assignMaintenance:p.assignCapa);if(record.status!=='approved')fail(409,'مرجع کار باید تأییدشده باشد');const owner=q('SELECT role FROM users WHERE id=? AND active=1').get(ownerId);if(!owner||!['admin',kind==='maintenance'?'maintenance':'quality'].includes(owner.role))fail(400,'مسئول کار فعال و متناسب با حوزه نیست');
     if(q("SELECT id FROM operation_tasks WHERE record_id=? AND status<>'closed'").get(recordId))fail(409,'برای این مرجع کار فعال موجود است');
     const values={id:newId,record_id:recordId,owner_id:ownerId,due_date:dueDate,kind,creator:u.id,status:'open',version:1,created_at:createdAt,updated_at:createdAt};q(`INSERT INTO operation_tasks(${Object.keys(values).join(',')}) VALUES(${Object.keys(values).map(()=>'?').join(',')})`).run(...Object.values(values));log(u,type,newId,'created',{to:'open',version:1,kind});return view(values);});
   }else{
    allow(p.inventory);const code=text(b.code,'کد گردش',80),material=text(b.material,'ماده'),lot=text(b.lot,'بچ مواد'),unit=b.unit,direction=b.direction,quantity=amount(b.quantity,unit==='piece'),comment=b.note===undefined?'':text(b.note,'شرح گردش',1000,0),productionLotId=b.productionLotId===undefined||b.productionLotId===null?null:uuid(b.productionLotId);
    if(unit==='kg'&&(quantity<0.001||Number(quantity.toFixed(3))!==quantity))fail(400,'مقدار کیلوگرم باید با دقت حداکثر سه رقم اعشار ثبت شود');
    if(!['kg','piece'].includes(unit)||!['receipt','issue','return'].includes(direction))fail(400,'واحد یا جهت گردش معتبر نیست');
    allow(direction==='receipt'?['admin','engineering'].includes(u.role):direction==='return'?['admin','production'].includes(u.role):p.inventory);
    row=transact(()=>{if(q('SELECT id FROM operation_movements WHERE code=?').get(code))fail(409,'کد گردش قبلاً ثبت شده است');
     if(direction!=='receipt'){
      if(!productionLotId)fail(400,'گردش مصرف یا برگشت به بچ تولید نیاز دارد');const productionLot=get('lot',productionLotId),order=get('order',productionLot.order_id),{recipe}=refs(order);
      if(lot!==productionLot.material_lot||material!==recipe.data.material)fail(409,'ماده و بچ مواد با سفارش تولید یکسان نیست');
      if(direction==='issue'&&(!['queued','running'].includes(productionLot.status)||order.status!=='released'))fail(409,'مصرف فقط برای بچ صف یا در حال تولید مجاز است');
      if(direction==='return'){const issued=Number(q("SELECT COALESCE(SUM(CASE WHEN direction='issue' THEN CAST(ROUND(quantity*1000) AS INTEGER) WHEN direction='return' THEN -CAST(ROUND(quantity*1000) AS INTEGER) ELSE 0 END),0)/1000.0 n FROM operation_movements WHERE production_lot_id=? AND material=? AND lot=? AND unit=?").get(productionLot.id,material,lot,unit).n);if(quantity>issued)fail(409,'برگشت از مصرف ثبت‌شده بیشتر است');}
     }else if(productionLotId)get('lot',productionLotId);
     const current=balance(material,lot,unit);if(direction==='issue'&&quantity>current)fail(409,'موجودی برای مصرف کافی نیست');if(direction!=='issue'&&current+quantity>1e12)fail(409,'موجودی از سقف مجاز بیشتر است');
     const values={id:newId,code,material,lot,unit,direction,quantity,production_lot_id:productionLotId,note:comment,creator:u.id,version:1,created_at:createdAt,updated_at:createdAt};q(`INSERT INTO operation_movements(${Object.keys(values).join(',')}) VALUES(${Object.keys(values).map(()=>'?').join(',')})`).run(...Object.values(values));log(u,type,newId,'created',{code,version:1,note:comment});return view(values);});
   }
   send(201,row);return true;
  }
  const comment=note(b.note,['cancel','block','rework','complete','verify','reopen','assign'].includes(b.action));
  const row=transact(()=>{
   const current=get(type,id);version(current,b);
   if(type==='order'){
    if(b.action==='edit'){
     allow(u.role==='admin'||u.id===current.creator);
     if(current.status!=='draft')fail(409,'فقط پیش‌نویس سفارش قابل ویرایش است');
     if(q('SELECT id FROM operation_lots WHERE order_id=?').get(current.id))fail(409,'سفارش دارای بچ قابل ویرایش نیست');
     const d=b.data;if(!d||typeof d!=='object'||Array.isArray(d))fail(400,'اطلاعات ویرایش سفارش معتبر نیست');
     if('id' in d||'code' in d)fail(400,'شناسه و کد سفارش قابل ویرایش نیستند');
     const changes={customer:text(d.customer,'مشتری',200),product:text(d.product,'محصول'),quantity:amount(d.quantity,true),start_date:iso(d.startDate),due_date:iso(d.dueDate),priority:d.priority,recipe_id:uuid(d.recipeId),asset_id:uuid(d.assetId)};
     if(changes.start_date>changes.due_date||!['normal','high','critical'].includes(changes.priority))fail(400,'بازه سفارش یا اولویت معتبر نیست');
     refs({...current,...changes});return change(u,type,current,b.action,'draft',comment,changes);
    }
    allow(p.releaseOrders);if(current.status!=='draft'&&b.action==='release')fail(409,'فقط پیش‌نویس سفارش آزاد می‌شود');
    if(b.action==='release'){if(u.id===current.creator)fail(403,'آزادسازی سفارش باید مستقل از ثبت‌کننده باشد');refs(current);return change(u,type,current,b.action,'released',comment);}
    if(b.action==='cancel'){if(!['draft','released'].includes(current.status))fail(409,'سفارش قابل لغو نیست');if(q("SELECT id FROM operation_lots WHERE order_id=? AND status IN ('running','quality_hold','released')").get(current.id))fail(409,'سفارش با بچ شروع‌شده یا آزادشده قابل لغو نیست');return change(u,type,current,b.action,'cancelled',comment);}
   }else if(type==='lot'){
    if(current.status==='released')fail(409,'بچ آزادشده قابل تغییر نیست');const order=get('order',current.order_id);
    if(b.action==='start'){allow(p.execute);if(current.status!=='queued'||order.status!=='released')fail(409,'بچ یا سفارش آماده شروع نیست');const{asset}=refs(order);if(maintenanceBlocked(asset))fail(409,'نگهداری بحرانی باز مانع شروع این تجهیز است');return change(u,type,current,b.action,'running',comment);}
    if(b.action==='finish'){allow(p.execute);if(current.status!=='running')fail(409,'فقط بچ در حال تولید قابل اتمام است');const good=amount(b.good,true,true),scrap=amount(b.scrap,true,true);if(good+scrap!==current.quantity)fail(400,'تعداد سالم و ضایعات باید برابر مقدار برنامه باشد');return change(u,type,current,b.action,'quality_hold',comment,{good,scrap,inspection_id:null});}
    if(b.action==='release'){allow(p.quality);if(current.status!=='quality_hold')fail(409,'بچ باید در انتظار کیفیت باشد');if(u.id===current.creator)fail(403,'آزادسازی بچ باید مستقل از ثبت‌کننده باشد');const inspection=qualityGate(current,order,b.inspectionId);const next=change(u,type,current,b.action,'released',comment,{inspection_id:inspection.id});const completed=Number(q("SELECT COALESCE(SUM(good),0) n FROM operation_lots WHERE order_id=? AND status='released'").get(order.id).n);if(completed>=order.quantity)change(u,'order',order,'completed','completed',comment);return next;}
    if(b.action==='block'){allow(p.quality);if(!['queued','running','quality_hold'].includes(current.status))fail(409,'بچ در این وضعیت قابل قرنطینه نیست');return change(u,type,current,b.action,'blocked',comment);}
    if(b.action==='rework'){allow(p.execute);if(current.status!=='blocked'||order.status!=='released')fail(409,'فقط بچ قرنطینه در سفارش فعال بازکاری می‌شود');return change(u,type,current,b.action,'queued',comment,{good:null,scrap:null,inspection_id:null});}
   }else if(type==='task'){
    const domainPermission=current.kind==='maintenance'?p.assignMaintenance:p.assignCapa;
    if(b.action==='assign'){
     allow(domainPermission);if(!['open','in_progress'].includes(current.status))fail(409,'تخصیص مجدد فقط برای کار باز یا در حال انجام مجاز است');
     const ownerId=uuid(b.ownerId),dueDate=iso(b.dueDate),owner=q('SELECT role FROM users WHERE id=? AND active=1').get(ownerId);
     if(!owner||!['admin',current.kind==='maintenance'?'maintenance':'quality'].includes(owner.role))fail(400,'مسئول کار فعال و متناسب با حوزه نیست');
     return change(u,type,current,b.action,'open',comment,{owner_id:ownerId,due_date:dueDate});
    }
    if(['start','complete'].includes(b.action)){const owner=q('SELECT role FROM users WHERE id=? AND active=1').get(current.owner_id);if(!owner||!['admin',current.kind==='maintenance'?'maintenance':'quality'].includes(owner.role))fail(409,'مسئول کار دیگر صلاحیت فعال این حوزه را ندارد');}
    if(b.action==='start'){if(u.id!==current.owner_id)fail(403,'شروع کار فقط توسط مسئول تخصیص‌یافته مجاز است');if(current.status!=='open')fail(409,'کار باید باز باشد');return change(u,type,current,b.action,'in_progress',comment);}
    if(b.action==='complete'){if(u.id!==current.owner_id)fail(403,'تکمیل کار فقط توسط مسئول تخصیص‌یافته مجاز است');if(current.status!=='in_progress')fail(409,'کار باید در حال انجام باشد');return change(u,type,current,b.action,'verification',comment);}
    if(b.action==='verify'){allow(['admin',current.kind==='maintenance'?'maintenance':'quality'].includes(u.role));if(u.id===current.owner_id)fail(403,'راستی‌آزمایی باید مستقل از مسئول کار باشد');if(current.status!=='verification')fail(409,'کار باید در انتظار راستی‌آزمایی باشد');return change(u,type,current,b.action,'closed',comment);}
    if(b.action==='reopen'){allow(domainPermission);if(current.status!=='closed')fail(409,'فقط کار بسته‌شده دوباره باز می‌شود');if(q("SELECT id FROM operation_tasks WHERE record_id=? AND status<>'closed'").get(current.record_id))fail(409,'برای این مرجع کار فعال موجود است');return change(u,type,current,b.action,'open',comment);}
   }
   fail(400,'اقدام اجرایی معتبر نیست');
  });
  send(200,row);return true;
 };
}
