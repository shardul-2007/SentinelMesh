import sqlite3

conn = sqlite3.connect('sentinelmesh.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print('Tables in sentinelmesh.db:', tables)

for t in tables:
    count = c.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"  {t}: {count} records")

# Inspect integrity records
if 'integrity_records' in tables:
    records = c.execute("SELECT event_id, event_hash, anchoring_status, transaction_hash, block_number FROM integrity_records LIMIT 5").fetchall()
    print("\nSample Integrity Records:")
    for r in records:
        print(" ", r)

# Inspect audit events
if 'audit_events' in tables:
    evts = c.execute("SELECT id, action_type, resource, policy_decision, policy_id FROM audit_events LIMIT 5").fetchall()
    print("\nSample Audit Events:")
    for e in evts:
        print(" ", e)
