"""
SentinelMesh Real-Time Monitoring & SSE Event Broadcaster
Phase 7
"""

import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List
from datetime import datetime, timezone

class EventBroadcaster:
    """
    Lightweight, reliable Server-Sent Events (SSE) broadcaster.
    Broadcasts real-time events to connected clients with graceful disconnect handling.
    """
    def __init__(self):
        self._subscribers: List[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    def publish_nowait(self, event_type: str, data: Dict[str, Any]):
        """
        Synchronous/thread-safe publish into all subscriber queues.
        """
        payload = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        json_str = json.dumps(payload)
        for q in list(self._subscribers):
            try:
                q.put_nowait(json_str)
            except (asyncio.QueueFull, Exception):
                pass

    async def event_generator(self, queue: asyncio.Queue) -> AsyncGenerator[str, None]:
        try:
            # Send initial connected banner
            initial_msg = json.dumps({
                "event_type": "CONNECTED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {"status": "LIVE_MONITORING_ACTIVE"}
            })
            yield f"data: {initial_msg}\n\n"

            while True:
                try:
                    # Wait for next event with a 15-second heartbeat timeout
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    # Send keep-alive heartbeat ping
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await self.unsubscribe(queue)

# Global singleton broadcaster instance
broadcaster = EventBroadcaster()

def get_broadcaster() -> EventBroadcaster:
    return broadcaster
