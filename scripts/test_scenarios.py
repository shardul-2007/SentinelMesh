import sys
import os

backend_dir = os.path.join(os.getcwd(), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

scenarios = [
    ("Scenario 1: Public document READ", {"agent_id": "agent-data-analyzer", "action_type": "READ", "resource": "public/whitepaper.pdf"}, "ALLOW"),
    ("Scenario 2: Restricted secrets READ", {"agent_id": "agent-guest", "action_type": "READ", "resource": "restricted/vault.env"}, "BLOCK"),
    ("Scenario 3: Analytics UPDATE", {"agent_id": "agent-data-analyzer", "action_type": "UPDATE", "resource": "db://analytics/metrics"}, "ALLOW"),
    ("Scenario 4: Ledger DELETE", {"agent_id": "agent-financial-bot", "action_type": "DELETE", "resource": "db://ledger/records"}, "REQUIRE_APPROVAL"),
    ("Scenario 5: Customer EXPORT", {"agent_id": "agent-data-analyzer", "action_type": "EXPORT", "resource": "db://users/customers.csv"}, "REQUIRE_APPROVAL"),
    ("Scenario 6: Host ADMIN_EXEC", {"agent_id": "agent-guest", "action_type": "ADMIN_EXEC", "resource": "sys://sh"}, "BLOCK"),
]

print("=== TESTING ALL 6 REQUIRED SCENARIOS AGAINST FASTAPI BACKEND ===")
all_passed = True
for name, payload, expected in scenarios:
    res = client.post("/api/actions/evaluate", json=payload)
    data = res.json()
    decision = data.get("decision")
    passed = (decision == expected)
    all_passed = all_passed and passed
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] {name} -> Expected: {expected}, Got: {decision} (Policy: {data.get('policy_id')}, Risk: {data.get('derived_risk_level')})")
    print(f"        Agent: {payload['agent_id']}")
    print(f"        Event ID: {data.get('event_id')}")
    print(f"        RFC-8785 Canonical SHA-256: {data.get('integrity_hash')}")

if all_passed:
    print("\n>>> ALL 6 SCENARIOS SUCCEEDED ON BACKEND! <<<")
else:
    print("\n>>> SOME SCENARIOS FAILED! <<<")
