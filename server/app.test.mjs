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
 const workspace=await (await get('/api/demo/workspace',first)).json();assert.equal(workspace.mode,'demo');assert.equal(workspace.records.length,27);
 const second=await (await get('/api/demo/workspace',other)).json();assert.notEqual(workspace.records[0].id,second.records[0].id);
 assert.equal((await get('/api/workspace',first)).status,401);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,0);
 const operator=await demoLogin('production',first.cookie);
 assert.equal((await get('/api/demo/system',operator)).status,403);
 const monitor=await (await get('/api/demo/system',first)).json();assert.equal(monitor.demo,true);assert.equal(monitor.counts.records,27);
 const blocked=await fetch(base+'/api/demo/users',{method:'POST',headers:{Cookie:first.cookie,Origin:origin,'X-CSRF-Token':first.csrf,'Content-Type':'application/json'},body:JSON.stringify({username:'new',name:'New',role:'admin',password:demoPassword})});assert.equal(blocked.status,403);
});
