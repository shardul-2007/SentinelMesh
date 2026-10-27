import json
import os
from typing import Dict, Any, Optional, Tuple
from app.config import settings

# Default contract ABI if artifact file is not yet generated
DEFAULT_CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "eventId", "type": "string"},
            {"internalType": "bytes32", "name": "existingHash", "type": "bytes32"}
        ],
        "name": "AlreadyAnchored",
        "type": "error"
    },
    {
        "inputs": [{"internalType": "string", "name": "eventId", "type": "string"}],
        "name": "AnchorNotFound",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "EmptyEventHash",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "EmptyEventId",
        "type": "error"
    },
    {
        "inputs": [{"internalType": "address", "name": "caller", "type": "address"}],
        "name": "UnauthorizedCaller",
        "type": "error"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "string", "name": "eventId", "type": "string"},
            {"indexed": True, "internalType": "bytes32", "name": "eventHash", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "submitter", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"indexed": False, "internalType": "uint256", "name": "blockNumber", "type": "uint256"}
        ],
        "name": "EventAnchored",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "eventId", "type": "string"},
            {"internalType": "bytes32", "name": "eventHash", "type": "bytes32"}
        ],
        "name": "anchorEvent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string[]", "name": "eventIds", "type": "string[]"},
            {"internalType": "bytes32[]", "name": "eventHashes", "type": "bytes32[]"}
        ],
        "name": "anchorEventBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "eventId", "type": "string"}],
        "name": "getAnchor",
        "outputs": [
            {"internalType": "bytes32", "name": "eventHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
            {"internalType": "address", "name": "submitter", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "eventId", "type": "string"},
            {"internalType": "bytes32", "name": "expectedHash", "type": "bytes32"}
        ],
        "name": "verifyAnchor",
        "outputs": [
            {"internalType": "bool", "name": "matches", "type": "bool"},
            {"internalType": "bool", "name": "exists", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "authorizedAnchorers",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]


class BlockchainService:
    """
    Service interfacing with EVM smart contract for audit hash anchoring and on-chain verification.
    """

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        chain_id: Optional[int] = None,
        contract_address: Optional[str] = None,
        signer_key: Optional[str] = None
    ):
        self.rpc_url = (rpc_url or settings.BLOCKCHAIN_RPC_URL or "").strip()
        self.chain_id = chain_id or settings.BLOCKCHAIN_CHAIN_ID or 31337
        self.contract_address = (contract_address or settings.BLOCKCHAIN_CONTRACT_ADDRESS or "").strip()
        self.signer_key = (signer_key or settings.BLOCKCHAIN_SIGNER_KEY or "").strip()
        self.network_name = settings.BLOCKCHAIN_NETWORK_NAME

        self._w3 = None
        self._contract = None
        self._abi = self._load_contract_abi()

    def _load_contract_abi(self) -> list:
        # Check deployment artifact
        candidates = [
            os.path.join(os.path.dirname(__file__), "SentinelMeshAuditAnchor.json"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "contracts", "artifacts", "contracts", "SentinelMeshAuditAnchor.sol", "SentinelMeshAuditAnchor.json"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "contracts", "deployment.json")
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    with open(c, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, dict) and "abi" in data:
                            return data["abi"]
                        if isinstance(data, dict) and "address" in data and not self.contract_address:
                            self.contract_address = data["address"]
                except Exception:
                    pass
        return DEFAULT_CONTRACT_ABI

    def get_web3(self):
        """Lazily initialize web3 client."""
        if self._w3 is not None:
            return self._w3

        try:
            from web3 import Web3
            if not self.rpc_url:
                return None
            w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 1.0}))
            self._w3 = w3
            return self._w3
        except ImportError:
            return None

    def get_contract(self):
        w3 = self.get_web3()
        if not w3 or not self.contract_address:
            return None

        if self._contract is not None:
            return self._contract

        try:
            from web3 import Web3
            checksum_addr = Web3.to_checksum_address(self.contract_address)
            self._contract = w3.eth.contract(address=checksum_addr, abi=self._abi)
            return self._contract
        except Exception:
            return None

    def _probe_socket(self) -> bool:
        """Fast non-blocking probe to avoid Web3 retry backoff delays if node is offline."""
        if not self.rpc_url:
            return False
        try:
            from urllib.parse import urlparse
            import socket
            parsed = urlparse(self.rpc_url)
            host = parsed.hostname or "127.0.0.1"
            port = parsed.port or (443 if parsed.scheme == "https" else 80)
            with socket.create_connection((host, port), timeout=0.08):
                return True
        except Exception:
            return False

    def is_connected(self) -> bool:
        if not self._probe_socket():
            return False
        w3 = self.get_web3()
        if not w3:
            return False
        try:
            return w3.is_connected()
        except Exception:
            return False

    def get_status(self) -> Dict[str, Any]:
        """
        Return the current blockchain connectivity and configuration status.
        Distinguishes connected local network, testnet, or unconfigured state.
        """
        connected = self.is_connected()
        latest_block = None
        detected_chain_id = None
        signer_address = None

        if connected:
            w3 = self.get_web3()
            if w3:
                try:
                    latest_block = w3.eth.block_number
                    detected_chain_id = w3.eth.chain_id
                except Exception:
                    connected = False

        if self.signer_key:
            try:
                from eth_account import Account
                acct = Account.from_key(self.signer_key)
                signer_address = acct.address
            except Exception:
                pass

        has_contract = bool(self.contract_address and len(self.contract_address) == 42)

        if not self.rpc_url:
            mode = "UNCONFIGURED"
            status_desc = "Blockchain RPC URL is not configured. Running in local cryptographic verification mode."
        elif not connected:
            mode = "DISCONNECTED"
            status_desc = f"Unable to reach RPC endpoint at {self.rpc_url}."
        elif not has_contract:
            mode = "CONNECTED_NO_CONTRACT"
            status_desc = f"Connected to network (Chain ID {detected_chain_id}), but contract address is not set or deployed."
        else:
            mode = "READY"
            status_desc = f"Operational. Connected to {self.network_name} (Chain ID {detected_chain_id}) at contract {self.contract_address}."

        return {
            "mode": mode,
            "connected": connected,
            "rpc_url": self.rpc_url,
            "configured_chain_id": self.chain_id,
            "detected_chain_id": detected_chain_id,
            "latest_block": latest_block,
            "contract_address": self.contract_address,
            "has_contract": has_contract,
            "signer_address": signer_address,
            "network_name": self.network_name,
            "description": status_desc
        }

    def verify_onchain(self, event_id: str, expected_hash_hex: str) -> Dict[str, Any]:
        """
        Public on-chain verification call against the smart contract.
        Calls verifyAnchor(eventId, expectedHash).
        """
        contract = self.get_contract()
        if not contract:
            return {
                "available": False,
                "error": "Blockchain contract is not connected or deployed."
            }

        try:
            from web3 import Web3
            # Ensure expected_hash is 32-byte hex bytes
            if expected_hash_hex.startswith("0x"):
                hash_bytes = bytes.fromhex(expected_hash_hex[2:])
            else:
                hash_bytes = bytes.fromhex(expected_hash_hex)

            matches, exists = contract.functions.verifyAnchor(event_id, hash_bytes).call()
            
            anchor_details = None
            if exists:
                raw_anchor = contract.functions.getAnchor(event_id).call()
                # getAnchor returns (eventHash, timestamp, blockNumber, submitter)
                onchain_hash_hex = f"0x{raw_anchor[0].hex()}"
                anchor_details = {
                    "onchain_hash": onchain_hash_hex,
                    "timestamp": raw_anchor[1],
                    "block_number": raw_anchor[2],
                    "submitter": raw_anchor[3]
                }

            return {
                "available": True,
                "exists": exists,
                "matches": matches,
                "anchor_details": anchor_details
            }
        except Exception as e:
            return {
                "available": False,
                "error": f"On-chain query failed: {str(e)}"
            }

    def anchor_event_hash(self, event_id: str, event_hash_hex: str) -> Dict[str, Any]:
        """
        Submit anchorEvent(eventId, eventHash) transaction to the smart contract,
        sign with authorized signer key, wait for receipt, and validate outcome.
        """
        w3 = self.get_web3()
        if not w3 or not w3.is_connected():
            raise ConnectionError(f"Cannot anchor: Blockchain RPC at {self.rpc_url} is unreachable.")

        contract = self.get_contract()
        if not contract:
            raise ValueError("Cannot anchor: Smart contract address is not configured or deployed.")

        if not self.signer_key:
            raise PermissionError("Cannot anchor: No authorized signer key configured in environment.")

        try:
            from eth_account import Account
            from web3 import Web3

            account = Account.from_key(self.signer_key)
            
            # Format event_hash as 32-byte bytes
            clean_hex = event_hash_hex[2:] if event_hash_hex.startswith("0x") else event_hash_hex
            hash_bytes = bytes.fromhex(clean_hex)

            # Check if already anchored
            matches, exists = contract.functions.verifyAnchor(event_id, hash_bytes).call()
            if exists:
                raise ValueError(f"Event '{event_id}' is already anchored on-chain.")

            nonce = w3.eth.get_transaction_count(account.address, "pending")
            gas_price = w3.eth.gas_price

            tx_func = contract.functions.anchorEvent(event_id, hash_bytes)
            
            # Estimate gas with safety margin
            try:
                estimated_gas = tx_func.estimate_gas({"from": account.address})
                gas_limit = int(estimated_gas * 1.25)
            except Exception:
                gas_limit = 150000

            tx = tx_func.build_transaction({
                "from": account.address,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": gas_price,
                "chainId": self.chain_id
            })

            signed_tx = w3.eth.account.sign_transaction(tx, private_key=self.signer_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, 'hex') else f"0x{bytes(tx_hash).hex()}"

            # Wait for receipt and validate
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            if receipt.status != 1:
                raise RuntimeError(f"Anchoring transaction reverted on-chain (tx: {tx_hash_hex}).")

            return {
                "transaction_hash": tx_hash_hex,
                "block_number": receipt.blockNumber,
                "contract_address": self.contract_address,
                "chain_id": self.chain_id,
                "network_name": self.network_name,
                "signer_address": account.address,
                "status": "CONFIRMED"
            }
        except Exception as e:
            # Re-raise clean exceptions without exposing raw private keys
            err_msg = str(e)
            if self.signer_key and self.signer_key in err_msg:
                err_msg = err_msg.replace(self.signer_key, "[REDACTED_SIGNER_KEY]")
            raise RuntimeError(f"Anchoring failed: {err_msg}")


# Singleton service provider
_blockchain_service_instance = None

def get_blockchain_service() -> BlockchainService:
    global _blockchain_service_instance
    if _blockchain_service_instance is None:
        _blockchain_service_instance = BlockchainService()
    return _blockchain_service_instance
