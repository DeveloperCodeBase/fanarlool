import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const [{calculateEconomics},{csvCell},{fromJalaliDate,toJalaliDate,tehranDate},{calculateOee,capability,spring,energy,parseSeries,wilson}]=await Promise.all(['platform/economics','platform/csv','platform/calendar','components/labMath'].map(loadTs));
const close=(actual,expected,precision=2)=>assert(Math.abs(actual-expected)<10**-precision,`${actual} != ${expected}`);
const scenario={quantity:4000000,scrapBefore:5,scrapAfter:3.8,rejectNetCost:12000,downtimeHours:100,downtimeReduction:20,avoidableHourlyLoss:2000000,energyCost:400000000,energyReduction:6,releasedHours:400,hourValue:200000,cashLabor:false,investment:1000000000,annualOperatingCost:180000000,realization:100};
test('cash benefit excludes labour opportunity; sensitivity changes payback correctly',()=>{
 const r=calculateEconomics(scenario);close(r.scrap,576000000);assert.equal(r.downtime,40000000);assert.equal(r.energy,24000000);assert.equal(r.opportunity,80000000);close(r.gross,640000000);close(r.net,460000000);close(r.paybackMonths,26.08695652);close(calculateEconomics({...scenario,realization:50}).net,140000000);close(calculateEconomics({...scenario,cashLabor:true}).gross,720000000);
});
test('nonpositive cash benefit has no payback; invalid assumptions reject',()=>{
 assert.equal(calculateEconomics({...scenario,realization:0}).paybackMonths,null);assert.equal(calculateEconomics({...scenario,investment:0}).annualRoi,null);
 for(const patch of [{scrapAfter:6},{realization:101},{quantity:NaN},{annualOperatingCost:-1}])assert.throws(()=>calculateEconomics({...scenario,...patch}));
});
test('CSV protects whitespace formula payloads and preserves multiline values',()=>{
 for(const value of ['=SUM(A1)','  +1','\t@SUM(1)','\r\n-1','\uFEFF=1'])assert.equal(csvCell(value),'"\''+value+'"');
 assert.equal(csvCell('شرح "قطعه"\nخط ۱'),'"شرح ""قطعه""\nخط ۱"');assert.equal(csvCell(125),'"125"');assert.equal(csvCell(null),'""');
});
test('Jalali dates round trip, validate leap days and respect Tehran midnight',()=>{
 assert.equal(toJalaliDate('2026-10-03'),'1405/07/11');assert.equal(fromJalaliDate('۱۴۰۵/۰۷/۱۱'),'2026-10-03');assert.equal(fromJalaliDate('١٤٠٥/٠٧/١١'),'2026-10-03');
 assert.equal(fromJalaliDate('1403/12/30'),'2025-03-20');assert.equal(fromJalaliDate('1404/12/30'),null);assert.equal(fromJalaliDate('1405/07/31'),null);assert.equal(fromJalaliDate('1405/13/01'),null);assert.equal(toJalaliDate('2026-02-30'),'');
 for(const iso of ['2026-03-21','2024-02-29','2026-12-31'])assert.equal(fromJalaliDate(toJalaliDate(iso)),iso);
 assert.equal(tehranDate(new Date('2026-10-03T22:00:00Z')),'2026-10-04');
});
test('OEE preserves meaningful zero-production states and rejects impossible cycles',()=>{
 const r=calculateOee(480,400,10,1800,1710);close(r.availability,400/480,12);close(r.performance,.75,12);close(r.quality,.95,12);close(r.oee,.59375,12);assert.equal(r.downtimeMinutes,80);assert.equal(r.rejected,90);
 for(const [run,performance] of [[0,null],[100,0]]){const empty=calculateOee(480,run,10,0,0);assert.equal(empty.oee,0);assert.equal(empty.performance,performance);assert.equal(empty.quality,null);}
 assert.throws(()=>calculateOee(480,481,10,1,1),/inconsistent_production/);assert.throws(()=>calculateOee(480,400,10,2401,2400),/cycle_exceeds_runtime/);assert.throws(()=>calculateOee(480,400,10,100,101),/inconsistent_production/);
});
test('SPC separates MR capability and sample performance and detects ordered trends',()=>{
 const r=capability([0,1,2,3,4,5],-1,6);close(r.mean,2.5,12);close(r.mrbar,1,12);close(r.withinSigma,1/1.128,12);close(r.sampleSigma,Math.sqrt(3.5),12);close(r.cp,7/(6/1.128),12);close(r.cpk,3.5/(3/1.128),12);close(r.pp,7/(6*Math.sqrt(3.5)),12);close(r.ppk,3.5/(3*Math.sqrt(3.5)),12);assert(Math.abs(r.ppk-r.cpk*.96)>1e-5);assert.deepEqual(r.violations.trends,[5]);assert.equal(r.stable,false);assert.equal(r.preliminary,true);assert.equal(r.timeOrderRequired,true);assert.throws(()=>capability([1,1,1],0,2),/zero_variation/);assert.throws(()=>capability([1,2,3],2,1),/invalid_limits/);
});
test('spring physics keeps overload visible and rejects invalid geometry',()=>{
 const r=spring(12,100,300,6,8,1000);close(r.rate,33.912,10);assert.equal(r.solidHeight,96);close(r.deflection,1000/33.912,10);assert.equal(r.solid,false);
 const a=spring(12,100,300,6,8,100000);assert(a.stressRatio>1);assert(a.safetyFactor<.5);assert(a.overload&&a.solid);assert(a.warnings.includes('solid_contact'));assert(a.warnings.includes('illustrative_overload'));assert.equal(spring(12,100,300,6,8,0).safetyFactor,null);
 assert.throws(()=>spring(0,100,300,6,8,1000),/positive_required/);assert.throws(()=>spring(12,12,300,6,8,1000),/invalid_spring_geometry/);assert.throws(()=>spring(12,100,300,8,6,1000),/invalid_spring_geometry/);
});
test('energy uses meter differences and does not invent zero-tonnage intensity',()=>{
 assert.deepEqual(energy(1000,1600,2,1500),{consumption:600,intensity:300,cost:900000});assert.equal(energy(1000,1600,0,1500).intensity,null);assert.throws(()=>energy(1000,999,2,1500),/reversed_meter/);assert.throws(()=>energy(0,Infinity,2,1500),/non_finite/);assert.throws(()=>energy(0,600,2,-1500),/negative_value/);
});
test('measurement parsing supports local digits and rejects corrupt values',()=>{
 assert.deepEqual(parseSeries('۱٫۲; ٢٫٥\n۳٬۰۰۰، -۴.۵'),[1.2,2.5,3000,-4.5]);assert.deepEqual(parseSeries('1e2 2.5e-1'),[100,.25]);assert.throws(()=>parseSeries(''),/empty_series/);assert.throws(()=>parseSeries('1;2mm;3'),/invalid_number/);assert.throws(()=>parseSeries('1;1e999;3'),/non_finite/);
});
test('Wilson retains uncertainty with zero or all defects and validates sample counts',()=>{
 const none=wilson(0,100),all=wilson(100,100);assert.equal(none.rate,0);close(none.lower,0,12);close(none.upper,.0369934982,9);assert.equal(all.rate,1);close(all.upper,1,12);close(all.lower,1-none.upper,12);assert.equal(none.confidence,.95);assert.throws(()=>wilson(1,0),/positive_required/);assert.throws(()=>wilson(101,100),/defects_exceed_count/);assert.throws(()=>wilson(.5,100),/integer_required/);
});
