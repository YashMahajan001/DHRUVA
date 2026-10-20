"""Physics-Based Component Degradation and Remaining Useful Life (RUL) Modeling.

Implements thermal-mechanical wear accumulation (Arrhenius thermal oxidation,
Miner's cumulative damage, and Archard frictional wear). Explicitly validates
data sufficiency and refuses to fabricate RUL predictions when telemetry history
is insufficient.
"""

from __future__ import annotations

from typing import List, Dict, Optional, Tuple
import math

from auto_engine.catalog.models import EngineCatalogEntry
from auto_engine.intelligence.models import (
    SubsystemType,
    SubsystemDegradation,
    DegradationStatus,
)


class ComponentDegradationTracker:
    """Tracks cumulative physical damage and estimates Remaining Useful Life (RUL).

    Features:
    1. Turbocharger journal bearing cumulative damage (Miner's rule + Arrhenius thermal factor).
    2. Lubricating oil thermal-oxidative degradation & shear thinning.
    3. Piston ring / cylinder wall frictional wear (Archard adhesive wear).
    4. Cooling radiator core fouling / scale resistance.
    5. Honest 'INSUFFICIENT_DATA' safeguards when operating history is too sparse.
    """

    def __init__(self, engine: EngineCatalogEntry):
        self.engine = engine

    def estimate_all(
        self,
        cumulative_hours: float,
        mean_rpm: float,
        mean_oil_temp_c: float,
        mean_coolant_temp_c: float,
        mean_throttle: float,
        high_temp_excursion_hours: float = 0.0,
    ) -> List[SubsystemDegradation]:
        """Estimate degradation state for all major powertrain components."""
        results: List[SubsystemDegradation] = []

        results.append(
            self.estimate_oil_health(
                cumulative_hours=cumulative_hours,
                mean_oil_temp_c=mean_oil_temp_c,
                high_temp_excursions_hrs=high_temp_excursion_hours,
            )
        )
        results.append(
            self.estimate_turbo_bearing_rul(
                cumulative_hours=cumulative_hours,
                mean_rpm=mean_rpm,
                mean_oil_temp_c=mean_oil_temp_c,
                mean_throttle=mean_throttle,
            )
        )
        results.append(
            self.estimate_piston_ring_wear(
                cumulative_hours=cumulative_hours,
                mean_rpm=mean_rpm,
                mean_throttle=mean_throttle,
            )
        )
        results.append(
            self.estimate_cooling_system_degradation(
                cumulative_hours=cumulative_hours,
                mean_coolant_temp_c=mean_coolant_temp_c,
            )
        )

        return results

    def estimate_oil_health(
        self,
        cumulative_hours: float,
        mean_oil_temp_c: float,
        high_temp_excursions_hrs: float = 0.0,
    ) -> SubsystemDegradation:
        """Estimate lubricating oil chemical degradation and remaining service life."""
        # Input sanitization against NaN/Inf and boundary violations
        if math.isnan(cumulative_hours) or math.isinf(cumulative_hours) or cumulative_hours < 0.0:
            cumulative_hours = 0.0
        if math.isnan(mean_oil_temp_c) or math.isinf(mean_oil_temp_c):
            mean_oil_temp_c = 90.0
        if math.isnan(high_temp_excursions_hrs) or math.isinf(high_temp_excursions_hrs) or high_temp_excursions_hrs < 0.0:
            high_temp_excursions_hrs = 0.0

        # Minimum data requirement: at least 0.5 operating hours logged
        if cumulative_hours < 0.5:
            return SubsystemDegradation(
                subsystem=SubsystemType.LUBRICATION,
                component_name="Engine Lubricating Oil (SAE Synthetic)",
                health_percentage=100.0,
                cumulative_stress_hours=cumulative_hours,
                degradation_metric="Thermal-Oxidative Viscosity Index Decay",
                rul_hours_estimate=None,
                rul_uncertainty_interval=None,
                status=DegradationStatus.INSUFFICIENT_DATA,
                assumptions=[
                    "Service oil capacity is at nominal fill level.",
                    "No catastrophic fuel dilution (> 3%) or coolant seal breach.",
                ],
                required_data=[
                    "Minimum 0.5 hours of operating thermal telemetry.",
                    "Oil laboratory spectroscopic analysis (TAN, TBN, soot content).",
                ],
            )

        # Baseline oil design service life (e.g. 250 operating hours)
        design_service_hrs = 250.0

        # Arrhenius thermal acceleration factor for oil oxidation:
        # Rate roughly doubles for every 10 deg C above nominal 90 deg C
        t_ref_c = 90.0
        delta_t = max(0.0, min(100.0, mean_oil_temp_c - t_ref_c))
        thermal_accel = 2.0 ** (delta_t / 10.0)

        # High temperature excursion penalty (> 120 deg C rapidly shears polymer viscosity index improvers)
        excursion_penalty = high_temp_excursions_hrs * 4.0

        equivalent_stress_hrs = (cumulative_hours * thermal_accel) + excursion_penalty
        damage_fraction = min(1.0, equivalent_stress_hrs / design_service_hrs)
        health_pct = round(max(0.0, (1.0 - damage_fraction) * 100.0), 1)

        remaining_equiv_hrs = max(0.0, design_service_hrs - equivalent_stress_hrs)
        # Convert back to real operating hours at current thermal pace
        rul_estimate = round(remaining_equiv_hrs / max(0.1, thermal_accel), 1)
        uncertainty = (round(rul_estimate * 0.85, 1), round(rul_estimate * 1.15, 1))

        return SubsystemDegradation(
            subsystem=SubsystemType.LUBRICATION,
            component_name="Engine Lubricating Oil (SAE Synthetic)",
            health_percentage=health_pct,
            cumulative_stress_hours=round(equivalent_stress_hrs, 2),
            degradation_metric="Thermal-Oxidative Viscosity Index Decay",
            rul_hours_estimate=rul_estimate,
            rul_uncertainty_interval=uncertainty,
            status=DegradationStatus.SUFFICIENT_DATA,
            assumptions=[
                "SAE 5W-40 full-synthetic oil meeting OEM specification.",
                "Oxidation follows first-order Arrhenius kinetics with Q10=2.0 above 90°C.",
                "Nominal additive replenishment occurs only upon full oil drain and refill.",
            ],
            required_data=[
                "Continuous oil gallery temperature log.",
                "Optional: Fluid dielectric permittivity sensor verification.",
            ],
        )

    def estimate_turbo_bearing_rul(
        self,
        cumulative_hours: float,
        mean_rpm: float,
        mean_oil_temp_c: float,
        mean_throttle: float,
    ) -> SubsystemDegradation:
        """Estimate turbocharger journal bearing wear and RUL via Miner's cumulative damage."""
        if math.isnan(cumulative_hours) or math.isinf(cumulative_hours) or cumulative_hours < 0.0:
            cumulative_hours = 0.0
        if math.isnan(mean_rpm) or math.isinf(mean_rpm) or mean_rpm < 0.0:
            mean_rpm = float(self.engine.operating_limits.idle_rpm)
        if math.isnan(mean_oil_temp_c) or math.isinf(mean_oil_temp_c):
            mean_oil_temp_c = 90.0
        if math.isnan(mean_throttle) or math.isinf(mean_throttle):
            mean_throttle = 0.5
        mean_throttle = max(0.0, min(1.0, mean_throttle))

        if cumulative_hours < 1.0:
            return SubsystemDegradation(
                subsystem=SubsystemType.EXHAUST_TURBO,
                component_name="Turbocharger Journal & Thrust Bearings",
                health_percentage=100.0,
                cumulative_stress_hours=cumulative_hours,
                degradation_metric="Miner Thermal-Mechanical Damage Fraction",
                rul_hours_estimate=None,
                rul_uncertainty_interval=None,
                status=DegradationStatus.INSUFFICIENT_DATA,
                assumptions=[
                    "Balanced compressor wheel without severe foreign object damage.",
                ],
                required_data=[
                    "Minimum 1.0 cumulative operating hours with throttle/RPM histograms.",
                    "Turbocharger rotational speed sensor or calibrated boost proxy history.",
                ],
            )

        # Baseline design life at rated continuous operation: 2,500 hours
        rated_life_hrs = 2500.0

        # Mechanical speed factor (spool stress scales with ~ RPM^1.8)
        rpm_ratio = max(0.2, mean_rpm / self.engine.specifications.rated_power_rpm)
        speed_factor = rpm_ratio ** 1.8

        # Thermal factor from oil temperature supply
        thermal_factor = max(0.8, 1.0 + 0.02 * max(0.0, mean_oil_temp_c - 100.0))

        equiv_hours = cumulative_hours * speed_factor * thermal_factor
        damage = min(1.0, equiv_hours / rated_life_hrs)
        health_pct = round(max(0.0, (1.0 - damage) * 100.0), 1)

        remaining_equiv = max(0.0, rated_life_hrs - equiv_hours)
        rul_estimate = round(remaining_equiv / max(0.1, speed_factor * thermal_factor), 1)
        uncertainty = (round(rul_estimate * 0.80, 1), round(rul_estimate * 1.20, 1))

        return SubsystemDegradation(
            subsystem=SubsystemType.EXHAUST_TURBO,
            component_name="Turbocharger Journal & Thrust Bearings",
            health_percentage=health_pct,
            cumulative_stress_hours=round(equiv_hours, 2),
            degradation_metric="Miner Thermal-Mechanical Damage Fraction",
            rul_hours_estimate=rul_estimate,
            rul_uncertainty_interval=uncertainty,
            status=DegradationStatus.SUFFICIENT_DATA,
            assumptions=[
                "Hydrodynamic floating bush bearing clearance starts within factory tolerance (0.025-0.045 mm).",
                "Damage accumulation obeys Palmgren-Miner linear hypothesis.",
                "No hot engine shut-downs causing carbonization/oil coking in bearing housing.",
            ],
            required_data=[
                "Turbine inlet temperature (TIT) / EGT time series.",
                "Cold-start to rated load spool-up duration logs.",
            ],
        )

    def estimate_piston_ring_wear(
        self,
        cumulative_hours: float,
        mean_rpm: float,
        mean_throttle: float,
    ) -> SubsystemDegradation:
        """Estimate piston compression ring & cylinder wall abrasive/adhesive wear."""
        if math.isnan(cumulative_hours) or math.isinf(cumulative_hours) or cumulative_hours < 0.0:
            cumulative_hours = 0.0
        if math.isnan(mean_rpm) or math.isinf(mean_rpm) or mean_rpm < 0.0:
            mean_rpm = float(self.engine.operating_limits.idle_rpm)
        if math.isnan(mean_throttle) or math.isinf(mean_throttle):
            mean_throttle = 0.5
        mean_throttle = max(0.0, min(1.0, mean_throttle))

        if cumulative_hours < 2.0:
            return SubsystemDegradation(
                subsystem=SubsystemType.IGNITION_COMBUSTION,
                component_name="Top Compression Rings & Cylinder Bore",
                health_percentage=100.0,
                cumulative_stress_hours=cumulative_hours,
                degradation_metric="Archard Sliding Distance Wear Index",
                rul_hours_estimate=None,
                rul_uncertainty_interval=None,
                status=DegradationStatus.INSUFFICIENT_DATA,
                assumptions=[
                    "Cross-hatch plateau honing intact; ring gap set to specification.",
                ],
                required_data=[
                    "Minimum 2.0 hours of operating history.",
                    "Cylinder leak-down percentage or compression test baseline.",
                ],
            )

        # Baseline design life: 4,000 hours
        design_life_hrs = 4000.0

        # Mean piston speed Up = 2 * stroke * (RPM / 60)
        stroke_m = self.engine.specifications.stroke_mm / 1000.0
        mean_piston_speed = 2.0 * stroke_m * (mean_rpm / 60.0)

        # Reference piston speed at rated RPM
        ref_piston_speed = 2.0 * stroke_m * (self.engine.specifications.rated_power_rpm / 60.0)
        speed_factor = (mean_piston_speed / max(1.0, ref_piston_speed)) ** 1.3

        load_factor = 0.5 + 0.5 * mean_throttle

        equiv_hours = cumulative_hours * speed_factor * load_factor
        damage = min(1.0, equiv_hours / design_life_hrs)
        health_pct = round(max(0.0, (1.0 - damage) * 100.0), 1)

        remaining_equiv = max(0.0, design_life_hrs - equiv_hours)
        rul_estimate = round(remaining_equiv / max(0.1, speed_factor * load_factor), 1)
        uncertainty = (round(rul_estimate * 0.82, 1), round(rul_estimate * 1.18, 1))

        return SubsystemDegradation(
            subsystem=SubsystemType.IGNITION_COMBUSTION,
            component_name="Top Compression Rings & Cylinder Bore",
            health_percentage=health_pct,
            cumulative_stress_hours=round(equiv_hours, 2),
            degradation_metric="Archard Sliding Distance Wear Index",
            rul_hours_estimate=rul_estimate,
            rul_uncertainty_interval=uncertainty,
            status=DegradationStatus.SUFFICIENT_DATA,
            assumptions=[
                "Sliding contact follows Archard wear model (Wear volume ~ Normal load * Sliding distance).",
                "Combustion chamber maintains adequate top ring land lubrication.",
                "No severe detonation/knock causing ring fracture.",
            ],
            required_data=[
                "Periodic cylinder compression differential measurements.",
                "Crankcase blow-by pressure telemetry.",
            ],
        )

    def estimate_cooling_system_degradation(
        self,
        cumulative_hours: float,
        mean_coolant_temp_c: float,
    ) -> SubsystemDegradation:
        """Estimate radiator core fouling and cooling jacket thermal scale accumulation."""
        if math.isnan(cumulative_hours) or math.isinf(cumulative_hours) or cumulative_hours < 0.0:
            cumulative_hours = 0.0
        if math.isnan(mean_coolant_temp_c) or math.isinf(mean_coolant_temp_c):
            mean_coolant_temp_c = 90.0

        if cumulative_hours < 2.0:
            return SubsystemDegradation(
                subsystem=SubsystemType.COOLING,
                component_name="Radiator Core & Thermal Heat Exchanger",
                health_percentage=100.0,
                cumulative_stress_hours=cumulative_hours,
                degradation_metric="Radiator Heat Transfer Effectiveness UA Decay",
                rul_hours_estimate=None,
                rul_uncertainty_interval=None,
                status=DegradationStatus.INSUFFICIENT_DATA,
                assumptions=[
                    "50/50 ethylene glycol / deionized water mixture maintained.",
                ],
                required_data=[
                    "Minimum 2.0 operating hours with thermal load history.",
                ],
            )

        design_life_hrs = 5000.0
        thermal_stress = 1.0 + 0.015 * max(0.0, mean_coolant_temp_c - 95.0)
        equiv_hours = cumulative_hours * thermal_stress
        damage = min(1.0, equiv_hours / design_life_hrs)
        health_pct = round(max(0.0, (1.0 - damage) * 100.0), 1)

        remaining_equiv = max(0.0, design_life_hrs - equiv_hours)
        rul_estimate = round(remaining_equiv / max(0.1, thermal_stress), 1)
        uncertainty = (round(rul_estimate * 0.88, 1), round(rul_estimate * 1.12, 1))

        return SubsystemDegradation(
            subsystem=SubsystemType.COOLING,
            component_name="Radiator Core & Thermal Heat Exchanger",
            health_percentage=health_pct,
            cumulative_stress_hours=round(equiv_hours, 2),
            degradation_metric="Radiator Heat Transfer Effectiveness UA Decay",
            rul_hours_estimate=rul_estimate,
            rul_uncertainty_interval=uncertainty,
            status=DegradationStatus.SUFFICIENT_DATA,
            assumptions=[
                "Scale resistance builds at 0.0002 m²·K/W per 1,000 equivalent thermal hours.",
                "External fin clogging is cleared during scheduled routine turnarounds.",
            ],
            required_data=[
                "Coolant inlet vs outlet temperature differential sensor pair.",
                "Coolant pH and glycol refraction concentration readings.",
            ],
        )
