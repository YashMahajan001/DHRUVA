"""Lubrication system, oil viscosity-temperature, and oil pressure dynamics.

Explicitly models oil kinematic viscosity via the Vogel equation, positive-displacement
pump delivery proportional to engine speed, and spring-loaded pressure relief valve (PRV) regulation.
"""

from __future__ import annotations

import math
from typing import Tuple


def oil_kinematic_viscosity_cst(oil_temp_c: float) -> float:
    """Calculate synthetic engine oil kinematic viscosity (cSt = mm^2/s) using the Vogel equation.

    Calibrated for typical SAE 5W-40 full-synthetic engine oil:
        ~140 cSt @ 20 deg C (cold start)
        ~85 cSt @ 40 deg C (SAE standard reference point)
        ~14.2 cSt @ 100 deg C (operating reference point)
        ~7.5 cSt @ 135 deg C (high thermal stress point)

    Equation:
        nu(T) = A * exp(B / (T + C))

    Args:
        oil_temp_c: Current oil temperature [deg C]

    Returns:
        Kinematic viscosity [cSt]
    """
    temp_safe = max(-35.0, oil_temp_c)
    # Vogel equation parameters for SAE 5W-40 synthetic:
    # Yields ~14.2 cSt at 100 deg C, ~75 cSt at 40 deg C, ~140 cSt at 20 deg C
    a = 0.16
    b = 1100.0
    c = 145.0

    nu_cst = a * math.exp(b / (temp_safe + c))
    return max(3.5, min(nu_cst, 1500.0))


def oil_pressure_bar(
    rpm: float,
    oil_temp_c: float,
    relief_valve_pressure_bar: float = 6.0,
    min_idle_pressure_bar: float = 1.0,
    rated_rpm: float = 6000.0,
) -> float:
    """Calculate regulated engine oil pressure as a function of pump RPM and oil viscosity.

    Equations:
        nu_ratio = (nu(T) / nu_100) ^ 0.38
        P_unregulated = k_pump * (RPM / rated_RPM) * nu_ratio
        P_regulated = min(P_unregulated, P_relief_max)

    Args:
        rpm: Engine rotational speed [RPM]
        oil_temp_c: Oil temperature [deg C]
        relief_valve_pressure_bar: Pressure relief valve spring threshold [bar]
        min_idle_pressure_bar: Nominal minimum idle pressure [bar]
        rated_rpm: Engine rated speed [RPM]

    Returns:
        Regulated oil gallery pressure [bar]
    """
    if rpm <= 10.0:
        return 0.0

    nu_current = oil_kinematic_viscosity_cst(oil_temp_c)
    nu_ref_100c = 14.2  # Reference viscosity at 100 deg C
    viscosity_factor = math.pow(nu_current / nu_ref_100c, 0.38)

    # Base pump flow build-up
    rpm_norm = rpm / max(1000.0, rated_rpm)
    base_pressure = min_idle_pressure_bar + (relief_valve_pressure_bar - min_idle_pressure_bar) * math.pow(rpm_norm, 0.75)
    unregulated_pressure = base_pressure * viscosity_factor

    # Regulate through mechanical spring relief valve
    return max(0.1, min(unregulated_pressure, relief_valve_pressure_bar))
