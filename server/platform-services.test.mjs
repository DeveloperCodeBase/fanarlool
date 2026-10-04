import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDatabase} from './storage.mjs';
import {calculateTwin,compareTwin,createTwin} from './twin.mjs';
import {createAccountServices,safeRequestRoute,databaseIntegrity} from './account-services.mjs';
import {createApp} from './app.mjs';

const inputs={wireDiameter:12,meanDiameter:100,freeLength:300,activeCoils:6,totalCoils:8,force:3000,shearModulus:78500,allowableStress:880};
function fixture(t){
 const db=openDatabase(':memory:'),q=sql=>db.prepare(sql),users={},now=new Date().toISOString(),requests=[];let auditFailure=false;
 for(const [key,role] of Object.entries({admin:'admin',engineering:'engineering',engineering2:'engineering',production:'production',quality:'quality',maintenance:'maintenance',energy:'energy',auditor:'auditor',executive:'executive'})){
  const id=randomUUID();users[key]={id,role,name:key};q('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(id,key,key,role,'PRIVATE-PASSWORD-HASH',now);
 }
 const record=(kind,data,status='approved',creator=users.engineering.id)=>{const id=randomUUID();q('INSERT INTO records(id,kind,data,status,creator,approver,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,kind,JSON.stringify(data),status,creator,users.executive.id,now,now);return id;};
 const recipeId=record('recipe',{part:'P1',revision:'R1',material:'54SiCr6',wireDiameter:12,meanDiameter:100,freeLength:300,activeCoils:6}),assetId=record('asset',{code:'A1',name:'Reference asset'});
 const mutate=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const audit=(actor,action,target,details)=>{if(auditFailure)throw new Error('audit unavailable');q('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(actor,action,target,JSON.stringify(details),new Date().toISOString());};
 const userView=u=>({id:u.id,name:u.name,username:u.username,role:u.role,mustChange:!!u.must_change});
 const twin=createTwin({db,q,mutate,audit}),account=createAccountServices({db,q,mutate,audit,userView,startedAt:now,requests,sha:'test-sha',demo:false,recoveryStatus:()=>null});
 const invoke=async(handler,role,path,b,method=b?'POST':'GET')=>{let response;assert.equal(await handler({u:users[role],path:path.split('?')[0],query:new URLSearchParams(path.split('?')[1]||''),method,body:async()=>b,demo:false,send:(status,value)=>{response={status,value};}}),true);return response.value;};
 const call=(role,path,b,method)=>invoke(path.startsWith('/api/twin')?twin:account,role,path,b,method);
 const scenario=(extra={})=>call('engineering','/api/twin',{title:'Design sensitivity scenario',assetId,recipeId,reason:'Compare wire geometry using declared assumptions',inputs,...extra});
 t.after(()=>db.close());return{db,q,users,record,recipeId,assetId,requests,call,scenario,audit,failAudit:value=>{auditFailure=value;}};
}
const rejects=(promise,code)=>assert.rejects(promise,e=>e.code===code);

test('schema-three profile migration preserves existing identity and preferences and is idempotent',t=>{
 const directory=mkdtempSync(join(tmpdir(),'fanarlool-profile-migration-')),path=join(directory,'project.sqlite'),id=randomUUID(),preferences=JSON.stringify({density:'compact',startPage:'production',notifications:false,locale:'fa',dateFormat:'jalali',timezone:'Asia/Tehran'});
 let db=new DatabaseSync(path);t.after(()=>{db?.close();rmSync(directory,{recursive:true,force:true});});
 db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,role TEXT NOT NULL,password TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,must_change INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
 CREATE TABLE user_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id),department TEXT NOT NULL DEFAULT '',job_title TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',preferences TEXT NOT NULL DEFAULT '{}');PRAGMA user_version=3;`);
 db.prepare('INSERT INTO users(id,username,name,role,password,created_at) VALUES(?,?,?,?,?,?)').run(id,'existing','Existing employee','production','preserved-password-hash','2026-09-01T00:00:00.000Z');
 db.prepare('INSERT INTO user_profiles VALUES(?,?,?,?,?,?)').run(id,'Production','Operator','existing@example.test','09121234567',preferences);db.close();db=null;
 db=openDatabase(path);let profile=db.prepare('SELECT * FROM user_profiles WHERE user_id=?').get(id);
 assert.equal(db.prepare('PRAGMA user_version').get().user_version,4);assert.equal(profile.department,'Production');assert.equal(profile.job_title,'Operator');assert.equal(profile.email,'existing@example.test');assert.equal(profile.phone,'09121234567');assert.equal(profile.preferences,preferences);assert.equal(profile.shift,'unassigned');assert.equal(profile.version,0);assert.equal(profile.location,'');assert.equal(profile.extension,'');assert.equal(profile.bio,'');assert.equal(profile.updated_at,'');
 assert.equal(db.prepare('SELECT name FROM users WHERE id=?').get(id).name,'Existing employee');assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name IN ('twin_scenarios','twin_revisions')").get().n,2);
 db.prepare('UPDATE user_profiles SET shift=?,location=?,version=?,updated_at=? WHERE user_id=?').run('night','Line 1',7,'2026-10-04T00:00:00.000Z',id);db.close();db=null;
 db=openDatabase(path);profile=db.prepare('SELECT * FROM user_profiles WHERE user_id=?').get(id);assert.equal(profile.preferences,preferences);assert.equal(profile.shift,'night');assert.equal(profile.location,'Line 1');assert.equal(profile.version,7);assert.equal(profile.updated_at,'2026-10-04T00:00:00.000Z');assert.equal(db.prepare('PRAGMA user_version').get().user_version,4);
});

test('spring twin uses the stated modulus and Wahl formula, preserves overload and rejects invalid geometry',()=>{
 const result=calculateTwin(inputs);assert.ok(Math.abs(result.rate-33.912)<1e-9);assert.ok(Math.abs(result.deflection-3000/33.912)<1e-9);assert.ok(Math.abs(result.stress-result.wahl*8*3000*100/(Math.PI*12**3))<1e-9);
 const doubled=calculateTwin({...inputs,shearModulus:157000});assert.equal(doubled.rate,result.rate*2);
 const overloaded=calculateTwin({...inputs,force:1e6});assert.ok(overloaded.stressRatio>1);assert.ok(overloaded.clearance<0);assert.equal(overloaded.validLinear,false);assert.ok(overloaded.warnings.includes('solid_contact'));
 assert.throws(()=>calculateTwin({...inputs,meanDiameter:12}),e=>e.code===400);assert.throws(()=>calculateTwin({...inputs,totalCoils:6}),e=>e.code===400);assert.throws(()=>calculateTwin({...inputs,force:NaN}),e=>e.code===400);
 const comparison=compareTwin(inputs,{...inputs,wireDiameter:13,force:0},{});assert.equal(comparison.baseline.inputs.force,0);assert.equal(comparison.comparison.stress.percent,null);assert.equal(comparison.comparison.safetyFactor.delta,null);assert.equal(comparison.curve.length,21);
 const stiff={...inputs,wireDiameter:50,meanDiameter:200,freeLength:1000,activeCoils:1,totalCoils:3,shearModulus:200000},bounded=compareTwin(stiff,stiff,{});assert.ok(bounded.outputs.solidForce>1e7);assert.equal(bounded.curve.at(-1).force,1e7);assert.equal(bounded.outputs.deflection,calculateTwin(stiff).deflection);
});

test('preview is role-authorized and stateless; persistence requires approved references and engineering role',async t=>{
 const f=fixture(t),preview=await f.call('production','/api/twin/preview',{assetId:f.assetId,recipeId:f.recipeId,inputs});assert.equal(preview.model.factoryValidated,false);assert.equal(preview.reference.recipeRevision,'R1');assert.equal(preview.baseline.inputs.totalCoils,8);
 assert.equal(f.q('SELECT COUNT(*) n FROM twin_scenarios').get().n,0);assert.equal(f.q('SELECT COUNT(*) n FROM audit').get().n,0);
 await rejects(f.call('energy','/api/twin'),403);await rejects(f.call('maintenance','/api/twin/preview',{assetId:f.assetId,recipeId:f.recipeId,inputs}),403);
 await rejects(f.call('quality','/api/twin',{title:'Test',reason:'Documented design reason',assetId:f.assetId,recipeId:f.recipeId,inputs}),403);
 const pending=f.record('recipe',{part:'P1',wireDiameter:12,meanDiameter:100,freeLength:300,activeCoils:6},'draft');await rejects(f.scenario({recipeId:pending}),409);
 const saved=await f.scenario();assert.equal(saved.version,1);assert.equal(saved.ownerId,f.users.engineering.id);assert.equal(saved.outputs.rate,preview.outputs.rate);
 const read=await f.call('auditor','/api/twin/'+saved.id);assert.equal(read.revisions.length,1);assert.equal(read.revisions[0].actorName,'engineering');
});

test('scenario ownership, baseline reproducibility, optimistic version and audit rollback are enforced',async t=>{
 const f=fixture(t),saved=await f.scenario(),update={version:1,title:'Candidate wire change',reason:'Compare thicker wire at equal load and modulus',inputs:{...inputs,wireDiameter:13,force:4000}};
 await rejects(f.call('engineering2','/api/twin/'+saved.id,update,'PATCH'),403);
 f.failAudit(true);await assert.rejects(f.call('engineering','/api/twin/'+saved.id,update,'PATCH'),/audit unavailable/);f.failAudit(false);
 assert.equal(f.q('SELECT version FROM twin_scenarios WHERE id=?').get(saved.id).version,1);assert.equal(f.q('SELECT COUNT(*) n FROM twin_revisions').get().n,1);
 const changed=await f.call('engineering','/api/twin/'+saved.id,update,'PATCH');assert.equal(changed.baseline.inputs.wireDiameter,12);assert.equal(changed.baseline.inputs.force,4000);assert.equal(changed.inputs.wireDiameter,13);assert.equal(changed.version,2);
 assert.deepEqual(calculateTwin(changed.inputs),changed.outputs);await rejects(f.call('engineering','/api/twin/'+saved.id,update,'PATCH'),409);
 f.q('UPDATE users SET active=0 WHERE id=?').run(f.users.engineering2.id);await rejects(f.call('admin','/api/twin/'+saved.id,{...update,version:2,ownerId:f.users.engineering2.id},'PATCH'),400);
 const histories=await f.call('quality','/api/twin/'+saved.id);assert.equal(histories.revisionCount,2);assert.equal(histories.revisions[0].version,2);
});

test('selected scenario preview uses the immutable baseline and rejects changed approved reference versions',async t=>{
 const f=fixture(t),saved=await f.scenario(),recipe=f.q('SELECT data FROM records WHERE id=?').get(f.recipeId),data=JSON.parse(recipe.data);
 f.q('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({...data,wireDiameter:14}),f.recipeId);
 const historical=await f.call('production','/api/twin/preview',{scenarioId:saved.id,assetId:f.assetId,recipeId:f.recipeId,inputs:{...inputs,force:4000}});
 assert.equal(historical.baseline.inputs.wireDiameter,12);assert.equal(historical.baseline.inputs.force,4000);assert.equal(historical.reference.recipeVersion,1);
 const newPreview=await f.call('production','/api/twin/preview',{assetId:f.assetId,recipeId:f.recipeId,inputs});assert.equal(newPreview.baseline.inputs.wireDiameter,14);
 f.q('UPDATE records SET version=version+1 WHERE id=?').run(f.recipeId);
 await rejects(f.call('production','/api/twin/preview',{scenarioId:saved.id,inputs}),409);
 await rejects(f.call('engineering','/api/twin/'+saved.id,{version:1,title:saved.title,reason:'Attempt revision with updated reference geometry',inputs},'PATCH'),409);
 const preserved=await f.call('quality','/api/twin/'+saved.id);assert.equal(preserved.scenario.baseline.inputs.wireDiameter,12);assert.equal(preserved.revisionCount,1);
});

const profileBody={name:'Operations employee',department:'Production',jobTitle:'Shift operator',email:'employee@example.test',phone:'۰۹۱۲۱۲۳۴۵۶۷',shift:'night',location:'Factory line 1',extension:'۱۲۳',bio:'Declared operational responsibilities',preferences:{density:'compact',startPage:'production',notifications:true,locale:'fa',dateFormat:'jalali',timezone:'Asia/Tehran'}};
test('professional profile validates contact, shift and preferences, preserves identity and rolls back with audit',async t=>{
 const f=fixture(t);await rejects(f.call('production','/api/profile',{...profileBody,role:'admin'},'PATCH'),400);await rejects(f.call('production','/api/profile',{...profileBody,phone:'not a phone'},'PATCH'),400);await rejects(f.call('production','/api/profile',{...profileBody,shift:'unrecognized'},'PATCH'),400);
 await rejects(f.call('energy','/api/profile',{...profileBody,preferences:{...profileBody.preferences,startPage:'recipe'}},'PATCH'),400);await rejects(f.call('production','/api/profile',{...profileBody,preferences:{...profileBody.preferences,dateFormat:'iso'}},'PATCH'),400);
 f.failAudit(true);await assert.rejects(f.call('production','/api/profile',profileBody,'PATCH'),/audit unavailable/);f.failAudit(false);assert.equal(f.q('SELECT name FROM users WHERE id=?').get(f.users.production.id).name,'production');
 const saved=await f.call('production','/api/profile',{...profileBody,version:0},'PATCH');assert.equal(saved.phone,'09121234567');assert.equal(saved.extension,'123');assert.equal(saved.shift,'night');assert.equal(saved.version,1);assert.equal(saved.user.role,'production');
 await rejects(f.call('production','/api/profile',{...profileBody,version:0},'PATCH'),409);assert.equal((await f.call('quality','/api/profile')).phone,'');
});

test('profile summary applies domain authorization before recent-event limits and excludes other users work',async t=>{
 const f=fixture(t),visible=f.record('production',{batch:'VISIBLE'},'draft',f.users.energy.id),hidden=f.record('recipe',{part:'PRIVATE'},'draft',f.users.energy.id);
 f.audit(f.users.energy.id,'record.created',visible,{kind:'production',password:'PRIVATE-SECRET'});
 for(let i=0;i<110;i++)f.audit(f.users.energy.id,'record.created',hidden,{kind:'recipe',note:'PRIVATE-RECIPE-NOTE'});
 f.record('production',{batch:'OTHER'},'draft',f.users.production.id);
 const profile=await f.call('energy','/api/profile');assert.equal(profile.summary.ownedRecords,1);assert.equal(profile.summary.ownDrafts,1);assert.equal(profile.summary.recentEvents.length,1);assert.equal(profile.summary.recentEvents[0].target,visible);assert.equal(profile.summary.activityLast7Days,1);assert.equal(JSON.stringify(profile).includes('PRIVATE-RECIPE-NOTE'),false);assert.equal(JSON.stringify(profile).includes('PRIVATE-SECRET'),false);assert.equal(profile.summary.accessScope.some(s=>s.kind==='recipe'),false);
});

test('monitoring is admin-only, paginates safe audit and grouped sessions, and filters a bounded request sample',async t=>{
 const f=fixture(t),now=Date.now();
 for(let i=0;i<600;i++)f.requests.push({at:new Date(now-i*10).toISOString(),method:'GET',path:i%2?'/api/profile':'/api/auth/sessions/'+'a'.repeat(64)+'?secret=HIDDEN',status:i%2?200:500,durationMs:i,actor:f.users.production.id});
 for(let i=0;i<55;i++)f.audit(f.users.production.id,'profile.updated',f.users.production.id,{version:i,note:'Visible operational note',password:'PRIVATE-CREDENTIAL',csrf:'PRIVATE-CSRF',profile:{email:'PRIVATE-EMAIL'}});
 f.q('INSERT INTO sessions VALUES(?,?,?,?,?)').run('PRIVATE-SESSION-TOKEN',f.users.production.id,'PRIVATE-SESSION-CSRF',now+600000,now);
 await rejects(f.call('executive','/api/system'),403);await rejects(f.call('admin','/api/system?pageSize=51'),400);
 const data=await f.call('admin','/api/system?tab=audit&page=2&pageSize=10&role=production&action=profile.updated');assert.equal(data.auditPage.total,55);assert.equal(data.auditPage.items.length,10);assert.equal(data.statistics.request.sampleSize,500);assert.equal(data.database,'ok');assert.equal(data.schema,4);assert.equal(data.counts.sessions,1);assert.equal(data.sessionPage.total,1);assert.equal(data.sessionPage.items.length,0);
 const filtered=await f.call('admin','/api/system?tab=requests&statusClass=5xx&pageSize=50');assert.equal(filtered.requestPage.total,250);assert.ok(filtered.requestPage.items.every(r=>r.status===500));assert.ok(filtered.requestPage.items.every(r=>r.path==='/api/auth/sessions/:session'));
 const all=await f.call('admin','/api/system');const encoded=JSON.stringify(all);for(const secret of ['PRIVATE-CREDENTIAL','PRIVATE-CSRF','PRIVATE-EMAIL','PRIVATE-SESSION-TOKEN','PRIVATE-SESSION-CSRF','HIDDEN','a'.repeat(64)])assert.equal(encoded.includes(secret),false);
 assert.equal(all.sessionPage.items[0].userName,'production');assert.equal(all.statistics.request.source,'bounded-in-memory-request-ring');assert.equal(safeRequestRoute('/api/path-containing-secret'),'/api/[unknown-route]');
});

test('real authenticated API integrates twin, profile and system without exposing session identifiers',async t=>{
 const f=fixture(t),token='b'.repeat(64),csrf='test-csrf',now=Date.now();f.q('INSERT INTO sessions VALUES(?,?,?,?,?)').run(createHash('sha256').update(token).digest('hex'),f.users.engineering.id,csrf,now+600000,now);
 const server=createApp({db:f.db,secure:false,origin:'http://localhost',sha:'integration'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const url='http://127.0.0.1:'+server.address().port;
 const get=path=>fetch(url+'/api'+path,{headers:{Cookie:'fanar_session='+token}});
 const profile=await (await get('/profile')).json();assert.equal(profile.shift,'unassigned');assert.ok(profile.summary.accessScope.some(s=>s.kind==='recipe'));
 assert.equal((await get('/system')).status,403);
 const preview=await fetch(url+'/api/twin/preview',{method:'POST',headers:{Cookie:'fanar_session='+token,Origin:'http://localhost','X-CSRF-Token':csrf,'Content-Type':'application/json'},body:JSON.stringify({assetId:f.assetId,recipeId:f.recipeId,inputs})});assert.equal(preview.status,200);assert.equal((await preview.json()).curve.length,21);assert.equal(f.q('SELECT COUNT(*) n FROM twin_scenarios').get().n,0);
});

test('database integrity caching preserves the real check timestamp, expires after five minutes and isolates databases',async t=>{
 const first=fixture(t),second=fixture(t);let calls=0;const q=sql=>{if(sql==='PRAGMA quick_check')calls++;return first.db.prepare(sql);};
 const initial=databaseIntegrity(first.db,q,1000000),cached=databaseIntegrity(first.db,q,1100000);assert.equal(calls,1);assert.equal(cached.checkedAt,initial.checkedAt);
 const refreshed=databaseIntegrity(first.db,q,1300000);assert.equal(calls,2);assert.notEqual(refreshed.checkedAt,initial.checkedAt);
 const isolated=databaseIntegrity(second.db,sql=>second.db.prepare(sql),1100000);assert.equal(isolated.checkedAt,new Date(1100000).toISOString());assert.notEqual(isolated.checkedAt,refreshed.checkedAt);
});
