"""
SentinelMesh Real-Time Monitoring & SSE Stream Endpoint
Phase 7
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from app.monitoring.events import get_broadcaster

monitoring_router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])


@monitoring_router.get("/stream")
async def stream_live_events(request: Request):
    """
    Server-Sent Events (SSE) live event stream for the Security Operations Center.
    Transmits real-time events for action evaluations, detections, and incident updates.
    """
    broadcaster = get_broadcaster()
    queue = broadcaster.subscribe()

    return StreamingResponse(
        broadcaster.event_generator(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
