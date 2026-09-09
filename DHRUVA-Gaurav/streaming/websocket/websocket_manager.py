"""
websocket_manager.py -- FastAPI-compatible WebSocket connection manager
supporting two channel types:
    1. Per-engine channel  -- /ws/telemetry/{engine_id}
    2. Global fleet stream -- /ws/telemetry
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from typing import Any, Dict, List, Set, Optional

try:
    from fastapi import WebSocket
except ImportError:
    WebSocket = Any  # type: ignore[assignment,misc]

logger = logging.getLogger("streaming.websocket")


class ConnectionManager:
    """Manages real-time WebSocket subscriptions per engine and global broadcast."""

    def __init__(self) -> None:
        # Map engine_id -> set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Clients listening to all engines
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, engine_id: Optional[str] = "all") -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        channel = engine_id or "all"
        if channel == "all":
            self.global_connections.add(websocket)
        else:
            self.active_connections[channel].add(websocket)
        logger.info(f"WebSocket client connected to channel: '{channel}'")

    def disconnect(self, websocket: WebSocket, engine_id: Optional[str] = "all") -> None:
        """Unregister a disconnected WebSocket client."""
        channel = engine_id or "all"
        if channel == "all":
            self.global_connections.discard(websocket)
        elif channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
        logger.info(f"WebSocket client disconnected from channel: '{channel}'")

    async def broadcast_telemetry(self, engine_id: str, data: Any) -> None:
        """Sends telemetry payload to subscribed engine clients and global listeners."""
        payload = json.dumps(data) if not isinstance(data, str) else data

        # Send to specific engine subscribers
        targets = list(self.active_connections.get(engine_id, set()))
        for conn in targets:
            try:
                await conn.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to engine subscriber: {e}")
                self.disconnect(conn, engine_id)

        # Send to global subscribers
        global_targets = list(self.global_connections)
        for conn in global_targets:
            try:
                await conn.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending to global subscriber: {e}")
                self.disconnect(conn, "all")

    async def broadcast_to_engine(self, engine_id: str, message: Any) -> None:
        """Send message specifically to clients subscribed to engine_id."""
        await self.broadcast_telemetry(engine_id, message)

    async def broadcast_global(self, message: Any) -> None:
        """Send message to global fleet subscribers."""
        payload = json.dumps(message) if not isinstance(message, str) else message
        for conn in list(self.global_connections):
            try:
                await conn.send_text(payload)
            except Exception as e:
                logger.warning(f"Error broadcasting global: {e}")
                self.disconnect(conn, "all")

    @property
    def total_connections(self) -> int:
        engine_count = sum(len(v) for v in self.active_connections.values())
        return engine_count + len(self.global_connections)


# Singleton instances for both naming conventions
manager = ConnectionManager()
ws_manager = manager
