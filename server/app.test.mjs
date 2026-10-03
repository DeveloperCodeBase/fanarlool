import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from './storage.mjs';
import {createApp,hashPassword} from './app.mjs';
import {can,validateRecord,productionKpis,roles} from './domain.mjs';
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
 const created=await request('/records','POST',{kind:'production',data:production},sessions.production);assert.equal(created.res.status,201);
 const id=created.body.id;
 assert.equal((await request(`/records/${id}`,'PATCH',{version:99,status:'submitted'},sessions.production)).res.status,409);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:1,status:'submitted'},sessions.production)).res.status,200);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'approved'},sessions.production)).res.status,403);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:2,status:'approved'},sessions.executive)).res.status,200);
 assert.equal((await request(`/records/${id}`,'PATCH',{version:3,data:production},sessions.production)).res.status,403);
 const w=await request('/workspace','GET',null,sessions.production);assert.equal(w.body.kpis.good,980);
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
