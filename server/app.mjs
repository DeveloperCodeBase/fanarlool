import { createServer } from 'node:http';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { roles, schemas, can, validateRecord, productionKpis } from './domain.mjs';
const derive = promisify(scrypt);
const digest = s => createHash('sha256').update(s).digest('hex');
const validId = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, { N:32768, r:8, p:1, maxmem:64*1024*1024 });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}
async function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const key = await derive(password, salt, 64, { N:32768, r:8, p:1, maxmem:64*1024*1024 });
  return hash?.length === 128 && timingSafeEqual(Buffer.from(key),Buffer.from(hash,'hex'));
}
export function passwordValid(s) { return typeof s === 'string' && s.length >= 12 && s.length <= 128; }
export function createApp({ db, origin = 'https://fanarlool.vistapower.ir', secure = true, sha = 'development', demo = false, prefix = '/api' }) {
  const fake = randomBytes(16).toString('hex') + ':' + randomBytes(64).toString('hex');
  const q = sql => db.prepare(sql);
  const atomic = operation => {
    db.exec('BEGIN IMMEDIATE');
    try { const result=operation(); db.exec('COMMIT'); return result; }
    catch(e) { db.exec('ROLLBACK'); throw e; }
  };
  const audit = (actor,action,target,details={}) => q('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(actor,action,target,JSON.stringify(details),new Date().toISOString());
  const send = (res,status,value,headers={}) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}); res.end(JSON.stringify(value)); };
  const error = (code,message) => Object.assign(new Error(message),{code});
  const cookieName = (secure ? '__Host-' : '') + (demo ? 'fanar_demo_session' : 'fanar_session');
  const cookie = (token,age=28800) => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const userView = u => ({id:u.id, username:u.username, name:u.name, role:u.role, roleLabel:roles[u.role], mustChange:!!u.must_change});
  async function body(req) {
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw error(415,'فرمت درخواست باید JSON باشد');
    let text='',size=0;
    for await (const chunk of req) { size+=chunk.length; if(size>32768) throw error(413,'درخواست بزرگ است'); text+=chunk; }
    try { const value=JSON.parse(text); if (!value || typeof value!=='object' || Array.isArray(value)) throw 0; return value; } catch { throw error(400,'درخواست معتبر نیست'); }
  }
  const startedAt=new Date().toISOString(),requests=[];
  return createServer(async (req,res) => {
    const requestStart=performance.now();let requestActor=null;
    res.once('finish',()=>{requests.push({at:new Date().toISOString(),method:req.method,path:new URL(req.url,origin).pathname,status:res.statusCode,durationMs:Math.round(performance.now()-requestStart),actor:requestActor});if(requests.length>250)requests.shift();});
    try {
      const originalPath = new URL(req.url,origin).pathname;
      if(!originalPath.startsWith(prefix+'/')) throw error(404,'مسیر پیدا نشد');
      const path='/api'+originalPath.slice(prefix.length), method=req.method;
      if (path === '/api/health' && method==='GET') return send(res,200,{status:'ok',sha,schema:2,demo});
      if (['POST','PATCH','DELETE'].includes(method) && req.headers.origin !== origin) throw error(403,'مبدأ درخواست مجاز نیست');
      if (path === '/api/auth/login' && method==='POST') {
        const b=await body(req);
        if (typeof b.username!=='string' || b.username.length>100 || typeof b.password!=='string' || b.password.length>128) throw error(400,'اطلاعات ورود معتبر نیست');
        const username=b.username.toLowerCase().trim(), ip=String(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unix').split(',')[0].trim();
        const keys=[digest(`user:${username}`),digest(`ip:${ip}`)], now=Date.now();
        if (keys.some(k=>q('SELECT * FROM login_limits WHERE key=?').get(k)?.until_ms>now)) throw error(429,'ورود موقتاً محدود شده؛ چند دقیقه بعد تلاش کنید');
        const u=q('SELECT * FROM users WHERE username=? AND active=1').get(username);
        const valid=await checkPassword(b.password,u?.password || fake);
        if (!valid || !u) {
          for(const key of keys) { const previous=q('SELECT * FROM login_limits WHERE key=?').get(key); const failures=previous && previous.until_ms>now-900000 ? previous.failures+1 : 1; q('INSERT OR REPLACE INTO login_limits(key,failures,until_ms) VALUES(?,?,?)').run(key,failures,failures>=8?now+900000:now); }
          audit(null,'auth.failed',null); throw error(401,'شناسه یا رمز عبور صحیح نیست');
        }
        const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
        q('DELETE FROM sessions WHERE expires<? OR last_seen<?').run(now,now-1800000);
        q('INSERT INTO sessions VALUES(?,?,?,?,?)').run(digest(token),u.id,csrf,now+28800000,now);
        if(demo)q('DELETE FROM sessions WHERE token NOT IN (SELECT token FROM sessions ORDER BY last_seen DESC LIMIT 32)').run();
        q('DELETE FROM login_limits WHERE key=?').run(keys[0]);
        audit(u.id,'auth.login',u.id); return send(res,200,{user:userView(u),csrf},{'Set-Cookie':cookie(token)});
      }
      const raw=(req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
      const session=raw && /^[a-f0-9]{64}$/.test(raw) ? q('SELECT s.*,u.username,u.name,u.role,u.active,u.must_change FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=?').get(digest(raw)) : null;
      if (!session || !session.active || session.expires<Date.now() || session.last_seen<Date.now()-1800000) throw error(401,'برای ادامه وارد سامانه شوید');
      const u={...session,id:session.user_id};
      requestActor=u.id;
      const mutate = operation => atomic(() => {
        const fresh=q('SELECT s.*,u.active,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=?').get(session.token);
        if(!fresh || !fresh.active || fresh.role!==u.role || fresh.expires<Date.now() || fresh.last_seen<Date.now()-1800000) throw error(401,'نشست تغییر کرده؛ دوباره وارد شوید');
        if(demo)q('DELETE FROM audit WHERE id NOT IN (SELECT id FROM audit ORDER BY id DESC LIMIT 1000)').run();
        return operation();
      });
      q('UPDATE sessions SET last_seen=? WHERE token=?').run(Date.now(),session.token);
      if (['POST','PATCH','DELETE'].includes(method) && req.headers['x-csrf-token'] !== session.csrf) throw error(403,'درخواست تأیید امنیتی ندارد');
      if (path==='/api/auth/me' && method==='GET') return send(res,200,{user:userView(u),csrf:session.csrf});
      if (path==='/api/auth/logout' && method==='POST') { mutate(()=>{q('DELETE FROM sessions WHERE token=?').run(session.token); audit(u.id,'auth.logout',u.id);}); return send(res,200,{ok:true},{'Set-Cookie':cookie('',0)}); }
      if (path==='/api/auth/password' && method==='POST') {
        if(demo) throw error(403,'رمزهای دمو ثابت‌اند؛ تغییر رمز در حساب واقعی انجام می‌شود');
        const b=await body(req);
        if (!passwordValid(b.password) || typeof b.current!=='string' || b.current.length>128) throw error(400,'رمز باید ۱۲ تا ۱۲۸ نویسه باشد');
        if (!await checkPassword(b.current,q('SELECT password FROM users WHERE id=?').get(u.id).password)) throw error(403,'رمز فعلی صحیح نیست');
        const hashed=await hashPassword(b.password);
        mutate(()=>{q('UPDATE users SET password=?,must_change=0 WHERE id=?').run(hashed,u.id);
        q('DELETE FROM sessions WHERE user_id=?').run(u.id); audit(u.id,'auth.password',u.id);}); return send(res,200,{ok:true},{'Set-Cookie':cookie('',0)});
      }
      if (u.must_change) throw error(403,'ابتدا رمز موقت را تغییر دهید');
      if(path==='/api/profile') {
        const view=()=>{const p=q('SELECT * FROM user_profiles WHERE user_id=?').get(u.id);return {user:userView(q('SELECT * FROM users WHERE id=?').get(u.id)),department:p?.department||'',jobTitle:p?.job_title||'',email:p?.email||'',phone:p?.phone||'',preferences:{density:'comfortable',startPage:'overview',notifications:true,...JSON.parse(p?.preferences||'{}')}};};
        if(method==='GET')return send(res,200,view());
        if(method==='PATCH') {
          const b=await body(req);
          const bounded=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
          if(!bounded(b.name,2,100)||!bounded(b.department,0,100)||!bounded(b.jobTitle,0,100)||!bounded(b.email,0,120)||!bounded(b.phone,0,30)|| (b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)))throw error(400,'اطلاعات پروفایل معتبر نیست');
          const prefs=b.preferences;
          if(!prefs || !['comfortable','compact'].includes(prefs.density)||typeof prefs.notifications!=='boolean'|| !(prefs.startPage==='overview'||can(u.role,prefs.startPage)))throw error(400,'تنظیمات شخصی معتبر نیست');
          const preferences=JSON.stringify({density:prefs.density,startPage:prefs.startPage,notifications:prefs.notifications});
          mutate(()=>{q('UPDATE users SET name=? WHERE id=?').run(b.name.trim(),u.id);q('INSERT INTO user_profiles(user_id,department,job_title,email,phone,preferences) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET department=excluded.department,job_title=excluded.job_title,email=excluded.email,phone=excluded.phone,preferences=excluded.preferences').run(u.id,b.department.trim(),b.jobTitle.trim(),b.email.trim(),b.phone.trim(),preferences);audit(u.id,'profile.updated',u.id);});
          return send(res,200,view());
        }
      }
      if(path==='/api/activity' && method==='GET')return send(res,200,{events:q('SELECT a.*,u.name AS actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE a.actor=? ORDER BY a.id DESC LIMIT 200').all(u.id)});
      if(path==='/api/system' && method==='GET') {
        if(u.role!=='admin')throw error(403,'مانیتورینگ سامانه فقط برای مدیر سامانه است');
        const total=table=>Number(q(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
        return send(res,200,{sha,demo,startedAt,uptimeSeconds:Math.round(process.uptime()),memoryMb:Math.round(process.memoryUsage().rss/1048576),database:q('PRAGMA quick_check').get().quick_check,transport:'Unix socket',counts:{users:total('users'),activeUsers:Number(q('SELECT COUNT(*) AS n FROM users WHERE active=1').get().n),records:total('records'),audit:total('audit'),sessions:Number(q('SELECT COUNT(*) AS n FROM sessions WHERE expires>? AND last_seen>?').get(Date.now(),Date.now()-1800000).n)},statuses:q('SELECT status,COUNT(*) AS count FROM records GROUP BY status').all(),requests:[...requests].reverse().slice(0,100)});
      }
      if (path==='/api/workspace' && method==='GET') {
        const records=q('SELECT r.*,u.name AS creator_name FROM records r JOIN users u ON u.id=r.creator ORDER BY r.updated_at DESC LIMIT 2000').all().filter(r=>can(u.role,r.kind)).map(r=>({...r,data:JSON.parse(r.data)}));
        const catalog=Object.entries(schemas).filter(([k])=>can(u.role,k)).map(([kind,s])=>({kind,title:s.title,description:s.description,fields:s.fields,write:can(u.role,kind,'write'),approve:can(u.role,kind,'approve')}));
        return send(res,200,{records,catalog,kpis:productionKpis(records),roles,sha,mode:demo?'demo':'manual',limited:records.length>=2000});
      }
      const historyMatch=path.match(/^\/api\/records\/([^/]+)\/history$/);
      if(historyMatch && method==='GET') {
        const recordId=historyMatch[1];
        if(!validId(recordId))throw error(400,'شناسه رکورد معتبر نیست');
        const record=q('SELECT id,kind FROM records WHERE id=?').get(recordId);
        if(!record || !can(u.role,record.kind))throw error(404,'رکورد پیدا نشد');
        // Whitelist event fields. Raw audit details may contain unrelated private data.
        const safeDetails=text=>{
          let value;try{value=JSON.parse(text);}catch{value={};}
          const details={kind:record.kind};
          if(validId(value?.sourceId))details.sourceId=value.sourceId;
          if(typeof value?.note==='string')details.note=value.note.slice(0,1000);
          for(const key of ['from','to'])if(['draft','submitted','approved','rejected'].includes(value?.[key]))details[key]=value[key];
          // Previous events used status/previous rather than from/to.
          if(!details.from&&['draft','submitted','approved','rejected'].includes(value?.previous))details.from=value.previous;
          if(!details.to&&['draft','submitted','approved','rejected'].includes(value?.status))details.to=value.status;
          if(Number.isSafeInteger(value?.version)&&value.version>0)details.version=value.version;
          return details;
        };
        const events=q("SELECT a.id,a.actor,a.action,a.details,a.created_at,u.name AS actor_name,u.role AS actor_role FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE a.target=? AND a.action IN ('record.created','record.updated','demo.record.seeded') ORDER BY a.id DESC LIMIT 200").all(recordId).reverse().map(a=>({id:a.id,action:a.action,actorId:a.actor,actorName:a.actor_name||null,actorRole:a.actor_role||null,createdAt:a.created_at,details:safeDetails(a.details)}));
        const created=q("SELECT details FROM audit WHERE target=? AND action='record.created' ORDER BY id ASC LIMIT 1").get(recordId);
        return send(res,200,{recordId,sourceId:created?safeDetails(created.details).sourceId||null:null,events});
      }
      if (path==='/api/records' && method==='POST') {
        const b=await body(req); if(!can(u.role,b.kind,'write')) throw error(403,'اجازه ثبت در این بخش ندارید');
        if(demo&&q('SELECT COUNT(*) AS n FROM records').get().n>=200)throw error(429,'سقف ۲۰۰ رکورد این فضای آموزشی تکمیل شده است');
        if(b.sourceId!==undefined&&!validId(b.sourceId))throw error(400,'شناسه رکورد مبنا معتبر نیست');
        const checkSource=()=>{
          if(b.sourceId===undefined)return;
          const source=q('SELECT kind,status FROM records WHERE id=?').get(b.sourceId);
          if(!source||!can(u.role,source.kind))throw error(404,'رکورد مبنا پیدا نشد');
          if(source.kind!==b.kind)throw error(400,'نوع رکورد اصلاحی با مبنا یکسان نیست');
          if(source.status!=='rejected')throw error(409,'فقط رکورد ردشده مبنای پیش‌نویس اصلاحی است');
        };
        checkSource();
        let data; try { data=validateRecord(b.kind,b.data); } catch(e) { throw error(400,e.message); }
        const id=randomUUID(),now=new Date().toISOString();
        mutate(()=>{checkSource();q('INSERT INTO records(id,kind,data,creator,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id,b.kind,JSON.stringify(data),u.id,now,now);
        audit(u.id,'record.created',id,{kind:b.kind,from:null,to:'draft',version:1,...(b.sourceId?{sourceId:b.sourceId}:{})});}); return send(res,201,{id});
      }
      const match=path.match(/^\/api\/records\/([a-f0-9-]{36})$/);
      if(match && method==='PATCH') {
        const r=q('SELECT * FROM records WHERE id=?').get(match[1]); if (!r || !can(u.role,r.kind)) throw error(404,'رکورد پیدا نشد');
        const b=await body(req); if(b.version!==r.version) throw error(409,'رکورد هم‌زمان تغییر کرده؛ صفحه را به‌روز کنید');
        if(b.note!==undefined&&(typeof b.note!=='string'||b.note.length>1000))throw error(400,'شرح تصمیم حداکثر ۱۰۰۰ نویسه است');
        const note=typeof b.note==='string'?b.note.trim():'';
        let data=JSON.parse(r.data),status=r.status,approver=r.approver;
        if(b.data!==undefined) {
          if(!can(u.role,r.kind,'write') || r.status!=='draft' || (r.creator!==u.id && u.role!=='admin')) throw error(403,'فقط پیش‌نویس خودتان قابل ویرایش است');
          try { data=validateRecord(r.kind,b.data); } catch(e) { throw error(400,e.message); }
        }
        if(b.status!==undefined && b.status!==r.status) {
          if(b.status==='submitted' && r.status==='draft' && r.creator===u.id && can(u.role,r.kind,'write')) status='submitted';
          else if(['approved','rejected'].includes(b.status) && r.status==='submitted' && can(u.role,r.kind,'approve') && r.creator!==u.id) {
            if(b.status==='rejected'&&note.length<10)throw error(400,'دلیل رد باید ۱۰ تا ۱۰۰۰ نویسه باشد');
            status=b.status; approver=u.id;
          }
          else throw error(403,'گذار وضعیت یا تأیید توسط همان ثبت‌کننده مجاز نیست');
        }
        mutate(()=>{const result=q('UPDATE records SET data=?,status=?,approver=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(JSON.stringify(data),status,approver,new Date().toISOString(),r.id,r.version);
        if(result.changes!==1) throw error(409,'رکورد هم‌زمان تغییر کرده؛ صفحه را به‌روز کنید');
        audit(u.id,'record.updated',r.id,{kind:r.kind,status,previous:r.status,from:r.status,to:status,version:r.version+1,...(note?{note}:{})});}); return send(res,200,{ok:true});
      }
      if(path==='/api/users') {
        if(u.role!=='admin') throw error(403,'مدیریت کاربران فقط برای مدیر سامانه است');
        if(method==='GET') return send(res,200,{users:q('SELECT id,username,name,role,active,must_change,created_at FROM users ORDER BY name').all()});
        if(method==='POST') {
          if(demo)throw error(403,'ایجاد حساب واقعی در دمو فعال نیست؛ حساب‌های هر هشت نقش آماده‌اند');
          const b=await body(req);
          if(!/^[a-z0-9._-]{3,64}$/.test(b.username || '') || typeof b.name!=='string' || b.name.trim().length<2 || b.name.length>100 || !roles[b.role] || !passwordValid(b.password)) throw error(400,'مشخصات کاربر یا رمز موقت معتبر نیست');
          if(q('SELECT id FROM users WHERE username=?').get(b.username)) throw error(409,'شناسه تکراری است');
          const id=randomUUID(), hashed=await hashPassword(b.password);
          mutate(()=>{if(q('SELECT id FROM users WHERE username=?').get(b.username)) throw error(409,'شناسه تکراری است');
          q('INSERT INTO users(id,username,name,role,password,created_at) VALUES(?,?,?,?,?,?)').run(id,b.username,b.name.trim(),b.role,hashed,new Date().toISOString());
          audit(u.id,'user.created',id,{role:b.role});}); return send(res,201,{id});
        }
      }
      const userMatch=path.match(/^\/api\/users\/([a-f0-9-]{36})$/);
      if(userMatch && method==='PATCH') {
        if(u.role!=='admin') throw error(403,'اجازه مدیریت کاربران ندارید');
        if(demo)throw error(403,'هویت و نقش حساب‌های آموزشی ثابت است');
        if(userMatch[1]===u.id) throw error(400,'تغییر سطح یا غیرفعال کردن خودتان مجاز نیست');
        const target=q('SELECT * FROM users WHERE id=?').get(userMatch[1]); if(!target) throw error(404,'کاربر پیدا نشد');
        const b=await body(req); if(!roles[b.role] || typeof b.active!=='boolean') throw error(400,'نقش یا وضعیت معتبر نیست');
        mutate(()=>{q('UPDATE users SET role=?,active=? WHERE id=?').run(b.role,Number(b.active),target.id);
        q('DELETE FROM sessions WHERE user_id=?').run(target.id); audit(u.id,'user.updated',target.id,{role:b.role,active:b.active});}); return send(res,200,{ok:true});
      }
      if(path==='/api/audit' && method==='GET') {
        if(!['admin','executive','auditor'].includes(u.role)) throw error(403,'اجازه مشاهده رویدادها ندارید');
        return send(res,200,{events:q('SELECT a.*,u.name AS actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor ORDER BY a.id DESC LIMIT 300').all()});
      }
      throw error(404,'مسیر پیدا نشد');
    } catch(e) {
      if(!e.code || typeof e.code!=='number') console.error('API request failed',e.name);
      if(!res.headersSent) send(res,typeof e.code==='number'?e.code:500,{error:typeof e.code==='number'?e.message:'خطای داخلی؛ دوباره تلاش کنید'});
    }
  });
}
