import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive:true, mode:0o700 });
  const db = new DatabaseSync(path, { timeout:5000 });
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, must_change INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL, last_seen INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', creator TEXT NOT NULL REFERENCES users(id), approver TEXT REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT, action TEXT NOT NULL, target TEXT, details TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS login_limits(key TEXT PRIMARY KEY, failures INTEGER NOT NULL, until_ms INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS user_profiles(user_id TEXT PRIMARY KEY REFERENCES users(id), department TEXT NOT NULL DEFAULT '', job_title TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', preferences TEXT NOT NULL DEFAULT '{}');
    CREATE INDEX IF NOT EXISTS records_kind ON records(kind,created_at);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS operation_orders(
      id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,customer TEXT NOT NULL,product TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),start_date TEXT NOT NULL,due_date TEXT NOT NULL,priority TEXT NOT NULL,
      recipe_id TEXT NOT NULL REFERENCES records(id),asset_id TEXT NOT NULL REFERENCES records(id),creator TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'draft',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS operation_lots(
      id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES operation_orders(id),code TEXT NOT NULL UNIQUE,material_lot TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>0),good INTEGER,scrap INTEGER,inspection_id TEXT REFERENCES records(id),
      creator TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'queued',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS operation_tasks(
      id TEXT PRIMARY KEY,record_id TEXT NOT NULL REFERENCES records(id),owner_id TEXT NOT NULL REFERENCES users(id),due_date TEXT NOT NULL,kind TEXT NOT NULL,
      creator TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'open',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS operation_movements(
      id TEXT PRIMARY KEY,code TEXT NOT NULL UNIQUE,material TEXT NOT NULL,lot TEXT NOT NULL,unit TEXT NOT NULL,direction TEXT NOT NULL,quantity REAL NOT NULL CHECK(quantity>0),production_lot_id TEXT REFERENCES operation_lots(id),note TEXT NOT NULL DEFAULT '',
      creator TEXT NOT NULL REFERENCES users(id),version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS operation_lots_order ON operation_lots(order_id,status);
    CREATE UNIQUE INDEX IF NOT EXISTS operation_tasks_active ON operation_tasks(record_id) WHERE status<>'closed';
    CREATE INDEX IF NOT EXISTS operation_stock_key ON operation_movements(material,lot,unit);
    CREATE TABLE IF NOT EXISTS twin_scenarios(id TEXT PRIMARY KEY, title TEXT NOT NULL, asset_id TEXT NOT NULL REFERENCES records(id), recipe_id TEXT NOT NULL REFERENCES records(id), owner_id TEXT NOT NULL REFERENCES users(id), creator TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS twin_revisions(scenario_id TEXT NOT NULL REFERENCES twin_scenarios(id), version INTEGER NOT NULL, editor TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(scenario_id,version));
    CREATE INDEX IF NOT EXISTS twin_scenarios_updated ON twin_scenarios(updated_at,id);`);
  const profileColumns=new Set(db.prepare('PRAGMA table_info(user_profiles)').all().map(c=>c.name));
  for(const [name,definition] of Object.entries({shift:"TEXT NOT NULL DEFAULT 'unassigned'",location:"TEXT NOT NULL DEFAULT ''",extension:"TEXT NOT NULL DEFAULT ''",bio:"TEXT NOT NULL DEFAULT ''",version:'INTEGER NOT NULL DEFAULT 0',updated_at:"TEXT NOT NULL DEFAULT ''"}))if(!profileColumns.has(name))db.exec(`ALTER TABLE user_profiles ADD COLUMN ${name} ${definition}`);
  if(Number(db.prepare('PRAGMA user_version').get().user_version)<4)db.exec('PRAGMA user_version=4');
  if (path !== ':memory:') chmodSync(path, 0o600);
  return db;
}
