import os
import base64
import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class PayPalSandboxService:
    """
    Official PayPal Developer Sandbox integration service for SentinelMesh.
    Handles OAuth2 token acquisition, order creation, and capture under
    SentinelMesh Zero-Trust policy governance.
    """

    def __init__(self):
        self.base_url = settings.PAYPAL_BASE_URL.rstrip('/')
        self.client_id = os.getenv("PAYPAL_CLIENT_ID", settings.PAYPAL_CLIENT_ID)
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET", settings.PAYPAL_CLIENT_SECRET)

    def is_configured(self) -> bool:
        """Returns True only if non-empty sandbox credentials are provided."""
        return bool(self.client_id and self.client_secret and len(self.client_id.strip()) > 5)

    def get_status(self) -> Dict[str, Any]:
        """Provides status and configuration diagnostics for PayPal Sandbox."""
        configured = self.is_configured()
        masked_client = f"{self.client_id[:6]}...{self.client_id[-4:]}" if configured else "UNCONFIGURED"
        return {
            "integration": "PayPal Developer Sandbox",
            "is_configured": configured,
            "base_url": self.base_url,
            "environment": "SANDBOX",
            "client_id_preview": masked_client,
            "supported_currencies": ["USD", "EUR", "GBP", "CAD", "AUD"],
            "governance_mode": "ZERO_TRUST_POLICY_GATED",
            "setup_guide_url": "https://developer.paypal.com/dashboard/applications/sandbox",
            "status_message": (
                "PayPal Developer Sandbox credentials active and ready for policy-gated transactions."
                if configured else
                "PayPal Sandbox credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in backend environment to enable live sandbox API calls."
            )
        }

    def get_access_token(self) -> Optional[str]:
        """Requests OAuth 2.0 access token via client_credentials flow."""
        if not self.is_configured():
            return None

        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}

        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.post(f"{self.base_url}/v1/oauth2/token", headers=headers, data=data)
                if res.status_code == 200:
                    token_data = res.json()
                    return token_data.get("access_token")
                logger.error(f"PayPal OAuth failed with HTTP {res.status_code}: {res.text}")
                return None
        except Exception as e:
            logger.error(f"PayPal OAuth exception: {str(e)}")
            return None

    def create_order(
        self,
        amount: float,
        currency: str = "USD",
        reference_id: str = "sentinel_order",
        description: str = "Policy-governed AI Agent Transaction"
    ) -> Dict[str, Any]:
        """
        Creates a PayPal checkout order in the Sandbox.
        Requires policy approval before execution.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "CONFIGURATION_REQUIRED",
                "message": "PayPal Sandbox credentials not configured. Please supply PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
            }

        token = self.get_access_token()
        if not token:
            return {
                "success": False,
                "error": "AUTH_FAILED",
                "message": "Failed to authenticate with PayPal Sandbox. Verify client ID and secret."
            }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": reference_id,
                    "description": description,
                    "amount": {
                        "currency_code": currency.upper(),
                        "value": f"{amount:.2f}"
                    }
                }
            ],
            "application_context": {
                "brand_name": "SentinelMesh AI Gateway",
                "landing_page": "NO_PREFERENCE",
                "user_action": "PAY_NOW",
                "return_url": "https://sentinelmesh.io/paypal/return",
                "cancel_url": "https://sentinelmesh.io/paypal/cancel"
            }
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(f"{self.base_url}/v2/checkout/orders", headers=headers, json=order_payload)
                data = res.json()
                if res.status_code in {200, 201}:
                    return {
                        "success": True,
                        "order_id": data.get("id"),
                        "status": data.get("status"),
                        "links": data.get("links", []),
                        "amount": f"{amount:.2f}",
                        "currency": currency.upper(),
                        "raw_response": data
                    }
                return {
                    "success": False,
                    "error": f"PAYPAL_HTTP_{res.status_code}",
                    "message": data.get("message", "PayPal order creation failed"),
                    "details": data.get("details", [])
                }
        except Exception as e:
            logger.error(f"PayPal create_order error: {str(e)}")
            return {
                "success": False,
                "error": "NETWORK_EXCEPTION",
                "message": f"Network exception communicating with PayPal Sandbox: {str(e)}"
            }

    def capture_order(self, order_id: str) -> Dict[str, Any]:
        """
        Captures an approved PayPal order.
        """
        if not self.is_configured():
            return {
                "success": False,
                "error": "CONFIGURATION_REQUIRED",
                "message": "PayPal Sandbox credentials not configured."
            }

        token = self.get_access_token()
        if not token:
            return {
                "success": False,
                "error": "AUTH_FAILED",
                "message": "Failed to authenticate with PayPal Sandbox."
            }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(f"{self.base_url}/v2/checkout/orders/{order_id}/capture", headers=headers, json={})
                data = res.json()
                if res.status_code in {200, 201}:
                    capture_id = None
                    try:
                        capture_id = data["purchase_units"][0]["payments"]["captures"][0]["id"]
                    except (KeyError, IndexError):
                        pass

                    return {
                        "success": True,
                        "order_id": order_id,
                        "capture_id": capture_id,
                        "status": data.get("status"),
                        "raw_response": data
                    }
                return {
                    "success": False,
                    "error": f"PAYPAL_HTTP_{res.status_code}",
                    "message": data.get("message", "Payment capture failed"),
                    "details": data.get("details", [])
                }
        except Exception as e:
            return {
                "success": False,
                "error": "NETWORK_EXCEPTION",
                "message": f"Network exception during capture: {str(e)}"
            }

paypal_sandbox_service = PayPalSandboxService()
