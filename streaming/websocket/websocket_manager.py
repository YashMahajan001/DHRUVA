<<<<<<< HEAD
"""
websocket_manager.py -- FastAPI-compatible WebSocket connection manager
supporting two channel types:

    1. Per-engine channel  -- /ws/telemetry/{engine_id}
    2. Global fleet stream -- /ws/telemetry

The actual endpoint routing is the backend's responsibility.  This module
only manages connections and provides broadcast primitives:

    connect(websocket, engine_id=None)
    disconnect(websocket)
    broadcast_to_engine(engine_id, message)
    broadcast_global(message)

Usage in a FastAPI app
----------------------
    from streaming.websocket.websocket_manager import ws_manager

    @app.websocket("/ws/telemetry/{engine_id}")
    async def engine_ws(websocket: WebSocket, engine_id: str):
        await ws_manager.connect(websocket, engine_id=engine_id)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            ws_manager.disconnect(websocket)

    @app.websocket("/ws/telemetry")
    async def global_ws(websocket: WebSocket):
        await ws_manager.connect(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            ws_manager.disconnect(websocket)
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional

try:
    from fastapi import WebSocket
except ImportError:
    # Allow import in non-FastAPI contexts (unit tests, CLI scripts).
    WebSocket = Any  # type: ignore[assignment,misc]

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages active WebSocket connections across per-engine and global
    channels.  Designed as an importable singleton (``ws_manager``).
    """

    def __init__(self) -> None:
        # engine_id -> list of websockets subscribed to that engine
        self._engine_connections: Dict[str, List] = defaultdict(list)
        # websockets subscribed to the global fleet stream
        self._global_connections: List = []
        # reverse lookup: websocket -> engine_id (or None for global)
        self._ws_to_engine: Dict[Any, Optional[str]] = {}

    async def connect(self, websocket, engine_id: Optional[str] = None) -> None:
        """
        Accept and register a WebSocket connection.

        Parameters
        ----------
        websocket : WebSocket   The incoming connection.
        engine_id : str or None
            If provided, subscribe to per-engine channel.
            If None, subscribe to the global fleet stream.
        """
        await websocket.accept()
        self._ws_to_engine[websocket] = engine_id

        if engine_id is not None:
            self._engine_connections[engine_id].append(websocket)
            logger.info(
                "WS client connected to engine '%s' (%d on this engine, %d total).",
                engine_id,
                len(self._engine_connections[engine_id]),
                self.active_connections,
            )
        else:
            self._global_connections.append(websocket)
            logger.info(
                "WS client connected to global stream (%d global, %d total).",
                len(self._global_connections),
                self.active_connections,
            )

    def disconnect(self, websocket) -> None:
        """Unregister a WebSocket connection from whichever channel it belongs to."""
        engine_id = self._ws_to_engine.pop(websocket, None)

        if engine_id is not None:
            conns = self._engine_connections.get(engine_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._engine_connections.pop(engine_id, None)
        else:
            if websocket in self._global_connections:
                self._global_connections.remove(websocket)

        logger.info(
            "WS client disconnected (%d remaining).", self.active_connections,
        )

    async def broadcast_to_engine(self, engine_id: str, message: Dict[str, Any]) -> None:
        """
        Send *message* to all clients subscribed to a specific engine's channel.
        Silently removes stale connections.
        """
        payload = json.dumps(message, default=str)
        stale: List = []
        for ws in self._engine_connections.get(engine_id, []):
            try:
                await ws.send_text(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)

    async def broadcast_global(self, message: Dict[str, Any]) -> None:
        """
        Send *message* to all clients on the global fleet stream.
        Silently removes stale connections.
        """
        payload = json.dumps(message, default=str)
        stale: List = []
        for ws in list(self._global_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(ws)

    async def broadcast(self, engine_id: str, message: Dict[str, Any]) -> None:
        """
        Convenience: broadcast to both the per-engine channel AND the
        global fleet stream in one call.
        """
        await self.broadcast_to_engine(engine_id, message)
        await self.broadcast_global(message)

    @property
    def active_connections(self) -> int:
        engine_count = sum(len(v) for v in self._engine_connections.values())
        return engine_count + len(self._global_connections)

    @property
    def engine_ids(self) -> List[str]:
        """Return list of engine_ids that have active connections."""
        return list(self._engine_connections.keys())


# -- Singleton instance (import this in your FastAPI app) ------------------
ws_manager = WebSocketManager()
=======
import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("streaming.websocket")

class ConnectionManager:
    """Manages real-time WebSocket subscriptions per engine and global broadcast."""
    def __init__(self):
        # Map engine_id -> set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Clients listening to all engines
        self.global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, engine_id: str = "all"):
        await websocket.accept()
        if engine_id == "all":
            self.global_connections.add(websocket)
        else:
            if engine_id not in self.active_connections:
                self.active_connections[engine_id] = set()
            self.active_connections[engine_id].add(websocket)
        logger.info(f"WebSocket client connected to channel: '{engine_id}'")

    def disconnect(self, websocket: WebSocket, engine_id: str = "all"):
        if engine_id == "all":
            self.global_connections.discard(websocket)
        elif engine_id in self.active_connections:
            self.active_connections[engine_id].discard(websocket)
            if not self.active_connections[engine_id]:
                del self.active_connections[engine_id]
        logger.info(f"WebSocket client disconnected from channel: '{engine_id}'")

    async def broadcast_telemetry(self, engine_id: str, data: Any):
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

manager = ConnectionManager()
>>>>>>> 428b29a499f4fbffd45a8684a761d4229e3a15d8
