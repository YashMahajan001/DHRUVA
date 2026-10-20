"""Deterministic physics-based engine simulation engine.

Integrates continuous engine state over time using explicit equations,
SI units, enforced operating limits, and input validation.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict

from auto_engine.catalog.models import EngineCatalogEntry, FuelType
from auto_engine.catalog.registry import engine_catalog
from auto_engine.physics.constants import (
    P_STD_PA,
    AFR_STOICH_GASOLINE,
    AFR_STOICH_DIESEL,
    AFR_STOICH_AVGAS,
)
from auto_engine.physics.airflow import (
    ambient_conditions,
    volumetric_efficiency,
    manifold_absolute_pressure,
    update_turbo_boost,
    air_mass_flow,
)
from auto_engine.physics.combustion import (
    target_air_fuel_ratio,
    fuel_flow_rate,
    indicated_thermal_efficiency,
    indicated_output,
)
from auto_engine.physics.mechanics import (
    friction_mean_effective_pressure,
    friction_torque,
    brake_torque_and_power,
    brake_specific_fuel_consumption,
    integrate_rotational_speed,
)
from auto_engine.physics.thermodynamics import (
    heat_rejection_partitioning,
    update_temperatures,
    exhaust_gas_temperature,
    cylinder_head_temperature,
)
from auto_engine.physics.lubrication import (
    oil_pressure_bar,
)


class EngineState(BaseModel):
    """Dynamic continuous state vector of the simulated engine."""
    rpm: float = Field(..., ge=0.0, description="Crankshaft rotational speed [RPM]")
    boost_bar: float = Field(0.0, ge=0.0, description="Gauge turbocharger boost pressure [bar]")
    coolant_temp_c: float = Field(..., description="Lumped coolant circuit temperature [deg C]")
    oil_temp_c: float = Field(..., description="Lumped engine oil temperature [deg C]")
    operating_hours: float = Field(0.0, ge=0.0, description="Accumulated engine operating hours [h]")
    total_fuel_consumed_kg: float = Field(0.0, ge=0.0, description="Total fuel consumed [kg]")

    model_config = ConfigDict(extra="forbid")


from pydantic import BaseModel, Field, ConfigDict, field_validator


class SimulationInput(BaseModel):
    """Control and environmental boundary condition inputs for a simulation step."""
    throttle: float = Field(..., ge=0.0, le=1.0, description="Normalized throttle position [0.0 = idle, 1.0 = WOT]")
    load_torque_nm: float = Field(0.0, ge=0.0, description="External resisting load torque [N*m]")
    ambient_temp_c: float = Field(25.0, ge=-50.0, le=60.0, description="Ambient air temperature [deg C]")
    altitude_m: float = Field(0.0, ge=0.0, le=15000.0, description="Operating altitude above sea level [m]")
    dt_s: float = Field(0.02, gt=0.0, le=1.0, description="Time integration step [s]")

    @field_validator("throttle", "load_torque_nm", "ambient_temp_c", "altitude_m", "dt_s")
    @classmethod
    def validate_finite(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Input value must be a finite real number (not NaN or Inf).")
        return v

    model_config = ConfigDict(extra="forbid")


class SimulationOutput(BaseModel):
    """Deterministic snapshot output resulting from a simulation step."""
    timestamp: datetime = Field(..., description="UTC timestamp of the simulated timepoint")
    engine_id: str
    operating_state: str = Field(..., description="Operating classification (IDLE, PART_LOAD, FULL_LOAD, REV_LIMITING, OVERHEAT)")
    rpm: float = Field(..., description="Engine speed [RPM]")
    brake_torque_nm: float = Field(..., description="Net brake output torque [N*m]")
    brake_power_kw: float = Field(..., description="Net brake power output [kW]")
    brake_power_hp: float = Field(..., description="Net brake power output [HP]")
    indicated_power_kw: float = Field(..., description="Indicated combustion power [kW]")
    friction_power_kw: float = Field(..., description="Internal friction power loss [kW]")
    fuel_mass_flow_kg_s: float = Field(..., description="Fuel mass flow rate [kg/s]")
    fuel_flow_lph: float = Field(..., description="Volumetric fuel flow rate [L/h]")
    air_mass_flow_kg_s: float = Field(..., description="Inducted air mass flow rate [kg/s]")
    bsfc_g_kwh: float = Field(..., description="Brake Specific Fuel Consumption [g/(kW*h)]")
    manifold_pressure_kpa: float = Field(..., description="Manifold Absolute Pressure [kPa]")
    boost_pressure_bar: float = Field(..., description="Gauge boost pressure [bar]")
    volumetric_efficiency: float = Field(..., description="Volumetric efficiency [-]")
    air_fuel_ratio: float = Field(..., description="Air-Fuel Ratio [-]")
    coolant_temp_c: float = Field(..., description="Coolant temperature [deg C]")
    oil_temp_c: float = Field(..., description="Oil temperature [deg C]")
    oil_pressure_bar: float = Field(..., description="Regulated oil pressure [bar]")
    egt_c: float = Field(..., description="Exhaust Gas Temperature [deg C]")
    cht_c: float = Field(..., description="Cylinder Head Temperature [deg C]")
    total_fuel_consumed_kg: float = Field(..., description="Total fuel mass consumed [kg]")
    is_rev_limiting: bool = False
    is_idle_governing: bool = False
    provenance: Dict[str, str] = Field(default_factory=dict, description="Provenance label for each simulated metric")


class DeterministicEngineSimulator:
    """Modular, deterministic physics-based engine simulation instance."""

    def __init__(self, catalog_entry: EngineCatalogEntry, initial_state: Optional[EngineState] = None) -> None:
        self.engine = catalog_entry
        self._displacement_m3 = (self.engine.specifications.displacement_cc) * 1e-6

        # Determine stoichiometric AFR based on fuel type
        if self.engine.fuel_type in (FuelType.DIESEL_EN590, FuelType.JET_A1):
            self._base_afr = AFR_STOICH_DIESEL
            self._is_diesel = True
        elif self.engine.fuel_type == FuelType.AVGAS_100LL:
            self._base_afr = AFR_STOICH_AVGAS
            self._is_diesel = False
        else:
            self._base_afr = AFR_STOICH_GASOLINE
            self._is_diesel = False

        if initial_state:
            self.state = initial_state
        else:
            self.reset()

    def reset(self, initial_rpm: Optional[float] = None, initial_temp_c: float = 25.0) -> None:
        """Reset engine state to clean baseline condition."""
        rpm = initial_rpm if initial_rpm is not None else self.engine.operating_limits.idle_rpm
        self.state = EngineState(
            rpm=float(rpm),
            boost_bar=0.0,
            coolant_temp_c=initial_temp_c,
            oil_temp_c=initial_temp_c,
            operating_hours=0.0,
            total_fuel_consumed_kg=0.0,
        )

    def step(self, inputs: SimulationInput) -> SimulationOutput:
        """Execute one deterministic physics integration step with adaptive sub-stepping.

        If dt_s > 0.025s, breaks integration into stable sub-steps to guarantee
        Euler convergence, energy conservation, and dynamic stability.
        """
        dt = inputs.dt_s
        MAX_SUBSTEP_S = 0.025
        if dt > MAX_SUBSTEP_S:
            num_substeps = int(math.ceil(dt / MAX_SUBSTEP_S))
            sub_dt = dt / num_substeps
            sub_input = SimulationInput(
                throttle=inputs.throttle,
                load_torque_nm=inputs.load_torque_nm,
                ambient_temp_c=inputs.ambient_temp_c,
                altitude_m=inputs.altitude_m,
                dt_s=sub_dt,
            )
            out: Optional[SimulationOutput] = None
            for _ in range(num_substeps):
                out = self._single_step(sub_input)
            assert out is not None
            return out
        else:
            return self._single_step(inputs)

    def _single_step(self, inputs: SimulationInput) -> SimulationOutput:
        """Execute one atomic physics integration step (dt_s <= 0.025s)."""
        dt = inputs.dt_s
        th = max(0.0, min(inputs.throttle, 1.0))
        current_rpm = max(0.0, self.state.rpm)

        # 1. Atmospheric Boundary Conditions
        p_amb_pa, t_amb_k, rho_amb = ambient_conditions(
            altitude_m=inputs.altitude_m,
            ambient_temp_c=inputs.ambient_temp_c
        )
        ambient_temp_c = t_amb_k - 273.15

        # 2. Turbocharger Boost Integration
        spool_threshold = self.engine.operating_limits.idle_rpm * 1.5
        new_boost_bar = update_turbo_boost(
            current_boost_bar=self.state.boost_bar,
            throttle=th,
            rpm=current_rpm,
            max_boost_bar=self.engine.simulation_parameters.max_boost_pressure_bar,
            spool_rpm_threshold=spool_threshold,
            rated_rpm=self.engine.specifications.rated_power_rpm,
            time_constant_s=self.engine.simulation_parameters.turbo_lag_time_constant_s,
            dt_s=dt,
        )

        # 3. Intake Manifold Absolute Pressure (MAP)
        map_pa = manifold_absolute_pressure(
            throttle=th,
            ambient_pressure_pa=p_amb_pa,
            current_boost_bar=new_boost_bar,
        )
        # Enforce maximum safe manifold pressure limit
        max_map_pa = self.engine.operating_limits.max_manifold_pressure_bar * 100000.0
        map_pa = min(map_pa, max_map_pa)

        # 4. Volumetric Efficiency & Inducted Air Mass Flow
        eta_v = volumetric_efficiency(
            rpm=current_rpm,
            peak_torque_rpm=(self.engine.specifications.peak_torque_rpm_min + self.engine.specifications.peak_torque_rpm_max) / 2.0,
            redline_rpm=self.engine.operating_limits.redline_rpm,
            eta_v_peak=self.engine.simulation_parameters.volumetric_efficiency_peak,
        )
        m_dot_air = air_mass_flow(
            displacement_m3=self._displacement_m3,
            rpm=current_rpm,
            map_pa=map_pa,
            intake_temp_k=t_amb_k,
            volumetric_eff=eta_v,
        )

        # Closed-loop idle air control (IAC): maintain minimum idle airflow
        is_idle_governing = False
        if current_rpm <= self.engine.operating_limits.idle_rpm and th < 0.25:
            is_idle_governing = True
            deficit = (self.engine.operating_limits.idle_rpm - current_rpm) / max(1.0, self.engine.operating_limits.idle_rpm)
            th = max(th, 0.08 + 0.35 * max(0.0, deficit))

        # 5. Air-Fuel Ratio & Fuel Mass Flow (with rev-limiter fuel cut)
        is_rev_limiting = current_rpm >= self.engine.operating_limits.redline_rpm
        if is_rev_limiting:
            target_afr = self._base_afr
            m_dot_fuel = 0.0
            v_dot_lph = 0.0
            eta_ind = 0.0
            p_ind_w = 0.0
            t_ind_nm = 0.0
            imep_pa = 0.0
        else:
            target_afr = target_air_fuel_ratio(
                throttle=th,
                boost_bar=new_boost_bar,
                base_afr=self._base_afr,
                is_diesel=self._is_diesel,
            )
            m_dot_fuel, v_dot_lph = fuel_flow_rate(
                air_mass_flow_kg_s=m_dot_air,
                target_afr=target_afr,
                fuel_density_kg_l=self.engine.fuel_density_kg_l,
            )
            # 6. Combustion & Indicated Work
            eta_ind = indicated_thermal_efficiency(
                compression_ratio=self.engine.specifications.compression_ratio,
                rpm=current_rpm,
                rated_rpm=self.engine.specifications.rated_power_rpm,
            )
            p_ind_w, t_ind_nm, imep_pa = indicated_output(
                fuel_mass_flow_kg_s=m_dot_fuel,
                fuel_lhv_mj_kg=self.engine.fuel_lhv_mj_kg,
                indicated_efficiency=eta_ind,
                rpm=current_rpm,
                displacement_m3=self._displacement_m3,
            )

        # 7. Internal Friction (Chen-Flynn FMEP) & Net Brake Torque
        fmep_pa = friction_mean_effective_pressure(rpm=current_rpm, imep_pa=imep_pa)
        t_fric_nm = friction_torque(fmep_pa=fmep_pa, displacement_m3=self._displacement_m3)
        t_brake_nm, p_brake_w, p_brake_kw = brake_torque_and_power(
            indicated_torque_nm=t_ind_nm,
            friction_torque_nm=t_fric_nm,
            rpm=current_rpm,
        )
        p_fric_kw = (t_fric_nm * (2.0 * math.pi * current_rpm / 60.0)) / 1000.0

        # 8. Brake Specific Fuel Consumption (BSFC)
        bsfc = brake_specific_fuel_consumption(
            fuel_mass_flow_kg_s=m_dot_fuel,
            brake_power_kw=p_brake_kw,
        )

        # 9. Rotational Dynamics & Speed Integration
        new_rpm, is_rev_limiting, is_idle_governing = integrate_rotational_speed(
            current_rpm=current_rpm,
            brake_torque_nm=t_brake_nm,
            load_torque_nm=inputs.load_torque_nm,
            inertia_kg_m2=self.engine.simulation_parameters.rotational_inertia_kg_m2,
            idle_rpm=self.engine.operating_limits.idle_rpm,
            redline_rpm=self.engine.operating_limits.redline_rpm,
            dt_s=dt,
        )

        # 10. Thermal Integration (Heat Rejection & Temperatures)
        q_exh_w, q_cool_w, q_oil_w, _ = heat_rejection_partitioning(
            fuel_mass_flow_kg_s=m_dot_fuel,
            fuel_lhv_mj_kg=self.engine.fuel_lhv_mj_kg,
            indicated_power_w=p_ind_w,
            friction_power_w=p_fric_kw * 1000.0,
        )
        new_coolant_c, new_oil_c = update_temperatures(
            current_coolant_temp_c=self.state.coolant_temp_c,
            current_oil_temp_c=self.state.oil_temp_c,
            ambient_temp_c=ambient_temp_c,
            q_dot_coolant_w=q_cool_w,
            q_dot_oil_w=q_oil_w,
            c_coolant_j_k=self.engine.simulation_parameters.thermal_capacitance_coolant_j_k,
            c_oil_j_k=self.engine.simulation_parameters.thermal_capacitance_oil_j_k,
            radiator_coeff_w_k=self.engine.simulation_parameters.radiator_cooling_coeff_w_k,
            oil_cooler_coeff_w_k=self.engine.simulation_parameters.oil_cooler_coeff_w_k,
            dt_s=dt,
        )

        egt_c = exhaust_gas_temperature(
            ambient_temp_c=ambient_temp_c,
            q_dot_exhaust_w=q_exh_w,
            exhaust_mass_flow_kg_s=(m_dot_air + m_dot_fuel),
            max_egt_limit_c=self.engine.operating_limits.max_egt_c,
        )
        load_ratio = p_brake_kw / max(1.0, self.engine.specifications.rated_power_kw)
        cht_c = cylinder_head_temperature(
            coolant_temp_c=new_coolant_c,
            engine_load_ratio=load_ratio,
        )

        # 11. Lubrication & Oil Pressure
        oil_press_bar = oil_pressure_bar(
            rpm=new_rpm,
            oil_temp_c=new_oil_c,
            relief_valve_pressure_bar=self.engine.operating_limits.max_oil_pressure_bar,
            min_idle_pressure_bar=self.engine.operating_limits.min_oil_pressure_idle_bar,
            rated_rpm=self.engine.specifications.rated_power_rpm,
        )

        # 12. Determine Operating State Classification
        if is_rev_limiting:
            op_state = "REV_LIMITING"
        elif new_coolant_c > self.engine.operating_limits.max_coolant_temp_c or new_oil_c > self.engine.operating_limits.max_oil_temp_c:
            op_state = "OVERHEAT"
        elif new_rpm < self.engine.operating_limits.min_operating_rpm:
            op_state = "STALL"
        elif th <= 0.05 and new_rpm <= self.engine.operating_limits.idle_rpm * 1.15:
            op_state = "IDLE"
        elif th > 0.85:
            op_state = "FULL_LOAD"
        else:
            op_state = "PART_LOAD"

        # Update Internal State
        fuel_consumed_this_step_kg = m_dot_fuel * dt
        self.state = EngineState(
            rpm=new_rpm,
            boost_bar=new_boost_bar,
            coolant_temp_c=new_coolant_c,
            oil_temp_c=new_oil_c,
            operating_hours=self.state.operating_hours + (dt / 3600.0),
            total_fuel_consumed_kg=self.state.total_fuel_consumed_kg + fuel_consumed_this_step_kg,
        )

        # Provenance mapping for telemetry integrity
        provenance_dict = {
            "rpm": "SIMULATED",
            "brake_torque_nm": "CALCULATED",
            "brake_power_kw": "CALCULATED",
            "fuel_flow_lph": "CALCULATED",
            "air_mass_flow_kg_s": "SIMULATED",
            "manifold_pressure_kpa": "SIMULATED",
            "boost_pressure_bar": "SIMULATED",
            "coolant_temp_c": "SIMULATED",
            "oil_temp_c": "SIMULATED",
            "oil_pressure_bar": "SIMULATED",
            "egt_c": "SIMULATED",
            "cht_c": "SIMULATED",
        }

        return SimulationOutput(
            timestamp=datetime.now(timezone.utc),
            engine_id=self.engine.engine_id,
            operating_state=op_state,
            rpm=round(new_rpm, 1),
            brake_torque_nm=round(t_brake_nm, 2),
            brake_power_kw=round(p_brake_kw, 2),
            brake_power_hp=round(p_brake_kw / 0.7457, 2),
            indicated_power_kw=round(p_ind_w / 1000.0, 2),
            friction_power_kw=round(p_fric_kw, 2),
            fuel_mass_flow_kg_s=round(m_dot_fuel, 6),
            fuel_flow_lph=round(v_dot_lph, 2),
            air_mass_flow_kg_s=round(m_dot_air, 5),
            bsfc_g_kwh=round(bsfc, 1),
            manifold_pressure_kpa=round(map_pa / 1000.0, 2),
            boost_pressure_bar=round(new_boost_bar, 3),
            volumetric_efficiency=round(eta_v, 4),
            air_fuel_ratio=round(target_afr, 2),
            coolant_temp_c=round(new_coolant_c, 2),
            oil_temp_c=round(new_oil_c, 2),
            oil_pressure_bar=round(oil_press_bar, 2),
            egt_c=round(egt_c, 1),
            cht_c=round(cht_c, 1),
            total_fuel_consumed_kg=round(self.state.total_fuel_consumed_kg, 4),
            is_rev_limiting=is_rev_limiting,
            is_idle_governing=is_idle_governing,
            provenance=provenance_dict,
        )

    def run_cycle(self, inputs: List[SimulationInput]) -> List[SimulationOutput]:
        """Execute a batch of sequential time series simulation steps."""
        results: List[SimulationOutput] = []
        for inp in inputs:
            results.append(self.step(inp))
        return results
