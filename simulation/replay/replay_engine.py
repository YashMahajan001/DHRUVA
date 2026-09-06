"""
replay_engine.py -- Replay stored mission telemetry with VCR-style controls.

Loads a mission log (list of canonical-schema dicts, a JSON file path, or
an arbitrary callable returning such a list) and replays with play / pause /
resume / set_speed / reset / step_forward / step_backward.
"""

from __future__ import annotations

import json
import time
from enum import Enum, auto
from pathlib import Path
from typing import Any, Callable, Dict, Generator, List, Optional, Union


class PlaybackState(Enum):
    STOPPED = auto()
    PLAYING = auto()
    PAUSED = auto()


class ReplayEngine:
    """
    VCR-style replay of stored telemetry.

    Parameters
    ----------
    source : list[dict] | str | Path | callable
        - A list of canonical-schema dicts,
        - A path to a JSON file containing such a list,
        - A callable ``() -> list[dict]`` (e.g. a DB query).
    tick_seconds : float
        Assumed interval between consecutive readings (default 1.0 s).
    """

    def __init__(
        self,
        source: Union[List[Dict[str, Any]], str, Path, Callable[[], List[Dict[str, Any]]]],
        tick_seconds: float = 1.0,
    ):
        self._readings: List[Dict[str, Any]] = self._load(source)
        self._tick: float = tick_seconds
        self._cursor: int = 0
        self._speed: float = 1.0
        self._state: PlaybackState = PlaybackState.STOPPED

    @staticmethod
    def _load(source) -> List[Dict[str, Any]]:
        if isinstance(source, list):
            return list(source)
        if isinstance(source, (str, Path)):
            with Path(source).open("r", encoding="utf-8") as fh:
                data = json.load(fh)
            if not isinstance(data, list):
                raise ValueError(f"Expected JSON list, got {type(data).__name__}")
            return data
        if callable(source):
            data = source()
            if not isinstance(data, list):
                raise ValueError("Query function must return a list of dicts")
            return data
        raise TypeError(f"Unsupported source type: {type(source)}")

    # -- VCR controls --------------------------------------------------

    def play(self) -> Generator[Dict[str, Any], None, None]:
        self._state = PlaybackState.PLAYING
        while self._cursor < len(self._readings) and self._state == PlaybackState.PLAYING:
            reading = self._readings[self._cursor]
            self._cursor += 1
            delay = self._tick / self._speed if self._speed > 0 else 0
            if delay > 0:
                time.sleep(delay)
            yield reading
        if self._cursor >= len(self._readings):
            self._state = PlaybackState.STOPPED

    def pause(self) -> None:
        self._state = PlaybackState.PAUSED

    def resume(self) -> Generator[Dict[str, Any], None, None]:
        if self._state != PlaybackState.PAUSED:
            raise RuntimeError("Cannot resume: not paused")
        return self.play()

    def set_speed(self, factor: float) -> None:
        if factor <= 0:
            raise ValueError("Speed must be > 0")
        self._speed = factor

    def reset(self) -> None:
        self._cursor = 0
        self._state = PlaybackState.STOPPED

    def step_forward(self) -> Optional[Dict[str, Any]]:
        if self._cursor >= len(self._readings):
            return None
        reading = self._readings[self._cursor]
        self._cursor += 1
        return reading

    def step_backward(self) -> Optional[Dict[str, Any]]:
        if self._cursor <= 0:
            return None
        self._cursor -= 1
        return self._readings[self._cursor]

    # -- introspection -------------------------------------------------

    @property
    def total_frames(self) -> int:
        return len(self._readings)

    @property
    def current_frame(self) -> int:
        return self._cursor

    @property
    def state(self) -> PlaybackState:
        return self._state

    @property
    def speed(self) -> float:
        return self._speed

    def __len__(self) -> int:
        return len(self._readings)

    def __repr__(self) -> str:
        return (
            f"<ReplayEngine frames={self.total_frames} "
            f"cursor={self._cursor} speed={self._speed}x "
            f"state={self._state.name}>"
        )


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    sample = Path(__file__).parent / "sample_missions" / "sample_mission.json"
    if not sample.exists():
        print(f"Sample not found at {sample} -- generate it first.")
        raise SystemExit(1)

    eng = ReplayEngine(sample, tick_seconds=0.01)
    eng.set_speed(100)
    print(eng)
    for reading in eng.play():
        print(
            f"[{eng.current_frame}/{eng.total_frames}] "
            f"rpm={reading.get('rpm', 0):>7.1f} temp={reading.get('temperature', 0):.1f}"
        )
    print("Done.", eng)
