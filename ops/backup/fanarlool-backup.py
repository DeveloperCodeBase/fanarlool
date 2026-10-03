"""Online SQLite backup and isolated recovery drill. Never restores over live data."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
import time
import uuid

TABLES = ('users', 'sessions', 'records', 'audit', 'login_limits', 'user_profiles', 'operation_orders', 'operation_lots', 'operation_tasks', 'operation_movements')

def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            value.update(chunk)
    return value.hexdigest()

def inspect(path):
    with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True, timeout=15) as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('SQLite integrity check failed')
        if db.execute('PRAGMA foreign_key_check').fetchone():
            raise ValueError('SQLite foreign key check failed')
        names = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        return {'schema': db.execute('PRAGMA user_version').fetchone()[0],
                'counts': {table: db.execute('SELECT COUNT(*) FROM "' + table + '"').fetchone()[0] for table in TABLES if table in names}}

def write_json(path, value):
    temporary = path.with_name(path.name + '.next-' + uuid.uuid4().hex)
    with temporary.open('x', encoding='utf-8') as stream:
        os.chmod(temporary, 0o600)
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)

def backup(root):
    source = root / 'data/platform.sqlite'
    if source.is_symlink() or not source.is_file():
        raise ValueError('Expected dedicated regular database file')
    destination = root / 'backups/daily'
    if destination.is_symlink():
        raise ValueError('Backup directory must not be a symlink')
    destination.mkdir(mode=0o700, parents=True, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:12]
    pending = destination / ('.pending-' + stamp)
    pending.mkdir(mode=0o700)
    target = pending / 'platform.sqlite'
    started = time.monotonic()
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True, timeout=15) as src, sqlite3.connect(target, timeout=15) as dst:
        os.chmod(target, 0o600)
        def progress(status, remaining, total):
            if time.monotonic() - started > 120:
                raise TimeoutError('Backup exceeded 120 seconds')
        src.backup(dst, pages=128, progress=progress, sleep=0.05)
    facts = inspect(target)
    manifest = {'status': 'PASS', 'createdAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                'sha256': digest(target), 'bytes': target.stat().st_size, **facts,
                'durationSeconds': round(time.monotonic() - started, 3), 'offsite': False}
    write_json(pending / 'manifest.json', manifest)
    finished = destination / stamp
    pending.rename(finished)
    summary = {**manifest, 'backupId': stamp}
    write_json(root / 'data/backup-status.json', summary)
    print(json.dumps(summary))
    return finished

def verify(root):
    destination = root / 'backups/daily'
    if not destination.is_dir() or destination.is_symlink():
        raise ValueError('No daily backup available')
    choices = sorted(p for p in destination.iterdir() if not p.name.startswith('.') and p.is_dir() and not p.is_symlink())
    if not choices:
        raise ValueError('No completed backup available')
    selected = choices[-1]
    manifest_path, source = selected / 'manifest.json', selected / 'platform.sqlite'
    if source.is_symlink() or manifest_path.is_symlink():
        raise ValueError('Backup files must be regular files')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if digest(source) != manifest['sha256']:
        raise ValueError('Backup hash mismatch')
    # This context only removes the exact fresh temporary directory owned by this drill.
    with tempfile.TemporaryDirectory(prefix='fanarlool-recovery-', dir=root / 'backups') as temporary:
        restored = Path(temporary) / 'restored.sqlite'
        shutil.copyfile(source, restored)
        os.chmod(restored, 0o600)
        facts = inspect(restored)
        if facts['schema'] != manifest['schema'] or facts['counts'] != manifest['counts'] or digest(restored) != manifest['sha256']:
            raise ValueError('Recovered copy differs from the backup')
        result = {'status': 'PASS', 'verifiedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                  'backupId': selected.name, 'sha256': manifest['sha256'], **facts, 'liveDatabaseModified': False}
        write_json(root / 'data/recovery-status.json', result)
        print(json.dumps(result))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--mode', choices=('backup', 'verify'), required=True)
    args = parser.parse_args()
    supplied = Path(args.root)
    root = supplied.resolve(strict=True)
    if supplied.is_symlink() or root != Path('/var/www/fanarlool/shared'):
        raise ValueError('Only the dedicated FanarLool shared directory is allowed')
    if (root / 'data').is_symlink() or (root / 'backups').is_symlink():
        raise ValueError('Dedicated data and backup roots must not be symlinks')
    os.umask(0o077)
    with (root / 'backup.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            backup(root) if args.mode == 'backup' else verify(root)
        except Exception:
            write_json(root / ('data/backup-status.json' if args.mode == 'backup' else 'data/recovery-status.json'), {'status': 'FAIL', 'createdAt': dt.datetime.now(dt.timezone.utc).isoformat()})
            raise

if __name__ == '__main__':
    main()
