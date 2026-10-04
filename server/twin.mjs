import {randomUUID} from 'node:crypto';
import {can} from './domain.mjs';
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const uuid=value=>{if(typeof value!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value))fail(400,'شناسه مرجع معتبر نیست');return value;};
const text=(value,max,min=1)=>{if(typeof value!=='string'||value.length>max||value.trim().length<min)fail(400,'عنوان یا دلیل سناریو معتبر نیست');return value.trim();};
const model={id:'compression-spring-wahl-v1',units:{length:'mm',force:'N',stress:'MPa',rate:'N/mm'},assumptions:['round_wire_cylindrical_compression_spring','linear_elastic_response_before_coil_contact','squared_ground_ends','baseline_total_coils_equals_active_plus_two','supplied_shear_modulus_and_allowable_stress_require_material_evidence','no_fatigue_life_or_machine_control'],liveConnection:false,factoryValidated:false};
export function validateTwinInputs(value){
 if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'ورودی فیزیکی سناریو معتبر نیست');
 const bounds={wireDiameter:[0.1,100],meanDiameter:[1,10000],freeLength:[1,10000],activeCoils:[0.25,1000],totalCoils:[1,1020],force:[0,1e7],shearModulus:[1000,200000],allowableStress:[1,5000]},out={};
 for(const [key,[min,max]] of Object.entries(bounds)){const n=value[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)fail(400,'ورودی فیزیکی سناریو خارج از محدوده است');out[key]=n;}
 if(out.meanDiameter<=out.wireDiameter||out.totalCoils<out.activeCoils+2||out.freeLength<=out.totalCoils*out.wireDiameter)fail(400,'هندسه فنر با فرض انتهای تخت سنگ‌خورده سازگار نیست');
 return out;
}
export function calculateTwin(input){
 const p=validateTwinInputs(input),d=p.wireDiameter,D=p.meanDiameter,index=D/d,wahl=(4*index-1)/(4*index-4)+0.615/index;
 const rate=p.shearModulus*d**4/(8*D**3*p.activeCoils),deflection=p.force/rate,stress=wahl*8*p.force*D/(Math.PI*d**3),solidHeight=p.totalCoils*d,availableDeflection=p.freeLength-solidHeight,solidForce=rate*availableDeflection,clearance=availableDeflection-deflection;
 const result={index,wahl,rate,deflection,length:p.freeLength-deflection,stress,solidHeight,availableDeflection,solidForce,clearance,safetyFactor:p.force===0?null:p.allowableStress/stress,stressRatio:stress/p.allowableStress,validLinear:deflection<availableDeflection,warnings:[deflection>=availableDeflection?'solid_contact':'',stress>p.allowableStress?'allowable_stress_exceeded':'',index<4||index>12?'spring_index_outside_reference_range':''].filter(Boolean)};
 if(!Object.values(result).filter(v=>typeof v==='number').every(Number.isFinite))fail(400,'محاسبه سناریو به عدد نامعتبر رسید');return result;
}
export function compareTwin(baselineInputs,candidateInputs,reference){
 const inputs=validateTwinInputs(candidateInputs),baseline={inputs:validateTwinInputs({...baselineInputs,force:inputs.force,shearModulus:inputs.shearModulus,allowableStress:inputs.allowableStress})};baseline.outputs=calculateTwin(baseline.inputs);const outputs=calculateTwin(inputs),comparison={};
 for(const key of ['rate','stress','deflection','solidForce','safetyFactor','clearance']){const b=baseline.outputs[key],c=outputs[key];comparison[key]={baseline:b,candidate:c,delta:b===null||c===null?null:c-b,percent:b===null||c===null||b===0?null:(c-b)/b*100};}
 const maxForce=Math.min(1e7,Math.max(inputs.force,Math.min(baseline.outputs.solidForce,outputs.solidForce))),loadCurve=Array.from({length:21},(_,i)=>{const force=maxForce*i/20,b=calculateTwin({...baseline.inputs,force}),c=calculateTwin({...inputs,force});return{force,baselineDeflection:b.deflection,candidateDeflection:c.deflection,baselineStress:b.stress,candidateStress:c.stress,baselineValidLinear:b.validLinear,candidateValidLinear:c.validLinear};});
 return{inputs,baseline,outputs,comparison,reference,model,loadCurve,curve:loadCurve};
}
export function createTwin({db,q=sql=>db.prepare(sql),mutate,audit}){
 const read=role=>can(role,'recipe')&&can(role,'asset'),write=role=>['admin','engineering'].includes(role);
 const ref=(id,kind)=>{const r=q('SELECT * FROM records WHERE id=?').get(uuid(id));if(!r||r.kind!==kind)fail(404,'مرجع سناریو پیدا نشد');if(r.status!=='approved')fail(409,'مرجع سناریو باید تأییدشده باشد');return{...r,data:JSON.parse(r.data)};};
 const owner=id=>{const r=q("SELECT id,name FROM users WHERE id=? AND active=1 AND role IN ('admin','engineering')").get(uuid(id));if(!r)fail(400,'مسئول سناریو باید مهندس یا مدیر فعال باشد');return r;};
 const projection=row=>({...JSON.parse(row.payload),id:row.id,title:row.title,assetId:row.asset_id,recipeId:row.recipe_id,ownerId:row.owner_id,ownerName:q('SELECT name FROM users WHERE id=?').get(row.owner_id)?.name||null,creatorId:row.creator,version:row.version,createdAt:row.created_at,updatedAt:row.updated_at});
 const get=id=>{const row=q('SELECT * FROM twin_scenarios WHERE id=?').get(uuid(id));if(!row)fail(404,'سناریو پیدا نشد');return row;};
 const initial=(assetId,recipeId,inputs)=>{const asset=ref(assetId,'asset'),recipe=ref(recipeId,'recipe'),d=recipe.data;return compareTwin({wireDiameter:d.wireDiameter,meanDiameter:d.meanDiameter,freeLength:d.freeLength,activeCoils:d.activeCoils,totalCoils:d.activeCoils+2,force:inputs?.force,shearModulus:inputs?.shearModulus,allowableStress:inputs?.allowableStress},inputs,{assetCode:asset.data.code,assetName:asset.data.name,assetVersion:asset.version,recipePart:d.part,recipeRevision:d.revision,recipeMaterial:d.material,recipeVersion:recipe.version});};
 return async({path,method,query=new URLSearchParams(),body,u,demo,send})=>{
  if(path!=='/api/twin'&&!path.startsWith('/api/twin/'))return false;
  if(!read(u.role))fail(403,'اجازه مشاهده دوقلوی مهندسی را ندارید');
  const metadata={generatedAt:new Date().toISOString(),source:demo?'browser-demo-sqlite':'project-sqlite',permissions:{read:true,write:write(u.role)},model};
  if(path==='/api/twin'&&method==='GET'){
   const page=Number(query.get('page')||1),pageSize=Number(query.get('pageSize')||20),term=query.get('q')||'';if(!Number.isInteger(page)||page<1||page>10000||!Number.isInteger(pageSize)||pageSize<1||pageSize>50||term.length>120)fail(400,'صفحه یا جستجوی سناریو معتبر نیست');
   const filters=[],params=[];for(const [key,column] of [['assetId','asset_id'],['recipeId','recipe_id']])if(query.get(key)){filters.push(column+'=?');params.push(uuid(query.get(key)));}
   if(term.trim()){filters.push("title LIKE ? ESCAPE '\\'");params.push('%'+term.trim().replace(/[\\%_]/g,'\\$&')+'%');}
   const where=filters.length?' WHERE '+filters.join(' AND '):'',total=Number(q('SELECT COUNT(*) n FROM twin_scenarios'+where).get(...params).n);
   send(200,{...metadata,scenarios:q('SELECT * FROM twin_scenarios'+where+' ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?').all(...params,pageSize,(page-1)*pageSize).map(projection),total,page,pageSize,totalPages:Math.ceil(total/pageSize),owners:q("SELECT id,name,role FROM users WHERE active=1 AND role IN ('admin','engineering') ORDER BY name").all()});return true;
  }
  const match=path.match(/^\/api\/twin\/([^/]+)$/);
  if(match&&match[1]!=='preview'&&method==='GET'){
   const row=get(match[1]);send(200,{...metadata,scenario:projection(row),revisions:q('SELECT r.version,r.reason,r.created_at,u.id editorId,u.name editorName FROM twin_revisions r JOIN users u ON u.id=r.editor WHERE scenario_id=? ORDER BY version DESC LIMIT 100').all(row.id).map(r=>({version:r.version,reason:r.reason,createdAt:r.created_at,editorId:r.editorId,editorName:r.editorName,actorId:r.editorId,actorName:r.editorName})),revisionCount:Number(q('SELECT COUNT(*) n FROM twin_revisions WHERE scenario_id=?').get(row.id).n)});return true;
  }
  if(path==='/api/twin/preview'&&method==='POST'){
   const b=await body();let calculation;
   if(b.scenarioId!==undefined){
    const row=get(b.scenarioId),previous=JSON.parse(row.payload),asset=ref(row.asset_id,'asset'),recipe=ref(row.recipe_id,'recipe');
    if(b.assetId!==undefined&&b.assetId!==row.asset_id||b.recipeId!==undefined&&b.recipeId!==row.recipe_id)fail(400,'مرجع سناریوی موجود قابل تغییر نیست');
    if(asset.version!==previous.reference.assetVersion||recipe.version!==previous.reference.recipeVersion)fail(409,'نسخه مرجع سناریو تغییر کرده؛ سناریوی جدید بسازید');
    calculation=compareTwin(previous.baseline.inputs,b.inputs,previous.reference);
   }else calculation=initial(b.assetId,b.recipeId,b.inputs);
   send(200,calculation);return true;
  }
  if(!write(u.role))fail(403,'ذخیره سناریو فقط برای مهندسی یا مدیر سامانه مجاز است');
  if(path==='/api/twin'&&method==='POST'){
   const b=await body(),title=text(b.title,120),reason=text(b.reason,1000,10),ownerId=b.ownerId===undefined?u.id:uuid(b.ownerId),id=randomUUID();let scenario;
   mutate(()=>{owner(ownerId);const calculation=initial(b.assetId,b.recipeId,b.inputs),payload={...calculation,reason},at=new Date().toISOString();
    if(demo&&Number(q('SELECT COUNT(*) n FROM twin_scenarios').get().n)>=100)fail(409,'ظرفیت سناریوهای آموزشی این مرورگر تکمیل است');
    q('INSERT INTO twin_scenarios(id,title,asset_id,recipe_id,owner_id,creator,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,title,b.assetId,b.recipeId,ownerId,u.id,JSON.stringify(payload),at,at);q('INSERT INTO twin_revisions VALUES(?,?,?,?,?,?)').run(id,1,u.id,reason,JSON.stringify(payload),at);audit(u.id,'twin.created',id,{assetId:b.assetId,recipeId:b.recipeId,ownerId,version:1,reason,modelId:model.id});scenario=projection(get(id));
   });send(201,scenario);return true;
  }
  if(match&&match[1]!=='preview'&&method==='PATCH'){
   const b=await body(),title=text(b.title,120),reason=text(b.reason,1000,10);let scenario;
   mutate(()=>{const row=get(match[1]);if(row.owner_id!==u.id&&u.role!=='admin')fail(403,'ویرایش سناریو فقط برای مسئول یا مدیر مجاز است');if(!Number.isInteger(b.version)||b.version<1)fail(400,'نسخه سناریو معتبر نیست');if(b.version!==row.version)fail(409,'نسخه سناریو تغییر کرده؛ دوباره دریافت کنید');
    const previous=JSON.parse(row.payload),asset=ref(row.asset_id,'asset'),recipe=ref(row.recipe_id,'recipe');if(asset.version!==previous.reference.assetVersion||recipe.version!==previous.reference.recipeVersion)fail(409,'نسخه مرجع سناریو تغییر کرده؛ سناریوی جدید بسازید');
    const ownerId=b.ownerId===undefined?row.owner_id:uuid(b.ownerId);owner(ownerId);const payload={...compareTwin(previous.baseline.inputs,b.inputs,previous.reference),reason},at=new Date().toISOString(),version=row.version+1;
    if(q('UPDATE twin_scenarios SET title=?,owner_id=?,payload=?,version=?,updated_at=? WHERE id=? AND version=?').run(title,ownerId,JSON.stringify(payload),version,at,row.id,row.version).changes!==1)fail(409,'نسخه سناریو تغییر کرده؛ دوباره دریافت کنید');q('INSERT INTO twin_revisions VALUES(?,?,?,?,?,?)').run(row.id,version,u.id,reason,JSON.stringify(payload),at);audit(u.id,'twin.updated',row.id,{version,previousVersion:row.version,ownerId,reason,modelId:model.id});scenario=projection(get(row.id));
   });send(200,scenario);return true;
  }
  fail(404,'مسیر دوقلوی مهندسی پیدا نشد');
 };
}
