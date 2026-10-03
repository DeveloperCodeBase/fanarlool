import test from 'node:test';
import assert from 'node:assert/strict';
import {splitDataset,fitScaler,trainBaseline,predict,evaluate,parseDataset} from '../server/model/reference.mjs';
const row=(id,x,y)=>({id,x:Array(27).fill(x),y});
test('feature-identical rows remain in one fold; seed reproducible; scaler sees training only',()=>{
 const rows=[];for(let y=0;y<7;y++)for(let i=0;i<12;i++)rows.push(row(rows.length,y*100+i,y));rows.push({...rows[0],id:rows.length});const a=splitDataset(rows),b=splitDataset(rows);assert.deepEqual(a,b);const ids=new Set(a.train.map(r=>JSON.stringify(r.x)));assert(a.test.every(r=>!ids.has(JSON.stringify(r.x))));assert.equal(a.train.length+a.test.length,rows.length);assert.equal(a.duplicateRows,1);
 const scaler=fitScaler([row(0,2,0),row(1,4,1)]);assert.equal(scaler.mean[0],3);assert.equal(scaler.scale[0],1);assert.equal(fitScaler([row(0,2,0)]).scale[0],1);
});
test('trained softmax is deterministic; confusion rows match support and predictions normalize',()=>{
 const rows=[];for(let y=0;y<7;y++)for(let i=0;i<8;i++)rows.push(row(rows.length,y*20+i*.1,y));const a=trainBaseline(rows,{epochs:10}),b=trainBaseline(rows,{epochs:10});assert.deepEqual(a,b);const p=predict(a,rows[0].x);assert(Math.abs(p.probabilities.reduce((x,y)=>x+y,0)-1)<1e-12);const report=evaluate(a,rows);assert.equal(report.confusion.flat().reduce((x,y)=>x+y,0),rows.length);report.perClass.forEach((c,i)=>assert.equal(c.support,report.confusion[i].reduce((x,y)=>x+y,0)));assert(report.macroF1>=0&&report.macroF1<=1);assert.throws(()=>predict(a,[1,2]),/27/);assert.throws(()=>evaluate(a,[]),/Empty/);assert.throws(()=>parseDataset('1 2'),/Invalid/);
});
