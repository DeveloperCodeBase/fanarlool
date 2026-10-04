import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from './storage.mjs';
import {createApp,hashPassword} from './app.mjs';
import {can,validateRecord,productionKpis,roles} from './domain.mjs';
import {createDemoRouter,demoPassword} from './demo.mjs';
import {createServer} from 'node:http';
const origin='http://localhost', password='FanarTest-only-password-01';
const production={batch:'B-001',line:'L1',product:'P1',date:'2026-10-03',shift:'صبح',plannedMinutes:480,runMinutes:420,idealCycleSeconds:20,total:1000,good:980,downtimeReason:'توقف برنامه‌ریزی‌شده'};
test('validated OEE is weighted by shift time; missing data remains null',()=>{
 assert.equal(productionKpis([]).oee,null);
 const k=productionKpis([{kind:'production',status:'approved',data:production},{kind:'production',status:'draft',data:production}]);
 assert.equal(k.total,1000);assert.ok(Math.abs(k.oee-980*20/(480*60))<1e-9);
});
test('business cross-field bounds and dates reject inconsistent data',()=>{
 assert.throws(()=>validateRecord('production',{...production,good:1001}));
 assert.throws(()=>validateRecord('production',{...production,runMinutes:0}));
 assert.throws(()=>validateRecord('production',{...production,date:'2026-02-30'}));
 assert.throws(()=>validateRecord('production',{...production,idealCycleSeconds:60}));
 assert.throws(()=>validateRecord('energy',{meter:'M',line:'L',date:'2026-10-03',carrier:'برق kWh',readingStart:20,readingEnd:10,tonnage:2,outageMinutes:0}));
 assert.equal(can('auditor','production','write'),false);assert.equal(can('energy','recipe'),false);
});
test('real API auth, CSRF, all role boundaries, independent approval and session invalidation',async t=>{
 const db=openDatabase(':memory:'),hash=await hashPassword(password),ids={};
 for(const role of Object.keys(roles)){ids[role]=randomUUID();db.prepare('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(ids[role],role,role,role,hash,new Date().toISOString());}
 const app=createApp({db,origin,secure:false,sha:'test'});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>app.close(()=>{db.close();resolve();})));
 const base=`http://127.0.0.1:${app.address().port}`;
 async function request(path,method='GET',data,session,extra={}){
  const res=await fetch(base+'/api'+path,{method,headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...extra},body:data?JSON.stringify(data):undefined});return {res,body:await res.json()};
 }
 async function login(role){const {res,body}=await request('/auth/login','POST',{username:role,password});assert.equal(res.status,200);return {cookie:res.headers.get('set-cookie').split(';')[0],csrf:body.csrf};}
 assert.equal((await request('/workspace')).res.status,401);
 assert.equal((await request('/auth/login','POST',{username:'production',password},null,{Origin:'https://evil.test'})).res.status,403);
 const sessions={};for(const role of Object.keys(roles))sessions[role]=await login(role);
 for(const role of Object.keys(roles)){
  const w=await request('/workspace','GET',null,sessions[role]);assert.equal(w.res.status,200);
  assert.ok(w.body.catalog.every(c=>can(role,c.kind)));
  assert.equal((await request('/users','GET',null,sessions[role])).res.status,role==='admin'?200:403);
  assert.equal((await request('/audit','GET',null,sessions[role])).res.status,['admin','executive','auditor'].includes(role)?200:403);
 }
 assert.equal((await request('/records','POST',{kind:'production',data:production},sessions.auditor)).res.status,403);
 assert.equal((await request('/records','POST',{kind:'production',data:production},sessions.production,{'X-CSRF-Token':'wrong'})).res.status,403);
 const countBefore=db.prepare('SELECT COUNT(*) AS n FROM records').get().n;
 db.exec("CREATE TRIGGER fail_record_audit BEFORE INSERT ON audit WHEN NEW.action='record.created' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");
 assert.equal((await request('/records','POST',{kind:'production',data:production},sessions.production)).res.status,500);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM records').get().n,countBefore,'record mutation must roll back when its audit cannot persist');
 db.exec('DROP TRIGGER fail_record_audit');
 const created=await request('/records','POST',{kind:'production',data:production},sessions.production);assert.equal(created.res.status,201);
 const id=created.body.id;
 assert.equal((await request(`/records/${id}`,'PATCH',{version:99,status:'submitted'},sessions.production)).res.status,409);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:1,status:'submitted'},sessions.production)).res.status,200);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'approved'},sessions.production)).res.status,403);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'approved'},sessions.executive)).res.status,200);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:3,data:production},sessions.production)).res.status,403);
 const w=await request('/workspace','GET',null,sessions.production);assert.equal(w.body.kpis.good,980);
 const personal={name:'تولید آزمایش',department:'تولید',jobTitle:'مسئول شیفت',email:'person@example.test',phone:'',preferences:{density:'compact',startPage:'production',notifications:false}};
 assert.equal((await request('/profile','PATCH',personal,sessions.production)).res.status,200);
 assert.equal((await request('/profile','GET',null,sessions.production)).body.user.name,personal.name);
 assert.equal((await request('/profile','GET',null,sessions.quality)).body.user.name,'quality');
 assert.equal((await request('/profile','PATCH',{...personal,preferences:{...personal.preferences,startPage:'recipe'}},sessions.energy)).res.status,400);
 const mine=(await request('/activity','GET',null,sessions.production)).body.events;
 assert.ok(mine.length>0&&mine.every(event=>event.actor===ids.production));
 assert.equal((await request('/system','GET',null,sessions.production)).res.status,403);
 assert.equal((await request('/system','GET',null,sessions.admin)).body.database,'ok');
 assert.equal((await request(`/users/${ids.production}`,'PATCH',{role:'quality',active:false},sessions.admin)).res.status,200);
 assert.equal((await request('/workspace','GET',null,sessions.production)).res.status,401);
 const adminCreation=await request('/users','POST',{username:'temporary',name:'کاربر تست',role:'production',password},sessions.admin);assert.equal(adminCreation.res.status,201);
 const temp=await login('temporary');assert.equal((await request('/workspace','GET',null,temp)).res.status,403);
 assert.equal((await request('/auth/password','POST',{current:password,password:'new-long-test-pass-0123'},temp)).res.status,200);
 assert.equal((await request('/auth/me','GET',null,temp)).res.status,401);
 assert.equal((await request('/auth/logout','POST',{},sessions.auditor)).res.status,200);
 assert.equal((await request('/auth/me','GET',null,sessions.auditor)).res.status,401);
 const audit=db.prepare('SELECT action FROM audit').all();assert.ok(audit.some(a=>a.action==='record.updated'));assert.ok(audit.some(a=>a.action==='auth.password'));
 for(let i=0;i<9;i++){const r=await request('/auth/login','POST',{username:'unknown',password:'incorrect'});assert.equal(r.res.status,i<8?401:429);}
});
test('public role demo is isolated per browser and cannot authenticate against production',async t=>{
 const db=openDatabase(':memory:'),productionApp=createApp({db,origin,secure:false}),demo=await createDemoRouter({origin,secure:false,sha:'demo-test'});
 const router=createServer((req,res)=>req.url.startsWith('/api/demo/')?demo.handle(req,res):productionApp.emit('request',req,res));
 await new Promise(resolve=>router.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>router.close(()=>{demo.close();db.close();resolve();})));
 const base=`http://127.0.0.1:${router.address().port}`;
 async function demoLogin(role,cookie=''){const r=await fetch(base+'/api/demo/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({username:`demo.${role}`,password:demoPassword})});assert.equal(r.status,200);const body=await r.json();const jar=new Map();for(const item of [...cookie.split(';'),...r.headers.getSetCookie().map(c=>c.split(';')[0])].filter(Boolean)){const entry=item.trim();jar.set(entry.split('=')[0],entry);}return {csrf:body.csrf,cookie:[...jar.values()].join('; ')};}
 const first=await demoLogin('admin'),other=await demoLogin('admin');
 const get=(path,session)=>fetch(base+path,{headers:{Cookie:session.cookie}});
 const workspace=await (await get('/api/demo/workspace',first)).json();assert.equal(workspace.mode,'demo');assert.equal(workspace.records.length,98);
 assert.ok(workspace.records.length<=120);
 const shifts=workspace.records.filter(r=>r.kind==='production'&&r.status==='approved');
 assert.equal(shifts.length,28);assert.equal(new Set(shifts.map(r=>r.data.date)).size,14);assert.equal(new Set(shifts.map(r=>r.data.shift)).size,2);
 const assets=new Set(workspace.records.filter(r=>r.kind==='asset').map(r=>r.data.code));
 const instruments=new Set(workspace.records.filter(r=>r.kind==='calibration').map(r=>r.data.instrument));
 const batches=new Set(shifts.map(r=>r.data.batch));
 const parts=new Set(workspace.records.filter(r=>r.kind==='recipe').map(r=>r.data.part));
 assert.ok(workspace.records.filter(r=>r.kind==='maintenance').every(r=>assets.has(r.data.asset)));
 assert.ok(workspace.records.filter(r=>r.kind==='inspection').every(r=>instruments.has(r.data.instrument)&&batches.has(r.data.batch)&&parts.has(r.data.part)));
 assert.ok(workspace.records.filter(r=>r.kind==='ncr').every(r=>batches.has(r.data.batch)));
 assert.ok(workspace.records.every(r=>JSON.stringify(r.data)===JSON.stringify(validateRecord(r.kind,r.data))));
 const second=await (await get('/api/demo/workspace',other)).json();assert.notEqual(workspace.records[0].id,second.records[0].id);
 assert.equal((await get('/api/workspace',first)).status,401);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,0);
 const operator=await demoLogin('production',first.cookie);
 assert.equal((await get('/api/demo/system',operator)).status,403);
 const monitor=await (await get('/api/demo/system',first)).json();assert.equal(monitor.demo,true);assert.equal(monitor.counts.records,98);
 const blocked=await fetch(base+'/api/demo/users',{method:'POST',headers:{Cookie:first.cookie,Origin:origin,'X-CSRF-Token':first.csrf,'Content-Type':'application/json'},body:JSON.stringify({username:'new',name:'New',role:'admin',password:demoPassword})});assert.equal(blocked.status,403);
});

async function workflowFixture(t){
 const db=openDatabase(':memory:'),hash=await hashPassword(password),ids={};
 for(const role of Object.keys(roles)){ids[role]=randomUUID();db.prepare('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(ids[role],role,role,role,hash,new Date().toISOString());}
 const app=createApp({db,origin,secure:false});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>app.close(()=>{db.close();resolve();})));
 const base=`http://127.0.0.1:${app.address().port}`;
 async function request(path,method='GET',data,session){
  const res=await fetch(base+'/api'+path,{method,headers:{...(data?{'Content-Type':'application/json',Origin:origin}:{}),...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:data?JSON.stringify(data):undefined});
  return {res,body:await res.json()};
 }
 const sessions={};
 for(const role of ['production','executive','quality','engineering','energy','auditor']){
  const r=await request('/auth/login','POST',{username:role,password});assert.equal(r.res.status,200);
  sessions[role]={cookie:r.res.headers.get('set-cookie').split(';')[0],csrf:r.body.csrf};
 }
 async function create(kind,data,role='production',sourceId){const r=await request('/records','POST',{kind,data,...(sourceId?{sourceId}:{})},sessions[role]);assert.equal(r.res.status,201);return r.body.id;}
 return {db,ids,sessions,request,create};
}

test('record history enforces the record read boundary, exact identity errors and a safe event projection',async t=>{
 const {db,ids,sessions,request,create}=await workflowFixture(t);
 const data={part:'P1',revision:'R01',material:'test',wireDiameter:10,meanDiameter:60,activeCoils:6,freeLength:220,standard:'test',notes:'test'};
 const id=await create('recipe',data,'engineering'),other=await create('production',production);
 assert.equal((await request(`/records/${id}/history`)).res.status,401);
 assert.equal((await request('/records/not-an-id/history','GET',null,sessions.quality)).res.status,400);
 assert.equal((await request(`/records/${randomUUID()}/history`,'GET',null,sessions.quality)).res.status,404);
 assert.equal((await request(`/records/${id}/history`,'GET',null,sessions.energy)).res.status,404);
 const insert=db.prepare('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)');
 insert.run(ids.engineering,'auth.password',id,JSON.stringify({password:'not-for-history'}),new Date().toISOString());
 insert.run(ids.engineering,'record.updated',id,JSON.stringify({kind:'recipe',from:'draft',to:'draft',version:2,note:'visible note',password:'secret',csrf:'secret',profile:{email:'private@example.test'}}),new Date().toISOString());
 const r=await request(`/records/${id}/history`,'GET',null,sessions.quality);
 assert.equal(r.res.status,200);assert.equal(r.body.recordId,id);assert.equal(r.body.sourceId,null);assert.equal(r.body.events.length,2);
 assert.ok(r.body.events.every(e=>e.actorId===ids.engineering&&e.actorName==='engineering'&&e.actorRole==='engineering'));
 assert.deepEqual(r.body.events[1].details,{kind:'recipe',note:'visible note',from:'draft',to:'draft',version:2});
 assert.ok(!JSON.stringify(r.body).includes('secret'));assert.ok(!JSON.stringify(r.body).includes('private@example.test'));
 assert.ok(!JSON.stringify(r.body).includes('not-for-history'));assert.ok(!JSON.stringify(r.body).includes(other));
});

test('a rejection needs a bounded reason and a failed audit rolls back the decision and its version',async t=>{
 const {db,sessions,request,create}=await workflowFixture(t),id=await create('production',production);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:1,status:'submitted'},sessions.production)).res.status,200);
 for(const note of [undefined,'short',' '.repeat(12),'x'.repeat(1001),42]){
  const result=await request(`/records/${id}`,'PATCH',{version:2,status:'rejected',...(note===undefined?{}:{note})},sessions.executive);
  assert.equal(result.res.status,400);
 }
 const note='ثبت زمان توقف نیازمند بازبینی توسط مسئول شیفت است.';
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'rejected',note},sessions.production)).res.status,403);
 const auditCount=db.prepare('SELECT COUNT(*) AS n FROM audit WHERE target=?').get(id).n;
 db.exec("CREATE TRIGGER fail_review_audit BEFORE INSERT ON audit WHEN NEW.action='record.updated' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'rejected',note},sessions.executive)).res.status,500);
 assert.deepEqual({...db.prepare('SELECT status,version,approver FROM records WHERE id=?').get(id)},{status:'submitted',version:2,approver:null});
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit WHERE target=?').get(id).n,auditCount);
 db.exec('DROP TRIGGER fail_review_audit');
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'rejected',note},sessions.executive)).res.status,200);
 const history=(await request(`/records/${id}/history`,'GET',null,sessions.production)).body;
 assert.deepEqual(history.events.at(-1).details,{kind:'production',note,from:'submitted',to:'rejected',version:3});
 assert.equal((await request(`/records/${id}`,'PATCH',{version:3,data:production},sessions.production)).res.status,403);
 const approved=await create('production',production);
 await request(`/records/${approved}`,'PATCH',{version:1,status:'submitted'},sessions.production);
 assert.equal((await request(`/records/${approved}`,'PATCH',{version:2,status:'approved'},sessions.executive)).res.status,200);
});

test('correction copies retain an immutable rejection chain and enforce source status, kind, read and write permissions',async t=>{
 const {db,sessions,request,create}=await workflowFixture(t),source=await create('production',production);
 assert.equal((await request('/records','POST',{kind:'production',data:production,sourceId:'malformed'},sessions.production)).res.status,400);
 assert.equal((await request('/records','POST',{kind:'production',data:production,sourceId:randomUUID()},sessions.production)).res.status,404);
 assert.equal((await request('/records','POST',{kind:'production',data:production,sourceId:source},sessions.production)).res.status,409);
 await request(`/records/${source}`,'PATCH',{version:1,status:'submitted'},sessions.production);
 await request(`/records/${source}`,'PATCH',{version:2,status:'rejected',note:'بررسی اصلاح داده‌های زمان شیفت لازم است.'},sessions.executive);
 const original={...db.prepare('SELECT * FROM records WHERE id=?').get(source)};
 assert.equal((await request('/records','POST',{kind:'production',data:production,sourceId:source},sessions.auditor)).res.status,403);
 const inspection={batch:'B-001',part:'P1',sampleCount:10,dimension:'length',nominal:220,tolerance:1,measured:220.5,defects:1,instrument:'C1',notes:''};
 assert.equal((await request('/records','POST',{kind:'inspection',data:inspection,sourceId:source},sessions.quality)).res.status,400);
 const recipe=await create('recipe',{part:'P1',revision:'R1',material:'test',wireDiameter:10,meanDiameter:60,activeCoils:6,freeLength:220,standard:'test',notes:'test'},'engineering');
 const energyData={meter:'M1',line:'L1',date:'2026-10-03',carrier:'برق kWh',readingStart:10,readingEnd:20,tonnage:1,outageMinutes:0,notes:''};
 assert.equal((await request('/records','POST',{kind:'energy',data:energyData,sourceId:recipe},sessions.energy)).res.status,404);
 const recordCount=db.prepare('SELECT COUNT(*) AS n FROM records').get().n;
 db.exec("CREATE TRIGGER fail_copy_audit BEFORE INSERT ON audit WHEN NEW.action='record.created' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");
 assert.equal((await request('/records','POST',{kind:'production',data:production,sourceId:source},sessions.production)).res.status,500);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM records').get().n,recordCount);
 db.exec('DROP TRIGGER fail_copy_audit');
 const copy=await create('production',{...production,good:990},'production',source);
 assert.deepEqual({...db.prepare('SELECT * FROM records WHERE id=?').get(source)},original);
 assert.deepEqual({...db.prepare('SELECT status,version FROM records WHERE id=?').get(copy)},{status:'draft',version:1});
 const copyHistory=(await request(`/records/${copy}/history`,'GET',null,sessions.production)).body;
 assert.equal(copyHistory.sourceId,source);assert.equal(copyHistory.events[0].details.sourceId,source);
 await request(`/records/${copy}`,'PATCH',{version:1,status:'submitted'},sessions.production);
 await request(`/records/${copy}`,'PATCH',{version:2,status:'rejected',note:'بازبینی نهایی تعداد سالم برای این پیش‌نویس لازم است.'},sessions.executive);
 const next=await create('production',{...production,good:995},'production',copy);
 assert.equal((await request(`/records/${next}/history`,'GET',null,sessions.production)).body.sourceId,copy);
 assert.equal((await request(`/records/${copy}/history`,'GET',null,sessions.production)).body.sourceId,source);
});
