"""Repository path helpers (no hard-coded absolute paths)."""

from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def configs_dir() -> Path:
    return repo_root() / "configs"


def synthetic_data_dir() -> Path:
    return repo_root() / "data" / "synthetic"
