from app.api.dashboard import router as dashboard_router
from app.api.events import router as events_router
from app.api.actions import router as actions_router
from app.api.policies import router as policies_router
from app.api.approvals import router as approvals_router
from app.api.integrity import router as integrity_router
from app.api.auth import router as auth_router
from app.api.reports import router as reports_router
from app.api.threats import threats_router
from app.api.agents import agents_router
from app.api.incidents import incidents_router
from app.api.monitoring import monitoring_router
from app.api.governance import governance_router
from app.api.paypal import router as paypal_router

__all__ = [
    "dashboard_router",
    "events_router",
    "actions_router",
    "policies_router",
    "approvals_router",
    "integrity_router",
    "auth_router",
    "reports_router",
    "threats_router",
    "agents_router",
    "incidents_router",
    "monitoring_router",
    "governance_router",
    "paypal_router"
]



