import {randomBytes,randomUUID} from 'node:crypto';
import {openDatabase} from './storage.mjs';
import {createApp,hashPassword} from './app.mjs';
import {roles,schemas,validateRecord} from './domain.mjs';

export const demoPassword='FanarDemo-2026!';
export async function createDemoRouter({origin,sha,secure=true,maxSpaces=24}) {
  const passwordHash=await hashPassword(demoPassword),spaces=new Map(),allocations=new Map();
  const spaceCookie=(secure?'__Host-':'')+'fanar_demo_space';
  function seed(){
    const db=openDatabase(':memory:'),ids={},now=new Date().toISOString();
    for(const [role,label] of Object.entries(roles)){
      const id=ids[role]=randomUUID();db.prepare('INSERT INTO users(id,username,name,role,password,must_change,created_at) VALUES(?,?,?,?,?,0,?)').run(id,`demo.${role}`,`${label} دمو`,role,passwordHash,now);
      db.prepare('INSERT INTO user_profiles(user_id,department,job_title,preferences) VALUES(?,?,?,?)').run(id,'کارخانه نمونه',label,JSON.stringify({density:'comfortable',startPage:'overview',notifications:true}));
    }
    for(const [kind,s] of Object.entries(schemas))for(let i=0;i<3;i++){
      const data=Object.fromEntries(s.fields.map(f=>[f.key,f.type==='select'?f.options[0]:f.type==='date'?'2026-10-03':f.type==='number'?Math.max(f.min,1):f.optional?'':'نمونه آموزشی']));
      Object.assign(data,kind==='production'?{batch:`DEMO-B${i+1}`,line:'خط فرم‌دهی ۱',product:'FL-220',plannedMinutes:480,runMinutes:420,idealCycleSeconds:20,total:1000+i*50,good:980+i*45,downtimeReason:'توقف آموزشی تنظیم دستگاه'}:kind==='inspection'?{batch:`DEMO-B${i+1}`,part:'FL-220',sampleCount:50,defects:2,dimension:'طول آزاد mm',nominal:220,tolerance:1,measured:220.4,instrument:'کولیس نمونه'}:kind==='energy'?{meter:'DEMO-M1',line:'خط فرم‌دهی ۱',readingStart:100000+i*1000,readingEnd:100240+i*1000,tonnage:3,outageMinutes:20}:kind==='recipe'?{part:'FL-220',revision:'R01',material:'فولاد فنر نمونه',wireDiameter:10,meanDiameter:60,activeCoils:6,freeLength:220}:kind==='calibration'?{instrument:'DEMO-C01',name:'کولیس نمونه',calibratedAt:'2026-09-01',expiresAt:'2027-09-01',certificate:'DEMO-ONLY',lab:'آزمایشگاه آموزشی',uncertainty:'صرفاً نمونه'}:kind==='asset'?{code:`DEMO-A${i+1}`,name:'دستگاه فرم‌دهی نمونه',line:'خط ۱'}:kind==='maintenance'?{asset:'DEMO-A1',title:'بررسی لرزش دستگاه نمونه',symptom:'سناریوی آموزشی',resolution:'بازبینی پیشنهادی'}:kind==='ncr'?{batch:`DEMO-B${i+1}`,title:'خروج طول آزاد از تلرانس نمونه',containment:'قرنطینه آموزشی',owner:'کنترل کیفیت نمونه'}:{code:`DEMO-SP${i+1}`,name:'قطعه یدکی نمونه',lot:'DEMO-LOT',quantity:12,minimum:5,supplier:'تأمین‌کننده نمونه',location:'قفسه ۱'});
      const clean=validateRecord(kind,data),status=['approved','submitted','draft'][i],id=randomUUID(),creator=ids[s.write[0]],approver=status==='approved'?ids.admin:null;
      db.prepare('INSERT INTO records(id,kind,data,status,creator,approver,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,kind,JSON.stringify(clean),status,creator,approver,now,now);
      db.prepare('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(creator,'demo.record.seeded',id,JSON.stringify({kind,demo:true}),now);
    }
    return {db,app:createApp({db,origin,sha,secure,demo:true,prefix:'/api/demo'}),lastSeen:Date.now(),active:0};
  }
  function reject(res,status,message){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));}
  return {handle(req,res){
    const now=Date.now();
    for(const [id,space] of spaces)if(!space.active&&now-space.lastSeen>3600000){space.db.close();spaces.delete(id);}
    for(const [ip,record] of allocations)if(record.until<now)allocations.delete(ip);
    const key=(req.headers.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith(spaceCookie+'='))?.slice(spaceCookie.length+1);
    let space=spaces.get(key);
    if(!space){
      if(req.method!=='POST'||new URL(req.url,origin).pathname!=='/api/demo/auth/login')return reject(res,401,'برای مشاهده دمو یکی از نقش‌ها را انتخاب کنید');
      if(req.headers.origin!==origin)return reject(res,403,'مبدأ درخواست مجاز نیست');
      const ip=String(req.headers['x-real-ip']||req.socket.remoteAddress||'unix'),allocated=allocations.get(ip);
      if(spaces.size>=maxSpaces||(allocated?.count||0)>=10)return reject(res,429,'ظرفیت نمایش دمو موقتاً تکمیل است؛ بعداً تلاش کنید');
      const id=randomBytes(24).toString('hex');space=seed();spaces.set(id,space);allocations.set(ip,{count:(allocated?.count||0)+1,until:allocated?.until||now+900000});
      const writeHead=res.writeHead;
      res.writeHead=function(status,headers){const cookie=`${spaceCookie}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600${secure?'; Secure':''}`;headers['Set-Cookie']=[...(headers['Set-Cookie']?[headers['Set-Cookie']]:[]),cookie];return writeHead.call(this,status,headers);};
    }
    space.lastSeen=now;space.active++;res.once('finish',()=>space.active--);space.app.emit('request',req,res);
  },close(){for(const space of spaces.values())space.db.close();spaces.clear();}};
}
