import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const {productionMetrics,energyMetrics,inspectionMetrics,periodRows,operationalAlerts,relatedRecords}=await loadTs('platform/operationsInsights');
const row=(id,kind,data,status='approved')=>({id,kind,data,status,created_at:'2026-10-04T05:00:00Z'});
test('dashboard production uses weighted approved shifts and preserves absent measurements',()=>{
 const rows=[row('a','production',{plannedMinutes:480,runMinutes:400,total:4000,good:3800,idealCycleSeconds:5}),row('b','production',{plannedMinutes:240,runMinutes:200,total:1000,good:900,idealCycleSeconds:6}),row('draft','production',{plannedMinutes:1,runMinutes:1,total:999999,good:999999},'draft')];
 const p=productionMetrics(rows);assert.equal(p.shifts,2);assert.equal(p.total,5000);assert.equal(p.good,4700);assert.equal(p.scrap,300);assert.equal(p.downtime,120);assert(Math.abs(p.oee-(600/720)*(26000/60/600)*(4700/5000))<1e-12);
 assert.equal(productionMetrics([]).oee,null);assert.equal(inspectionMetrics([]).defectRate,null);assert.equal(inspectionMetrics([row('i','inspection',{sampleCount:50,defects:2,nominal:10,measured:10.3,tolerance:.2})]).outside,1);
});
test('energy aggregation separates carriers, excludes drafts and requires a tonnage denominator',()=>{
 const rows=[row('e','energy',{carrier:'برق kWh',readingStart:100,readingEnd:150,tonnage:2,outageMinutes:5}),row('e2','energy',{carrier:'برق kWh',readingStart:150,readingEnd:180,tonnage:2,outageMinutes:0}),row('gas','energy',{carrier:'گاز m³',readingStart:0,readingEnd:99999,tonnage:1}),row('draft','energy',{carrier:'برق kWh',readingStart:0,readingEnd:88888,tonnage:1},'draft')];
 assert.deepEqual(energyMetrics(rows,'برق kWh'),{count:2,consumption:80,tonnage:4,intensity:20,outage:5});assert.equal(energyMetrics([],'برق kWh').consumption,null);assert.equal(energyMetrics([row('z','energy',{carrier:'برق kWh',readingStart:0,readingEnd:10,tonnage:0})],'برق kWh').intensity,null);
});
test('analysis period includes both boundary dates and excludes future or old records',()=>{
 const rows=['2026-09-20','2026-09-21','2026-10-04','2026-10-05'].map(day=>row(day,'production',{date:day}));assert.deepEqual(periodRows(rows,14,'2026-10-04').map(r=>r.id),['2026-09-21','2026-10-04']);assert.equal(periodRows(rows,0,'2026-10-04').length,4);
});
test('operational follow-up requires approved evidence except unresolved maintenance requests',()=>{
 const rows=[row('m','maintenance',{priority:'بحرانی',due:'2026-10-01',resolution:''},'submitted'),row('resolved','maintenance',{priority:'بحرانی',resolution:'fixed'}),row('cal','calibration',{expiresAt:'2026-10-03'}),row('draftcal','calibration',{expiresAt:'2020-01-01'},'draft'),row('reject','inventory',{quantity:0,minimum:5},'rejected'),row('stock','inventory',{quantity:1,minimum:5}),row('today','calibration',{expiresAt:'2026-10-04'})];
 assert.deepEqual(operationalAlerts(rows,'2026-10-04').map(a=>[a.record.id,a.reason]),[['m','critical_maintenance'],['cal','calibration_expired'],['stock','low_stock']]);
});
test('trace links match exact nonempty identifiers and only the supplied authorised records',()=>{
 const root=row('root','inspection',{batch:'B-1',part:'P-1',instrument:'G-1',asset:'A-1'}),other=[root,row('batch','production',{batch:'B-1'}),row('lot','inventory',{lot:'B-1'}),row('asset','asset',{code:'A-1'}),row('prefix','production',{batch:'B-10'}),row('empty','inspection',{})];assert.deepEqual(relatedRecords(root,other).map(r=>r.id),['batch','lot','asset']);assert.equal(relatedRecords(row('e','inspection',{}),other).length,0);
});
