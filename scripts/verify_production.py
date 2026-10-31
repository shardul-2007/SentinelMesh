import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
from fastapi.testclient import TestClient
from app.main import app
from web3 import Web3

client = TestClient(app)

print("=== 1. VERIFYING ALLOW, BLOCK, REQUIRE_APPROVAL ===")
scenarios = [
    ("ALLOW Check: Public READ", {"agent_id": "agent-data-analyzer", "action_type": "READ", "resource": "public/whitepaper.pdf", "client_risk_level": "LOW"}),
    ("BLOCK Check: Restricted Secrets", {"agent_id": "agent-guest", "action_type": "READ", "resource": "restricted/vault.env", "client_risk_level": "HIGH"}),
    ("REQUIRE_APPROVAL Check: Database Mutation", {"agent_id": "agent-financial-bot", "action_type": "DELETE", "resource": "db://ledger/records", "client_risk_level": "HIGH"}),
]

for name, payload in scenarios:
    r = client.post("/api/actions/evaluate", json=payload)
    d = r.json()
    print(f"* {name}:")
    print(f"    Decision: {d.get('decision')}")
    print(f"    Policy: {d.get('policy_id')} (v{d.get('policy_version')})")
    print(f"    Reason: {d.get('reason')}")
    print(f"    Event ID: {d.get('event_id')}")
    print(f"    RFC-8785 SHA-256: {d.get('integrity_hash')}")

print("\n=== 2. VERIFYING APPROVAL WORKFLOW ISOLATION ===")
# Submit a REQUIRE_APPROVAL event
r_app = client.post("/api/actions/evaluate", json={
    "agent_id": "agent-financial-bot",
    "action_type": "DELETE",
    "resource": "db://ledger/records"
})
app_data = r_app.json()
evt_id = app_data["event_id"]
print(f"Generated Approval Event ID: {evt_id}")
print(f"Pre-approval Execution Status: {app_data.get('execution_mode')}")

# Verify approval submission works
app_submit = client.post(f"/api/approvals/{evt_id}/decision", json={
    "decision": "APPROVED",
    "approver_id": "chief-security-officer",
    "note": "Verified by CSO security review"
}, headers={"X-Admin-Key": "sentinel-admin-dev-key-phase1"})
print(f"Approval Decision Status: {app_submit.status_code}")
print(f"Approval Response: {app_submit.json()}")

print("\n=== 3. VERIFYING ON-CHAIN CONTRACT ON MST TESTNET ===")
w3 = Web3(Web3.HTTPProvider("https://testnetrpc.mstblockchain.com"))
contract_addr = Web3.to_checksum_address("0x0539fc70ee18fa936395c8dd6db623af6b43ceca")
code = w3.eth.get_code(contract_addr)
print(f"RPC Connected: {w3.is_connected()}")
print(f"Network Chain ID: {w3.eth.chain_id}")
print(f"Latest On-Chain Block: #{w3.eth.block_number}")
print(f"Target Contract Address: {contract_addr}")
print(f"Runtime Bytecode Length: {len(code)} bytes (Nonempty: {len(code) > 0})")

deploy_tx = "0x2623e2be8539fba8bb25d3e7ede4b70c53ccf54ee6beda30a2fa0b51988fdcc6"
receipt = w3.eth.get_transaction_receipt(deploy_tx)
print(f"Deployer Transaction Hash: {deploy_tx}")
print(f"Transaction Receipt Status: {hex(receipt.status)} (1 = Success)")
print(f"Deployment Block Number: #{receipt.blockNumber}")
print(f"Gas Consumed: {receipt.gasUsed}")
print(f"Created Contract Address: {receipt.contractAddress}")
