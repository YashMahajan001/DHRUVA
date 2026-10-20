"""Physics models package for the Dhruva Auto Engineering Foundation."""

from auto_engine.physics.constants import (
    P_STD_PA,
    P_STD_BAR,
    T_STD_K,
    T_STD_C,
    R_AIR,
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
    oil_kinematic_viscosity_cst,
    oil_pressure_bar,
)

__all__ = [
    "P_STD_PA",
    "P_STD_BAR",
    "T_STD_K",
    "T_STD_C",
    "R_AIR",
    "AFR_STOICH_GASOLINE",
    "AFR_STOICH_DIESEL",
    "AFR_STOICH_AVGAS",
    "ambient_conditions",
    "volumetric_efficiency",
    "manifold_absolute_pressure",
    "update_turbo_boost",
    "air_mass_flow",
    "target_air_fuel_ratio",
    "fuel_flow_rate",
    "indicated_thermal_efficiency",
    "indicated_output",
    "friction_mean_effective_pressure",
    "friction_torque",
    "brake_torque_and_power",
    "brake_specific_fuel_consumption",
    "integrate_rotational_speed",
    "heat_rejection_partitioning",
    "update_temperatures",
    "exhaust_gas_temperature",
    "cylinder_head_temperature",
    "oil_kinematic_viscosity_cst",
    "oil_pressure_bar",
]
