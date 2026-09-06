"""Load named JSON configuration files from configs/."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from simulation.exceptions import ConfigError
from simulation.paths import configs_dir


def load_named_config(kind: str, name: str) -> dict[str, Any]:
    """Load ``configs/<kind>/<name>.json``. ``name`` may omit the suffix."""
    stem = name[:-5] if name.endswith(".json") else name
    path = configs_dir() / kind / f"{stem}.json"
    if not path.is_file():
        raise ConfigError(f"Missing config file: {path}")
    try:
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise ConfigError(f"Config {path} must be a JSON object")
    return data


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ConfigError(f"{path} must be a JSON object")
    return data
