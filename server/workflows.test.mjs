import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openDatabase} from './storage.mjs';
import {createWorkflows} from './workflows.mjs';

function fixture(t){
 const db=openDatabase(':memory:'),q=sql=>db.prepare(sql),users={},now=new Date().toISOString();let breakAudit=false;
 for(const [key,role] of Object.entries({admin:'admin',executive:'executive',production:'production',quality:'quality',quality2:'quality',maintenance:'maintenance',maintenance2:'maintenance',engineering:'engineering',energy:'energy',auditor:'auditor'})){
  const id=randomUUID();users[key]={id,role,name:key};q('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(id,key,key,role,'not-a-login-hash',now);
 }
 const record=(kind,data,status='approved')=>{const id=randomUUID(),at=new Date().toISOString();q('INSERT INTO records(id,kind,data,status,creator,approver,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,kind,JSON.stringify(data),status,users.engineering.id,users.executive.id,at,at);return id;};
 const recipeId=record('recipe',{part:'P1',material:'54SiCr6'}),assetId=record('asset',{code:'A1'});
 const calibrationId=record('calibration',{instrument:'I1',calibratedAt:'2000-01-01',expiresAt:'2100-12-31'});
 const mutate=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
 const audit=(actor,action,target,details)=>{if(breakAudit===true||breakAudit===action)throw new Error('audit unavailable');q('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(actor,action,target,JSON.stringify(details),now);};
 const handle=createWorkflows({db,q,mutate,audit});
 const call=async(role,path,body,method=body?'POST':'GET')=>{let response;assert.equal(await handle({u:users[role],path:path.split('?')[0],query:new URLSearchParams(path.split('?')[1]||''),method,body:async()=>body,send:(status,value)=>{response={status,...value};}}),true);return response;};
 const order=(role='production',code='ORDER-1',quantity=100)=>call(role,'/api/operations/orders',{code,customer:'Customer',product:'P1',quantity,startDate:'2026-10-01',dueDate:'2026-10-31',priority:'normal',recipeId,assetId});
 const patch=(role,kind,row,action,extra={})=>call(role,`/api/operations/${kind}/${row.id}`,{version:row.version,action,...extra},'PATCH');
 const releasedOrder=async(quantity=100)=>{const o=await order('production','ORDER-'+randomUUID(),quantity);return patch('executive','orders',o,'release');};
 const lot=(orderId,quantity=100,code='LOT-'+randomUUID())=>call('production','/api/operations/lots',{orderId,code,materialLot:'HEAT-1',quantity});
 const inspection=code=>record('inspection',{batch:code,part:'P1',measured:10,nominal:10,tolerance:1,instrument:'I1',sampleCount:10,defects:0});
 t.after(()=>db.close());
 return{db,q,users,record,call,order,patch,releasedOrder,lot,inspection,recipeId,assetId,calibrationId,breakAudit:value=>{breakAudit=value;}};
}
const rejected=(promise,code)=>assert.rejects(promise,e=>e.code===code);

test('order release is independent, role guarded, optimistic and audit-atomic',async t=>{
 const f=fixture(t),o=await f.order('executive');
 await rejected(f.patch('executive','orders',o,'release'),403);
 await rejected(f.patch('quality','orders',o,'release'),403);
 f.breakAudit(true);await assert.rejects(f.patch('admin','orders',o,'release'),/audit unavailable/);f.breakAudit(false);
 assert.equal(f.q('SELECT status FROM operation_orders WHERE id=?').get(o.id).status,'draft');
 const released=await f.patch('admin','orders',o,'release');assert.equal(released.version,2);
 await rejected(f.patch('admin','orders',o,'cancel',{note:'valid cancellation reason'}),409);
 await rejected(f.order('production',o.code),409);
 await rejected(f.call('production','/api/operations/orders',{code:'BAD',customer:'C',product:'P1',quantity:1,startDate:'2026-02-30',dueDate:'2026-10-31',priority:'normal',recipeId:f.recipeId,assetId:f.assetId}),400);
});

test('lot scheduling reconciles output, frees only released scrap and completes requested good',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id);
 await rejected(f.lot(o.id,1),409);
 await rejected(f.patch('quality','lots',l,'start'),403);
 const started=await f.patch('production','lots',l,'start');
 await rejected(f.patch('production','lots',started,'finish',{good:90,scrap:9}),400);
 const held=await f.patch('production','lots',started,'finish',{good:90,scrap:10});
 await rejected(f.lot(o.id,10),409);
 const released=await f.patch('quality','lots',held,'release',{inspectionId:f.inspection(l.code)});
 assert.equal(released.status,'released');assert.equal(f.q('SELECT status FROM operation_orders WHERE id=?').get(o.id).status,'released');
 await rejected(f.patch('quality','lots',released,'block',{note:'cannot change released lot'}),409);
 const replacement=await f.lot(o.id,10),running=await f.patch('production','lots',replacement,'start'),hold=await f.patch('production','lots',running,'finish',{good:10,scrap:0});
 const finalInspection=f.inspection(replacement.code),auditCount=f.q('SELECT COUNT(*) n FROM audit').get().n;
 f.breakAudit('operations.order.completed');await assert.rejects(f.patch('quality','lots',hold,'release',{inspectionId:finalInspection}),/audit unavailable/);f.breakAudit(false);
 assert.equal(f.q('SELECT status FROM operation_lots WHERE id=?').get(replacement.id).status,'quality_hold');assert.equal(f.q('SELECT status FROM operation_orders WHERE id=?').get(o.id).status,'released');assert.equal(f.q('SELECT COUNT(*) n FROM audit').get().n,auditCount);
 await f.patch('quality','lots',hold,'release',{inspectionId:finalInspection});
 assert.equal(f.q('SELECT status FROM operation_orders WHERE id=?').get(o.id).status,'completed');
});

test('quality gates reject wrong batch, expired calibration, outside tolerance and open NCR',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id),running=await f.patch('production','lots',l,'start'),held=await f.patch('production','lots',running,'finish',{good:100,scrap:0});
 await rejected(f.patch('quality','lots',held,'release',{inspectionId:f.inspection('OTHER-BATCH')}),409);
 const inspectionId=f.inspection(l.code);
 f.q('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({instrument:'I1',calibratedAt:'2000-01-01',expiresAt:'2001-01-01'}),f.calibrationId);
 await rejected(f.patch('quality','lots',held,'release',{inspectionId}),409);
 f.q('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({instrument:'I1',calibratedAt:'2000-01-01',expiresAt:'2100-12-31'}),f.calibrationId);
 const outside=f.record('inspection',{batch:l.code,part:'P1',measured:12,nominal:10,tolerance:1,instrument:'I1',sampleCount:10,defects:0});
 await rejected(f.patch('quality','lots',held,'release',{inspectionId:outside}),409);
 f.record('ncr',{batch:l.code,action:'Planned corrective action'});
 await rejected(f.patch('quality','lots',held,'release',{inspectionId}),409);
 assert.equal(f.q('SELECT status,version FROM operation_lots WHERE id=?').get(l.id).status,'quality_hold');
});

test('self release of a lot is forbidden and rework clears previous outputs and inspection',async t=>{
 const f=fixture(t),o=await f.releasedOrder();
 const l=await f.call('admin','/api/operations/lots',{orderId:o.id,code:'ADMIN-LOT',materialLot:'HEAT-1',quantity:100});
 const running=await f.patch('production','lots',l,'start'),held=await f.patch('production','lots',running,'finish',{good:95,scrap:5});
 await rejected(f.patch('admin','lots',held,'release',{inspectionId:f.inspection(l.code)}),403);
 await rejected(f.patch('quality','lots',held,'block',{note:'short'}),400);
 const blocked=await f.patch('quality','lots',held,'block',{note:'Documented dimensional review'}),queued=await f.patch('production','lots',blocked,'rework',{note:'Reset fixture and repeat inspection'});
 assert.equal(queued.status,'queued');assert.equal(queued.good,null);assert.equal(queued.scrap,null);assert.equal(queued.inspectionId,null);
});

test('maintenance task requires owner execution and independent verification; open critical task blocks production',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id);
 const recordId=f.record('maintenance',{asset:'A1',priority:'بحرانی',resolution:'Text alone does not prove independent closure'});
 await rejected(f.patch('production','lots',l,'start'),409);
 const task=await f.call('maintenance','/api/operations/tasks',{recordId,ownerId:f.users.maintenance.id,dueDate:'2026-10-10'});
 await rejected(f.call('maintenance','/api/operations/tasks',{recordId,ownerId:f.users.maintenance.id,dueDate:'2026-10-10'}),409);
 await rejected(f.patch('production','tasks',task,'start'),403);
 const started=await f.patch('maintenance','tasks',task,'start');
 await rejected(f.patch('admin','tasks',started,'complete',{note:'Completed repair with evidence'}),403);
 const verification=await f.patch('maintenance','tasks',started,'complete',{note:'Completed repair with evidence'});
 await rejected(f.patch('maintenance','tasks',verification,'verify',{note:'Verified repair with evidence'}),403);
 const closed=await f.patch('maintenance2','tasks',verification,'verify',{note:'Verified repair with evidence'});
 assert.equal(closed.status,'closed');assert.equal((await f.patch('production','lots',l,'start')).status,'running');
 const reopened=await f.patch('executive','tasks',closed,'reopen',{note:'New evidence requires checking'});assert.equal(reopened.status,'open');
});

test('stock ledger rejects overdraft and duplicate code; returns are linked and bounded; failed audit rolls back',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id);
 const movement=(role,code,direction,quantity,extra={})=>f.call(role,'/api/operations/movements',{code,material:'54SiCr6',lot:'HEAT-1',unit:'kg',direction,quantity,...extra});
 await rejected(movement('production','R0','receipt',100),403);
 await movement('engineering','R1','receipt',100);
 await rejected(movement('engineering','R1','receipt',100),409);
 await rejected(movement('production','I0','issue',101,{productionLotId:l.id}),409);
 await rejected(movement('production','I1','issue',1,{productionLotId:l.id,lot:'WRONG-HEAT'}),409);
 f.breakAudit(true);await assert.rejects(movement('production','I2','issue',10,{productionLotId:l.id}),/audit unavailable/);f.breakAudit(false);
 assert.equal((await f.call('auditor','/api/operations')).stock[0].balance,100);
 await movement('production','I3','issue',80,{productionLotId:l.id});
 await rejected(movement('production','BACK0','return',81,{productionLotId:l.id}),409);
 await movement('production','BACK1','return',5,{productionLotId:l.id});
 assert.equal((await f.call('auditor','/api/operations')).stock[0].balance,25);
 assert.equal(f.q('SELECT COUNT(*) n FROM operation_movements').get().n,3);
 const issued=await f.call('auditor','/api/operations?tab=movements&status=issue');assert.equal(issued.movements.length,1);assert.equal(issued.movements[0].code,'I3');assert.equal(issued.totalCounts.movements,1);
});

test('server search precedes the 200 row limit and detail preserves genealogy with safe event projection',async t=>{
 const f=fixture(t),old=await f.releasedOrder(),l=await f.lot(old.id);
 const base=f.q('SELECT * FROM operation_orders WHERE id=?').get(old.id);
 const insert=f.q(`INSERT INTO operation_orders(${Object.keys(base).join(',')}) VALUES(${Object.keys(base).map(()=>'?').join(',')})`);
 for(let i=0;i<205;i++)insert.run(...Object.values({...base,id:randomUUID(),code:'NEW-'+i,created_at:'2099-01-01T00:00:00.000Z'}));
 const overview=await f.call('energy','/api/operations');assert.equal(overview.orders.length,200);assert.equal(overview.totalCounts.orders,206);assert.equal(overview.limited.orders,true);
 const result=await f.call('auditor','/api/operations?tab=orders&q='+encodeURIComponent(old.code));assert.equal(result.orders.length,1);assert.equal(result.orders[0].id,old.id);assert.equal(result.limited.orders,false);
 const detail=await f.call('production','/api/operations/lots/'+l.id);assert.equal(detail.order.id,old.id);assert.equal(detail.recipe.id,f.recipeId);
 f.q('UPDATE audit SET details=? WHERE target=?').run(JSON.stringify({entityType:'lot',to:'queued',note:'Visible note',password:'secret',token:'secret'}),l.id);
 const events=(await f.call('auditor','/api/operations')).events;assert.ok(events.some(e=>e.details.note==='Visible note'));assert.equal(JSON.stringify(events).includes('secret'),false);assert.ok(!('password' in overview.staff[0]));
 await rejected(f.call('auditor','/api/operations/lots/not-a-uuid'),400);
 await rejected(f.call('auditor','/api/operations/lots/'+randomUUID()),404);
});

test('stale concurrent task version and wrong domain assignment cannot change the task',async t=>{
 const f=fixture(t),recordId=f.record('ncr',{batch:'LOT-X'});
 await rejected(f.call('maintenance','/api/operations/tasks',{recordId,ownerId:f.users.quality.id,dueDate:'2026-10-10'}),403);
 await rejected(f.call('quality','/api/operations/tasks',{recordId,ownerId:f.users.production.id,dueDate:'2026-10-10'}),400);
 const task=await f.call('quality','/api/operations/tasks',{recordId,ownerId:f.users.quality.id,dueDate:'2026-10-10'});
 const concurrent=await Promise.allSettled([f.patch('quality','tasks',task,'start'),f.patch('quality','tasks',task,'start')]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);assert.equal(concurrent.filter(r=>r.status==='rejected'&&r.reason.code===409).length,1);
 assert.equal(f.q('SELECT version FROM operation_tasks WHERE id=?').get(task.id).version,2);
});

test('reference expansion respects domain RBAC and hides unauthorized NCR data and decision notes',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id),running=await f.patch('production','lots',l,'start'),held=await f.patch('production','lots',running,'finish',{good:100,scrap:0});
 const inspectionId=f.inspection(l.code);await f.patch('quality','lots',held,'release',{inspectionId});
 const recordId=f.record('ncr',{batch:'PRIVATE-BATCH',containment:'PRIVATE-CONTAINMENT',rootCause:'PRIVATE-ROOT-CAUSE'});
 const task=await f.call('quality','/api/operations/tasks',{recordId,ownerId:f.users.quality.id,dueDate:'2026-10-10'}),started=await f.patch('quality','tasks',task,'start');
 await f.patch('quality','tasks',started,'complete',{note:'PRIVATE-NCR-DECISION: containment reviewed'});
 for(const role of ['energy','maintenance']){
  const detail=await f.call(role,'/api/operations/lots/'+l.id);assert.equal(detail.recipe,null);assert.equal(detail.inspection,null);assert.equal(detail.asset.id,f.assetId);
  const capa=await f.call(role,'/api/operations/tasks/'+task.id);assert.equal(capa.record,null);assert.equal(capa.task.id,task.id);assert.equal(capa.task.kind,'capa');
  const overview=await f.call(role,'/api/operations');assert.equal(JSON.stringify(overview).includes('PRIVATE-CONTAINMENT'),false);assert.equal(JSON.stringify(overview).includes('PRIVATE-ROOT-CAUSE'),false);assert.equal(JSON.stringify(overview).includes('PRIVATE-NCR-DECISION'),false);
 }
 const allowed=await f.call('quality','/api/operations/lots/'+l.id);assert.equal(allowed.recipe.id,f.recipeId);assert.equal(allowed.inspection.id,inspectionId);assert.equal((await f.call('quality','/api/operations/tasks/'+task.id)).record.data.containment,'PRIVATE-CONTAINMENT');
});

test('release fails closed for defective or stale QC and for zero good output; fresh zero-defect QC passes',async t=>{
 const f=fixture(t),o=await f.releasedOrder(),l=await f.lot(o.id),running=await f.patch('production','lots',l,'start'),held=await f.patch('production','lots',running,'finish',{good:100,scrap:0});
 const defective=f.record('inspection',{batch:l.code,part:'P1',measured:10,nominal:10,tolerance:1,instrument:'I1',sampleCount:10,defects:10});
 await assert.rejects(f.patch('quality','lots',held,'release',{inspectionId:defective}),e=>e.code===409&&e.message.includes('دارای عیب'));
 const fresh=f.inspection(l.code);
 f.q('UPDATE records SET created_at=? WHERE id=?').run('2000-01-01T00:00:00.000Z',fresh);
 await assert.rejects(f.patch('quality','lots',held,'release',{inspectionId:fresh}),e=>e.code===409&&e.message.includes('پس از'));
 f.q('UPDATE records SET created_at=?,updated_at=? WHERE id=?').run(new Date().toISOString(),'2000-01-01T00:00:00.000Z',fresh);
 await assert.rejects(f.patch('quality','lots',held,'release',{inspectionId:fresh}),e=>e.code===409&&e.message.includes('پس از'));
 f.q('UPDATE records SET updated_at=? WHERE id=?').run(new Date().toISOString(),fresh);
 assert.equal((await f.patch('quality','lots',held,'release',{inspectionId:fresh})).status,'released');
 const emptyOrder=await f.releasedOrder(10),emptyLot=await f.lot(emptyOrder.id,10),emptyRunning=await f.patch('production','lots',emptyLot,'start'),emptyHeld=await f.patch('production','lots',emptyRunning,'finish',{good:0,scrap:10});
 await assert.rejects(f.patch('quality','lots',emptyHeld,'release',{inspectionId:f.inspection(emptyLot.code)}),e=>e.code===409&&e.message.includes('بدون قطعه سالم'));
 assert.equal(f.q('SELECT status FROM operation_lots WHERE id=?').get(emptyLot.id).status,'quality_hold');
});

test('draft order edits preserve identity, enforce ownership and references, and update version atomically',async t=>{
 const f=fixture(t),o=await f.order(),data={customer:'Updated customer',product:'P1',quantity:120,startDate:'2026-10-02',dueDate:'2026-11-01',priority:'high',recipeId:f.recipeId,assetId:f.assetId};
 await rejected(f.patch('quality','orders',o,'edit',{data}),403);
 await rejected(f.patch('production','orders',o,'edit',{data:{...data,code:'CHANGE'}}),400);
 await rejected(f.patch('production','orders',o,'edit',{data:{...data,id:randomUUID()}}),400);
 await rejected(f.patch('production','orders',o,'edit',{data:{...data,product:'MISMATCH'}}),409);
 await rejected(f.patch('production','orders',o,'edit',{data:{...data,quantity:1.5}}),400);
 const pending=f.record('recipe',{part:'P1',material:'54SiCr6'},'draft');await rejected(f.patch('production','orders',o,'edit',{data:{...data,recipeId:pending}}),409);
 f.breakAudit(true);await assert.rejects(f.patch('production','orders',o,'edit',{data}),/audit unavailable/);f.breakAudit(false);
 assert.equal(f.q('SELECT customer,version FROM operation_orders WHERE id=?').get(o.id).version,1);
 const edited=await f.patch('production','orders',o,'edit',{data});assert.equal(edited.quantity,120);assert.equal(edited.id,o.id);assert.equal(edited.code,o.code);assert.equal(edited.version,2);
 await rejected(f.patch('production','orders',o,'edit',{data}),409);
 const adminEdit=await f.patch('admin','orders',edited,'edit',{data:{...data,customer:'Admin adjustment'}});
 const released=await f.patch('executive','orders',adminEdit,'release');await rejected(f.patch('admin','orders',released,'edit',{data}),409);
 const audit=JSON.parse(f.q("SELECT details FROM audit WHERE target=? AND action='operations.order.edit' ORDER BY id DESC LIMIT 1").get(o.id).details);assert.ok(audit.changedFields.includes('customer'));assert.equal(audit.version,3);
});

test('reassignment recovers inactive owners, restarts work and preserves assignment history with version and domain guards',async t=>{
 const f=fixture(t),recordId=f.record('maintenance',{asset:'A1',priority:'عادی'}),task=await f.call('maintenance','/api/operations/tasks',{recordId,ownerId:f.users.maintenance.id,dueDate:'2026-10-10'});
 const running=await f.patch('maintenance','tasks',task,'start'),extra={ownerId:f.users.maintenance2.id,dueDate:'2026-10-15',note:'Shift change and documented handover'};
 await rejected(f.patch('quality','tasks',running,'assign',extra),403);
 await rejected(f.patch('executive','tasks',running,'assign',{...extra,note:'short'}),400);
 await rejected(f.patch('executive','tasks',running,'assign',{...extra,ownerId:f.users.quality.id}),400);
 f.q('UPDATE users SET active=0 WHERE id=?').run(f.users.maintenance.id);
 await rejected(f.patch('executive','tasks',running,'assign',{...extra,ownerId:f.users.maintenance.id}),400);
 f.breakAudit(true);await assert.rejects(f.patch('executive','tasks',running,'assign',extra),/audit unavailable/);f.breakAudit(false);
 assert.equal(f.q('SELECT owner_id FROM operation_tasks WHERE id=?').get(task.id).owner_id,f.users.maintenance.id);
 const assigned=await f.patch('executive','tasks',running,'assign',extra);assert.equal(assigned.status,'open');assert.equal(assigned.ownerId,f.users.maintenance2.id);assert.equal(assigned.version,3);
 await rejected(f.patch('executive','tasks',running,'assign',extra),409);
 await rejected(f.patch('maintenance','tasks',assigned,'start'),403);
 const nextRunning=await f.patch('maintenance2','tasks',assigned,'start'),verification=await f.patch('maintenance2','tasks',nextRunning,'complete',{note:'Work completed with handover evidence'});
 await rejected(f.patch('executive','tasks',verification,'assign',extra),409);
 const closed=await f.patch('admin','tasks',verification,'verify',{note:'Independent verification and acceptance'});await rejected(f.patch('executive','tasks',closed,'assign',extra),409);
 const entry=JSON.parse(f.q("SELECT details FROM audit WHERE target=? AND action='operations.task.assign'").get(task.id).details);assert.equal(entry.previousOwnerId,f.users.maintenance.id);assert.equal(entry.ownerId,f.users.maintenance2.id);assert.equal(entry.from,'in_progress');assert.equal(entry.to,'open');
});


test('material kilograms use gram precision without floating balance or return drift',async t=>{
 const f=fixture(t),order=await f.releasedOrder(),lot=await f.lot(order.id);
 const movement=(role,code,direction,quantity)=>f.call(role,'/api/operations/movements',{code,material:'54SiCr6',lot:'HEAT-1',unit:'kg',direction,quantity,...(direction!=='receipt'?{productionLotId:lot.id}:{})});
 await movement('engineering','GRAM-RECEIPT','receipt',0.3);
 await movement('production','GRAM-ISSUE-1','issue',0.1);
 await movement('production','GRAM-ISSUE-2','issue',0.2);
 assert.equal((await f.call('production','/api/operations')).stock[0].balance,0);
 await rejected(movement('production','GRAM-EXCESS','issue',0.001),409);
 await rejected(movement('engineering','GRAM-PRECISION','receipt',0.0001),400);
 await movement('production','GRAM-RETURN','return',0.3);
 assert.equal((await f.call('production','/api/operations')).stock[0].balance,0.3);
});
