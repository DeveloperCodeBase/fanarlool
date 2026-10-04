import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { openDatabase } from './storage.mjs';
import { hashPassword, passwordValid } from './app.mjs';
const dataRoot=process.env.FANAR_DATA_ROOT;
if(!dataRoot) throw new Error('FANAR_DATA_ROOT required');
const db=openDatabase(`${dataRoot}/platform.sqlite`);
const input=JSON.parse(readFileSync(0,'utf8'));
if(!/^[a-z0-9._-]{3,64}$/.test(input.username || '') || (process.argv[2]!=='recover' && (typeof input.name!=='string' || input.name.trim().length<2 || input.name.length>100)) || !passwordValid(input.password)) throw new Error('Valid username/name/password required');
if(process.argv[2]==='recover'){
  const target=db.prepare("SELECT id FROM users WHERE username=? AND role='admin'").get(input.username);
  if(!target)throw new Error('Named administrator does not exist; recovery cannot create a new account');
  const password=await hashPassword(input.password);
  db.exec('BEGIN IMMEDIATE');
  try{
    db.prepare('UPDATE users SET password=?,active=1,must_change=1 WHERE id=?').run(password,target.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);
    db.prepare('INSERT INTO audit(actor,action,target,details,created_at) VALUES(?,?,?,?,?)').run(target.id,'auth.owner_recovery',target.id,JSON.stringify({source:'secure_vps_owner_console'}),new Date().toISOString());
    db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  console.log('Named administrator recovered; sessions revoked; password change required');db.close();
}else{
if(db.prepare("SELECT id FROM users WHERE role='admin' AND active=1").get()) throw new Error('Initial admin already exists; use authenticated user management');
db.prepare('INSERT INTO users(id,username,name,role,password,created_at) VALUES(?,?,?,?,?,?)').run(randomUUID(),input.username,input.name,'admin',await hashPassword(input.password),new Date().toISOString());
console.log('Initial administrator created; password change required'); db.close();
}
