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
    // Browser-private, synthetic records only. Never called for the production DB.
    const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    const today=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
    const date=daysAgo=>new Date(Date.parse(today+'T00:00:00Z')-daysAgo*86400000).toISOString().slice(0,10);
    const line=i=>i%2?'DEMO-L2':'DEMO-L1',part=i=>['FL-220','FL-250','FL-300'][i%3],batch=i=>`DEMO-B${String(i+1).padStart(2,'0')}`;
    function insert(kind,values,status='approved',daysAgo=1){
      const s=schemas[kind],data=Object.fromEntries(s.fields.map(f=>[f.key,f.type==='select'?f.options[0]:f.type==='date'?date(daysAgo):f.type==='number'?Math.max(f.min,1):f.optional?'':'نمونه آموزشی']));
      Object.assign(data,values);
      const clean=validateRecord(kind,data),id=randomUUID(),creator=ids[s.write[0]],approver=['approved','rejected'].includes(status)?ids.admin:null;
      const at=date(daysAgo)+'T09:00:00.000Z';
      db.prepare('INSERT INTO records(id,kind,data,status,creator,approver,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,kind,JSON.stringify(clean),status,creator,approver,at,at);
      db.prepare('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(creator,'demo.record.seeded',id,JSON.stringify({kind,demo:true,to:status,version:1,...(status==='rejected'?{note:'سناریوی آموزشی: مقدار ثبت‌شده نیازمند بازبینی و اصلاح است.'}:{})}),at);
      return id;
    }
    for(let i=0;i<3;i++){
      insert('asset',{code:`DEMO-A${i+1}`,name:['فنرپیچ آموزشی','سنگ‌زن آموزشی','کوره آموزشی'][i],line:i===2?'DEMO-L2':'DEMO-L1',criticality:['زیاد','متوسط','زیاد'][i],manufacturer:'سازنده نمونه',serviceIntervalDays:30,lastService:date([40,12,28][i]),spareSource:'تأمین‌کننده آموزشی'});
      insert('recipe',{part:part(i),revision:'R01',material:'54SiCr6 · نمونه آموزشی',wireDiameter:10+i,meanDiameter:60+i*10,activeCoils:6,freeLength:[220,250,300][i],standard:'معیار آموزشی، بدون گواهی انطباق',notes:'نسخه نمونه؛ دستور ساخت واقعی کارخانه نیست.'});
      insert('calibration',{instrument:`DEMO-C0${i+1}`,name:['کولیس آموزشی','میکرومتر آموزشی','ساعت اندازه‌گیری آموزشی'][i],calibratedAt:date(120),expiresAt:date([-180,2,-7][i]),certificate:`DEMO-CERT-${i+1}`,lab:'آزمایشگاه آموزشی',uncertainty:'نمونه آموزشی mm',notes:'گواهی آموزشی؛ شاهد کالیبراسیون واقعی نیست.'});
    }
    for(let i=0;i<5;i++)insert('inventory',{code:i<3?`DEMO-WIRE${i+1}`:`DEMO-SP${i-2}`,name:i<3?'مفتول فنر آموزشی':'قطعه یدکی آموزشی',lot:`DEMO-HEAT${i+1}`,unit:i<3?'kg':'عدد',quantity:[850,15,120,2,12][i],minimum:[200,50,80,5,5][i],supplier:'تأمین‌کننده آموزشی',location:`DEMO-RACK-${i+1}`});
    const meterReadings=new Map();
    for(let i=0;i<14;i++){
      const daysAgo=13-i;
      for(let shift=0;shift<2;shift++){
        const total=1050+i*12+shift*30;
        insert('production',{batch:batch(i),line:line(i),product:part(i),date:date(daysAgo),shift:shift?'عصر':'صبح',plannedMinutes:480,runMinutes:400+(i%5)*8,idealCycleSeconds:18,total,good:total-18-(i%5)*4,downtimeReason:'نمونه آموزشی: تنظیم ابزار و تعویض کلاف'},'approved',daysAgo);
      }
      const nominal=[220,250,300][i%3];
      insert('inspection',{batch:batch(i),part:part(i),sampleCount:60,defects:[0,1,2,4][i%4],dimension:'طول آزاد mm',nominal,tolerance:1,measured:nominal+[0.1,0.3,0.6,1.2][i%4],instrument:`DEMO-C0${i%3+1}`,notes:'اندازه‌گیری مصنوعی آموزشی؛ داده کارخانه نیست.'},i>=12?'submitted':'approved',daysAgo);
      for(let carrier=0;carrier<2;carrier++){
        const meter=`DEMO-${carrier?'G':'E'}-${line(i).slice(-1)}`,start=meterReadings.get(meter)||10000,end=start+(carrier?120:280)+i*8;
        meterReadings.set(meter,end);
        insert('energy',{meter,line:line(i),date:date(daysAgo),carrier:carrier?'گاز m³':'برق kWh',readingStart:start,readingEnd:end,tonnage:2.5+i*0.03,outageMinutes:i%4===0?30:0,notes:'قرائت مصنوعی آموزشی؛ قبض یا صرفه‌جویی واقعی نیست.'},'approved',daysAgo);
      }
    }
    for(let i=0;i<3;i++)insert('production',{batch:batch(i),line:line(i),product:part(i),date:date(1),shift:'شب',plannedMinutes:480,runMinutes:410,idealCycleSeconds:18,total:1100,good:1060,downtimeReason:'سناریوی آموزشی ثبت و بررسی'},['draft','submitted','rejected'][i]);
    for(let i=0;i<6;i++)insert('maintenance',{asset:`DEMO-A${i%3+1}`,title:['بازبینی لرزش آموزشی','تعویض سنگ آموزشی','کنترل مشعل آموزشی'][i%3],priority:['بحرانی','بالا','عادی'][i%3],due:date([3,1,-2,-5,2,-1][i]),symptom:'نمونه آموزشی: بررسی وضعیت و روان‌کاری',downtimeMinutes:15+i*5,resolution:i===4?'اقدام آموزشی ثبت و بررسی شد.':''},['draft','submitted','draft','submitted','approved','rejected'][i],i+1);
    for(let i=0;i<5;i++)insert('ncr',{batch:batch(i),title:'نمونه آموزشی: انحراف طول آزاد',severity:['جزئی','عمده','بحرانی'][i%3],containment:'قرنطینه آموزشی و بازبینی بچ',rootCause:i<2?'تنظیم ابزار نمونه':'',action:i<2?'بازتنظیم فیکسچر نمونه':'',owner:'کنترل کیفیت دمو',due:date([2,-2,-5,1,-1][i])},['draft','submitted','submitted','approved','draft'][i],i+1);
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
