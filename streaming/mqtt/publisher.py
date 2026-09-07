"""
publisher.py -- MQTT telemetry publisher with schema validation.

Publishes each telemetry dict to ``telemetry/{engine_id}`` as JSON.
Validates every dict against the canonical schema before publishing;
malformed messages are logged and skipped, never crashing the loop.

Requires **paho-mqtt** (``pip install paho-mqtt``).
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Generator, Optional, Set

try:
    import paho.mqtt.client as mqtt
except ImportError:
    raise ImportError(
        "paho-mqtt is required. Install with:  pip install paho-mqtt"
    )

logger = logging.getLogger(__name__)

# -- Canonical schema fields for validation ----------------------------
_SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "telemetry_message.json"

_REQUIRED_FIELDS: Set[str] = {
    "engine_id", "timestamp", "rpm", "temperature",
    "oil_pressure", "fuel_flow", "altitude", "throttle",
}


def _validate_reading(reading: dict) -> bool:
    """Return True if *reading* contains all required canonical fields."""
    missing = _REQUIRED_FIELDS - set(reading.keys())
    if missing:
        logger.warning("Telemetry missing fields %s -- skipping.", missing)
        return False
    return True


class TelemetryPublisher:
    """
    Publishes canonical telemetry dicts to an MQTT broker.

    Parameters
    ----------
    broker_host : str    MQTT broker hostname (default ``localhost``).
    broker_port : int    MQTT broker port (default ``1883``).
    topic_prefix : str   Readings go to ``{prefix}/{engine_id}``.
    client_id : str      MQTT client identifier.
    qos : int            MQTT QoS level.
    reconnect_delay : float   Seconds before reconnection attempts.
    """

    def __init__(
        self,
        broker_host: str = "localhost",
        broker_port: int = 1883,
        topic_prefix: str = "telemetry",
        client_id: str = "dhruva-publisher",
        qos: int = 1,
        reconnect_delay: float = 2.0,
    ):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic_prefix = topic_prefix
        self.qos = qos
        self._reconnect_delay = reconnect_delay

        self._client = mqtt.Client(
            client_id=client_id,
            protocol=mqtt.MQTTv311,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        )
        self._connected = False
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect

    # -- MQTT callbacks ------------------------------------------------

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self._connected = True
            logger.info("Connected to MQTT broker %s:%s", self.broker_host, self.broker_port)
        else:
            logger.warning("MQTT connect failed (rc=%s)", rc)

    def _on_disconnect(self, client, userdata, flags, rc, properties=None):
        self._connected = False
        if rc != 0:
            logger.warning("Unexpected MQTT disconnect (rc=%s)", rc)

    # -- public API ----------------------------------------------------

    def connect(self) -> None:
        self._client.connect(self.broker_host, self.broker_port, keepalive=60)
        self._client.loop_start()
        deadline = time.time() + 5.0
        while not self._connected and time.time() < deadline:
            time.sleep(0.1)
        if not self._connected:
            logger.warning("Broker connection not confirmed within 5s -- continuing.")

    def disconnect(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
        self._connected = False

    def publish_one(self, reading: Dict[str, Any]) -> bool:
        """Validate and publish one reading. Returns True on success."""
        if not _validate_reading(reading):
            return False
        engine_id = reading.get("engine_id", "unknown")
        topic = f"{self.topic_prefix}/{engine_id}"
        payload = json.dumps(reading, default=str)
        try:
            info = self._client.publish(topic, payload, qos=self.qos)
            if info.rc != mqtt.MQTT_ERR_SUCCESS:
                logger.error("Publish failed on %s (rc=%s)", topic, info.rc)
                return False
            return True
        except Exception:
            logger.exception("Exception publishing to %s", topic)
            return False

    def publish_stream(
        self,
        source: Generator[Dict[str, Any], None, None],
        tick_seconds: float = 1.0,
        realtime: bool = True,
    ) -> None:
        """Consume *source* and publish each reading."""
        self.connect()
        count = 0
        try:
            for reading in source:
                self.publish_one(reading)
                count += 1
                if realtime and tick_seconds > 0:
                    time.sleep(tick_seconds)
        except KeyboardInterrupt:
            logger.info("Publisher interrupted after %d readings.", count)
        finally:
            logger.info("Published %d readings total.", count)
            self.disconnect()

    def _reconnect(self) -> None:
        logger.info("Reconnecting in %.1fs...", self._reconnect_delay)
        time.sleep(self._reconnect_delay)
        try:
            self._client.reconnect()
        except Exception:
            logger.exception("Reconnection failed")


def publish_telemetry(
    source: Generator[Dict[str, Any], None, None],
    broker_host: str = "localhost",
    broker_port: int = 1883,
    tick_seconds: float = 1.0,
    realtime: bool = True,
) -> None:
    """One-liner convenience function."""
    pub = TelemetryPublisher(broker_host=broker_host, broker_port=broker_port)
    pub.publish_stream(source, tick_seconds=tick_seconds, realtime=realtime)


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    print(
        "publisher.py -- use run_pipeline.py to test end-to-end,\n"
        "or instantiate TelemetryPublisher directly."
    )
