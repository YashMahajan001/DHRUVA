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
