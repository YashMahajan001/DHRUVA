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
from typing import Any, Dict, List, Optional, Set

try:
    from fastapi import WebSocket
except ImportError:
    WebSocket = Any  # type: ignore[assignment,misc]

logger = logging.getLogger("streaming.websocket")


class WebSocketManager:
    """
    Manages active WebSocket connections across per-engine and global
    channels. Designed as an importable singleton.
    """

    def __init__(self) -> None:
        self._engine_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._global_connections: Set[WebSocket] = set()
        self._ws_to_engine: Dict[Any, Optional[str]] = {}

    async def connect(self, websocket: WebSocket, engine_id: Optional[str] = "all") -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        norm_id = None if engine_id in (None, "all") else engine_id
        self._ws_to_engine[websocket] = norm_id

        if norm_id is not None:
            self._engine_connections[norm_id].add(websocket)
            logger.info(f"WS client connected to engine channel '{norm_id}'")
        else:
            self._global_connections.add(websocket)
            logger.info("WS client connected to global stream")

    def disconnect(self, websocket: WebSocket, engine_id: Optional[str] = None) -> None:
        """Unregister a WebSocket connection."""
        reg_engine = self._ws_to_engine.pop(websocket, None)
        target = engine_id if engine_id not in (None, "all") else reg_engine

        if target is not None and target in self._engine_connections:
            self._engine_connections[target].discard(websocket)
            if not self._engine_connections[target]:
                del self._engine_connections[target]
        else:
            self._global_connections.discard(websocket)

        logger.info(f"WS client disconnected ({self.active_connections} remaining)")

    async def broadcast_to_engine(self, engine_id: str, message: Any) -> None:
        """Send message to clients subscribed to engine_id."""
        payload = message if isinstance(message, str) else json.dumps(message, default=str)
        stale: List[WebSocket] = []
        for ws in list(self._engine_connections.get(engine_id, set())):
            try:
                await ws.send_text(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws, engine_id)

    async def broadcast_global(self, message: Any) -> None:
        """Send message to clients on global stream."""
        payload = message if isinstance(message, str) else json.dumps(message, default=str)
        stale: List[WebSocket] = []
        for ws in list(self._global_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)

    async def broadcast(self, engine_id: str, message: Any) -> None:
        """Broadcast to both per-engine channel and global stream."""
        await self.broadcast_to_engine(engine_id, message)
        await self.broadcast_global(message)

    async def broadcast_telemetry(self, engine_id: str, data: Any) -> None:
        """Alias for broadcast to support telemetry service integration."""
        await self.broadcast(engine_id, data)

    @property
    def active_connections(self) -> int:
        engine_count = sum(len(v) for v in self._engine_connections.values())
        return engine_count + len(self._global_connections)

    @property
    def engine_ids(self) -> List[str]:
        return list(self._engine_connections.keys())


# Singleton exports matching all import conventions across branches
ws_manager = WebSocketManager()
manager = ws_manager
ConnectionManager = WebSocketManager

__all__ = ["WebSocketManager", "ConnectionManager", "ws_manager", "manager"]
