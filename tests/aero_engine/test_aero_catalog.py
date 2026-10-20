"""Unit tests for Dhruva Aero Aircraft Engine Catalog and TCDS Certification Provenance."""

import pytest
from aero_engine.catalog.models import (
    AeroCategory,
    AeroArchitecture,
    AeroProvenanceLevel,
)
from aero_engine.catalog.registry import aero_catalog


def test_catalog_has_all_four_categories():
    """Verify catalog covers PISTON, TURBOPROP, TURBOFAN, and TURBOJET without exception."""
    entries = aero_catalog.list_all()
    assert len(entries) >= 10

    categories = {e.category for e in entries}
    assert AeroCategory.PISTON in categories
    assert AeroCategory.TURBOPROP in categories
    assert AeroCategory.TURBOFAN in categories
    assert AeroCategory.TURBOJET in categories


def test_tcds_provenance_integrity():
    """Verify every engine has documented certification ID and authority (no fabricated specs)."""
    for entry in aero_catalog.list_all():
        assert entry.provenance.certification_id is not None
        assert len(entry.provenance.certification_id) > 3
        assert entry.provenance.issuing_authority in ["Federal Aviation Administration (FAA)", "European Union Aviation Safety Agency (EASA)", "FAA & EASA Joint Certification", "FAA & Transport Canada Civil Aviation", "United States Air Force / Naval Air Systems Command", "Civil Aviation Authority / EASA", "EASA & FAA"]
        assert entry.specifications.dry_weight_kg > 50.0


def test_piston_engines_have_piston_channels_only():
    """Verify piston engines do NOT expose turbofan/turboprop channels."""
    pistons = aero_catalog.list_by_category(AeroCategory.PISTON)
    assert len(pistons) >= 3
    for p in pistons:
        assert "rpm" in p.supported_channels
        assert "map_inhg" in p.supported_channels
        assert "cht_c" in p.supported_channels
        # Must not contain turbine-only channels
        assert "n1_pct" not in p.supported_channels
        assert "ng_pct" not in p.supported_channels
        assert "thrust_kn" not in p.supported_channels


def test_turbofan_engines_have_dual_spool_channels():
    """Verify turbofan engines expose N1, N2, EGT, and Thrust."""
    turbofans = aero_catalog.list_by_category(AeroCategory.TURBOFAN)
    assert len(turbofans) >= 4
    for tf in turbofans:
        assert "n1_pct" in tf.supported_channels
        assert "n2_pct" in tf.supported_channels
        assert "egt_c" in tf.supported_channels
        assert "thrust_kn" in tf.supported_channels
        # Must not contain piston-only channels
        assert "cht_c" not in tf.supported_channels
        assert "map_inhg" not in tf.supported_channels


def test_turboprop_engines_have_ng_np_channels():
    """Verify turboprop engines expose Ng, Np, ITT, Torque, and SHP."""
    turboprops = aero_catalog.list_by_category(AeroCategory.TURBOPROP)
    assert len(turboprops) >= 3
    for tp in turboprops:
        assert "ng_pct" in tp.supported_channels
        assert "np_rpm" in tp.supported_channels
        assert "itt_c" in tp.supported_channels
        assert "torque_ft_lb" in tp.supported_channels
        assert "shp" in tp.supported_channels
        assert "cht_c" not in tp.supported_channels
