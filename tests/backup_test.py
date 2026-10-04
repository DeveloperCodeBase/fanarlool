import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('fanar_backup', Path(__file__).resolve().parents[1] / 'ops/backup/fanarlool-backup.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='fanarlool-backup-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        (self.root / 'data').mkdir()
        (self.root / 'backups').mkdir()
        self.source = self.root / 'data/platform.sqlite'
        with sqlite3.connect(self.source) as db:
            db.executescript("CREATE TABLE users(id TEXT PRIMARY KEY); CREATE TABLE records(id TEXT PRIMARY KEY, creator TEXT REFERENCES users(id)); INSERT INTO users VALUES('owner'); INSERT INTO records VALUES('record','owner'); PRAGMA user_version=3;")
        self.original = self.source.read_bytes()

    def test_online_backup_and_isolated_recovery_preserve_source(self):
        target = module.backup(self.root)
        manifest = json.loads((target / 'manifest.json').read_text())
        self.assertEqual(manifest['schema'], 3)
        self.assertEqual(manifest['counts'], {'users': 1, 'records': 1})
        self.assertEqual((target / 'platform.sqlite').stat().st_mode & 0o777, 0o600)
        module.verify(self.root)
        recovered = json.loads((self.root / 'data/recovery-status.json').read_text())
        self.assertEqual(recovered['status'], 'PASS')
        self.assertFalse(recovered['liveDatabaseModified'])
        self.assertEqual(self.source.read_bytes(), self.original)
        self.assertFalse(any(p.name.startswith('fanarlool-recovery-') for p in (self.root / 'backups').iterdir()))

    def test_tampered_backup_is_rejected_without_touching_live_database(self):
        target = module.backup(self.root)
        with (target / 'platform.sqlite').open('ab') as stream:
            stream.write(b'tamper')
        with self.assertRaisesRegex(ValueError, 'hash mismatch'):
            module.verify(self.root)
        self.assertEqual(self.source.read_bytes(), self.original)

    def test_schema4_twin_history_survives_recovery(self):
        with sqlite3.connect(self.source) as db:
            db.executescript("CREATE TABLE twin_scenarios(id TEXT PRIMARY KEY, owner TEXT REFERENCES users(id)); CREATE TABLE twin_revisions(scenario_id TEXT REFERENCES twin_scenarios(id), version INTEGER); INSERT INTO twin_scenarios VALUES('scenario','owner'); INSERT INTO twin_revisions VALUES('scenario',1); INSERT INTO twin_revisions VALUES('scenario',2); PRAGMA user_version=4;")
        original = self.source.read_bytes()
        target = module.backup(self.root)
        manifest = json.loads((target / 'manifest.json').read_text())
        self.assertEqual(manifest['schema'], 4)
        self.assertEqual(manifest['counts']['twin_scenarios'], 1)
        self.assertEqual(manifest['counts']['twin_revisions'], 2)
        module.verify(self.root)
        recovered = json.loads((self.root / 'data/recovery-status.json').read_text())
        self.assertEqual(recovered['counts'], manifest['counts'])
        self.assertEqual(self.source.read_bytes(), original)
        with sqlite3.connect(target / 'platform.sqlite') as db:
            self.assertEqual(db.execute('SELECT version FROM twin_revisions ORDER BY version').fetchall(), [(1,), (2,)])

    def test_symlink_database_and_foreign_key_corruption_are_rejected(self):
        other = self.root / 'unrelated.sqlite'
        other.write_bytes(self.original)
        self.source.unlink()
        self.source.symlink_to(other)
        with self.assertRaises(ValueError):
            module.backup(self.root)
        self.assertEqual(other.read_bytes(), self.original)
        self.source.unlink()
        self.source.write_bytes(self.original)
        with sqlite3.connect(self.source) as db:
            db.execute("UPDATE records SET creator='missing'")
        with self.assertRaisesRegex(ValueError, 'foreign key'):
            module.backup(self.root)

if __name__ == '__main__':
    unittest.main()
