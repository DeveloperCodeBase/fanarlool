import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from './storage.mjs';
import {createApp,hashPassword} from './app.mjs';
import {recordQuery,productionSummary} from './queries.mjs';
const now='2026-10-04T00:00:00.000Z',password='FanarReliability-123!';
test('authorized search applies RBAC before pagination and reports include all approved shifts',()=>{
 const db=openDatabase(':memory:');try{
 const owner=randomUUID();db.prepare('INSERT INTO users(id,username,name,role,password,created_at) VALUES(?,?,?,?,?,?)').run(owner,'owner','مالک','admin','test',now);
 const insert=db.prepare('INSERT INTO records(id,kind,data,status,creator,created_at,updated_at) VALUES(?,?,?,?,?,?,?)');
 for(let i=0;i<2005;i++)insert.run(randomUUID(),'recipe',JSON.stringify({code:'R'+i}),'approved',owner,now,now);
 const id=randomUUID(),shift={batch:'OLD-001',line:'L1',date:'2025-01-01',plannedMinutes:480,runMinutes:420,idealCycleSeconds:20,total:1000,good:980};
 insert.run(id,'production',JSON.stringify(shift),'approved',owner,'2025-01-01T00:00:00Z','2025-01-01T00:00:00Z');
 insert.run(randomUUID(),'production',JSON.stringify(shift),'draft',owner,now,now);
 const result=recordQuery(db,'energy',new URLSearchParams({kind:'production',q:'OLD-001',status:'approved'}));assert.equal(result.total,1);assert.equal(result.records[0].id,id);
 assert.throws(()=>recordQuery(db,'energy',new URLSearchParams({kind:'recipe'})),{code:403});
 assert.throws(()=>recordQuery(db,'admin',new URLSearchParams({from:'2026-02-30'})),{code:400});
 assert.equal(recordQuery(db,'admin',new URLSearchParams({q:'%'})).total,0,'literal percent is not a wildcard');
 const report=productionSummary(db);assert.equal(report.summary.good,980);assert.equal(report.summary.shifts,1);assert.equal(report.days[0].date,'2025-01-01');
 assert.equal(productionSummary(db,'2026-01-01','2026-12-31').summary.oee,null);
 }finally{db.close();}
});
test('password reset revokes sessions atomically and forces password change; own sessions do not leak',async t=>{
 const db=openDatabase(':memory:'),hash=await hashPassword(password),ids={admin:randomUUID(),production:randomUUID(),quality:randomUUID()};
 for(const [role,id] of Object.entries(ids))db.prepare('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(id,role,role,role,hash,now);
 const origin='http://localhost',app=createApp({db,origin,secure:false});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>app.close(()=>{db.close();r();})));
 const request=async(path,method='GET',data,session)=>{const res=await fetch(`http://127.0.0.1:${app.address().port}/api${path}`,{method,headers:{...(data!==undefined?{'Content-Type':'application/json',Origin:origin}:{}),...(method==='DELETE'?{Origin:origin}:{}),...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:data!==undefined?JSON.stringify(data):undefined});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')};};
 const login=async(role,secret=password)=>{const response=await request('/auth/login','POST',{username:role,password:secret});assert.equal(response.status,200);return {cookie:response.cookie.split(';')[0],csrf:response.body.csrf};};
 const admin=await login('admin'),first=await login('production'),second=await login('production'),quality=await login('quality');
 const sessions=(await request('/auth/sessions','GET',undefined,first)).body.sessions;assert.equal(sessions.length,2);assert.equal(sessions.filter(s=>s.current).length,1);assert.ok(sessions.every(s=>!('csrf'in s)&&!('token'in s)));
 const other=(await request('/auth/sessions','GET',undefined,quality)).body.sessions[0].id;
 assert.equal((await request('/auth/sessions/'+other,'DELETE',undefined,first)).status,404);
 assert.equal((await request('/auth/revoke-others','POST',{},first)).body.count,1);assert.equal((await request('/workspace','GET',undefined,second)).status,401);
 const newPassword='FanarChangedTemporary-456!',payload={password:newPassword,reason:'درخواست مستند بازنشانی رمز کاربر'};
 assert.equal((await request(`/users/${ids.production}/reset-password`,'POST',payload,quality)).status,403);
 db.exec("CREATE TRIGGER reset_audit_fail BEFORE INSERT ON audit WHEN NEW.action='user.password_reset' BEGIN SELECT RAISE(ABORT,'audit failed'); END");
 assert.equal((await request(`/users/${ids.production}/reset-password`,'POST',payload,admin)).status,500);assert.equal((await request('/workspace','GET',undefined,first)).status,200);db.exec('DROP TRIGGER reset_audit_fail');
 assert.equal((await request(`/users/${ids.production}/reset-password`,'POST',payload,admin)).status,200);assert.equal((await request('/workspace','GET',undefined,first)).status,401);
 const temporary=await login('production',newPassword);assert.equal((await request('/workspace','GET',undefined,temporary)).status,403);
 const audit=db.prepare("SELECT details FROM audit WHERE action='user.password_reset'").get();assert.ok(!audit.details.includes(newPassword));
 assert.equal((await request('/auth/password','POST',{current:newPassword,password:'FanarOwnerUnique-789!'},temporary)).status,200);
 assert.equal((await request('/workspace','GET',undefined,await login('production','FanarOwnerUnique-789!'))).status,200);
});
