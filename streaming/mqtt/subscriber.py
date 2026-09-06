"""
subscriber.py -- MQTT telemetry subscriber.

Subscribes to ``telemetry/#``, validates incoming JSON against the canonical
schema, and calls the backend integration callback with the EXACT signature:

    process_and_broadcast(telemetry: dict)

This file is deliberately free of any DB, SQLAlchemy, or service imports.
The callback is injected by whoever wires this up on the backend side.

Requires **paho-mqtt** (``pip install paho-mqtt``).
"""

from __future__ import annotations

import json
import logging
from typing import Callable, Dict, Optional, Set

try:
    import paho.mqtt.client as mqtt
except ImportError:
    raise ImportError(
        "paho-mqtt is required. Install with:  pip install paho-mqtt"
    )

logger = logging.getLogger(__name__)

# -- Canonical schema fields for validation ----------------------------
_REQUIRED_FIELDS: Set[str] = {
    "engine_id", "timestamp", "rpm", "temperature",
    "oil_pressure", "fuel_flow", "altitude", "throttle",
}


def _validate_reading(data: dict) -> bool:
    """Return True if *data* contains all required canonical fields."""
    missing = _REQUIRED_FIELDS - set(data.keys())
    if missing:
        logger.warning("Incoming telemetry missing fields %s -- dropping.", missing)
        return False
    return True


class TelemetrySubscriber:
    """
    Subscribes to MQTT telemetry topics and forwards validated dicts to
    the backend callback.

    Parameters
    ----------
    process_and_broadcast : callable
        ``fn(telemetry: dict) -> None`` -- the named callback that the
        backend integration contract expects.
    broker_host : str   MQTT broker hostname.
    broker_port : int   MQTT broker port.
    topic : str         Topic pattern (default ``telemetry/#``).
    client_id : str     MQTT client identifier.
    qos : int           MQTT QoS level.
    """

    def __init__(
        self,
        process_and_broadcast: Callable[[Dict], None],
        broker_host: str = "localhost",
        broker_port: int = 1883,
        topic: str = "telemetry/#",
        client_id: str = "dhruva-subscriber",
        qos: int = 1,
    ):
        self._callback = process_and_broadcast
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic
        self.qos = qos

        self._client = mqtt.Client(
            client_id=client_id,
            protocol=mqtt.MQTTv311,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        )
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect

    # -- MQTT callbacks ------------------------------------------------

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            logger.info(
                "Subscriber connected to %s:%s -- subscribing to '%s'",
                self.broker_host, self.broker_port, self.topic,
            )
            client.subscribe(self.topic, qos=self.qos)
        else:
            logger.warning("Subscriber connect failed (rc=%s)", rc)

    def _on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode("utf-8")
            data: dict = json.loads(payload)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            logger.warning("Bad payload on %s: %s", msg.topic, exc)
            return

        if not _validate_reading(data):
            return

        logger.debug("Validated telemetry on %s", msg.topic)
        try:
            self._callback(data)
        except Exception:
            logger.exception("Error in process_and_broadcast callback")

    def _on_disconnect(self, client, userdata, flags, rc, properties=None):
        if rc != 0:
            logger.warning("Subscriber disconnected (rc=%s)", rc)

    # -- public API ----------------------------------------------------

    def start(self, blocking: bool = True) -> None:
        """
        Connect and begin listening.

        If *blocking* is True (default), blocks with ``loop_forever()``.
        If False, starts a background thread and returns immediately.
        """
        self._client.connect(self.broker_host, self.broker_port, keepalive=60)
        if blocking:
            logger.info("Subscriber entering blocking loop...")
            try:
                self._client.loop_forever()
            except KeyboardInterrupt:
                logger.info("Subscriber stopped by user.")
        else:
            self._client.loop_start()

    def stop(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
        logger.info("Subscriber disconnected.")


# ---------------------------------------------------------------------------
# CLI smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    def process_and_broadcast(telemetry: dict) -> None:
        """Example callback matching the backend contract signature."""
        eid = telemetry.get("engine_id", "?")
        rpm = telemetry.get("rpm", 0)
        temp = telemetry.get("temperature", 0)
        print(f"[{eid}] rpm={rpm:>7.1f} temp={temp:.1f}")

    print("Starting subscriber on telemetry/# (Ctrl-C to quit)...")
    sub = TelemetrySubscriber(process_and_broadcast=process_and_broadcast)
    sub.start(blocking=True)
