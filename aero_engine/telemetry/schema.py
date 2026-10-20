"""Telemetry schema and data provenance definitions for Dhruva Aero.

Every single telemetry signal strictly carries:
- Signal identifier
- Display name
- Value (or null if unavailable)
- Explicit engineering unit
- Timestamp (UTC ISO-8601)
- Source classification: SIMULATED, MEASURED, CALCULATED, ESTIMATED, UNAVAILABLE
- Category-appropriate scope (Piston vs Turboprop vs Turbofan vs Turbojet)
"""

from __future__ import annotations

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from aero_engine.catalog.models import AeroCategory


class TelemetryProvenance(str, Enum):
    """Rigorous classification of data provenance."""
    SIMULATED = "SIMULATED"
    MEASURED = "MEASURED"
    CALCULATED = "CALCULATED"
    ESTIMATED = "ESTIMATED"
    UNAVAILABLE = "UNAVAILABLE"


class AeroChannelMetadata(BaseModel):
    """Descriptive metadata for an aerospace telemetry signal channel."""
    channel_id: str
    display_name: str
    unit: str
    category: AeroCategory
    provenance_default: TelemetryProvenance
    description: str
    min_nominal: Optional[float] = None
    max_nominal: Optional[float] = None


class TelemetrySignal(BaseModel):
    """Discrete aerospace telemetry data point with full provenance."""
    signal_id: str
    display_name: str
    value: Optional[float] = None
    unit: str
    provenance: TelemetryProvenance = TelemetryProvenance.SIMULATED
    status: str = Field("NORMAL", description="NORMAL, CAUTION, WARNING, or UNAVAILABLE")
    explanation: Optional[str] = None


class AeroTelemetryRecord(BaseModel):
    """Complete, synchronized telemetry frame for Dhruva Aero Digital Twin."""
    engine_id: str
    category: AeroCategory
    timestamp: str
    session_time_s: float
    data_source: TelemetryProvenance = TelemetryProvenance.SIMULATED
    operating_state: str = Field("CRUISE", description="IDLE, TAKEOFF, CLIMB, CRUISE, DESCENT, SHUTDOWN, CUSTOM")
    
    # 1. Piston Engine Signals
    rpm: Optional[float] = Field(None, description="Crankshaft speed [rev/min]")
    map_inhg: Optional[float] = Field(None, description="Manifold absolute pressure [inHg]")
    cht_c: Optional[float] = Field(None, description="Peak cylinder head temperature [deg C]")
    egt_c: Optional[float] = Field(None, description="Exhaust gas temperature [deg C]")
    power_bhp: Optional[float] = Field(None, description="Calculated brake power [BHP]")
    fuel_flow_gph: Optional[float] = Field(None, description="Fuel flow rate [US Gal/h]")
    fuel_press_psi: Optional[float] = Field(None, description="Fuel line pressure [psi]")

    # 2. Turboprop Signals
    ng_pct: Optional[float] = Field(None, description="Gas generator speed Ng [% of 100% rated]")
    np_rpm: Optional[float] = Field(None, description="Propeller governor speed [rev/min]")
    itt_c: Optional[float] = Field(None, description="Inter-turbine temperature [deg C]")
    torque_ft_lb: Optional[float] = Field(None, description="Shaft torque [ft-lb]")
    shp: Optional[float] = Field(None, description="Shaft horsepower [SHP]")

    # 3. Turbofan & Turbojet Signals
    n1_pct: Optional[float] = Field(None, description="Low-pressure spool / fan speed N1 [%]")
    n2_pct: Optional[float] = Field(None, description="High-pressure spool speed N2 [%]")
    spool_n_pct: Optional[float] = Field(None, description="Single-spool speed N for turbojets [%]")
    turbine_egt_c: Optional[float] = Field(None, description="Turbine exhaust gas temperature [deg C]")
    thrust_kn: Optional[float] = Field(None, description="Net thrust [kN]")
    thrust_lbf: Optional[float] = Field(None, description="Net thrust [lbf]")
    fuel_flow_kgh: Optional[float] = Field(None, description="Fuel mass flow [kg/h]")
    epr: Optional[float] = Field(None, description="Engine pressure ratio Pt7/Pt2")
    bypass_ratio_calc: Optional[float] = Field(None, description="Operational bypass ratio")
    nozzle_press_ratio: Optional[float] = Field(None, description="Exhaust nozzle pressure ratio")

    # Common Core Lubrication & Dynamics
    oil_press_psi: Optional[float] = Field(None, description="Oil gallery pressure [psi]")
    oil_temp_c: Optional[float] = Field(None, description="Oil scavenge temperature [deg C]")
    vibration_ips: Optional[float] = Field(None, description="Vibration velocity [in/s]")
    vibration_mils: Optional[float] = Field(None, description="Peak vibration amplitude [mils pk-pk]")

    # Environmental Context
    ambient_temp_c: float = Field(15.0, description="Ambient air static temperature [deg C]")
    ambient_press_kpa: float = Field(101.325, description="Ambient static pressure [kPa]")
    altitude_m: float = Field(0.0, description="Barometric pressure altitude [m]")
    mach: float = Field(0.0, description="Flight Mach number")

    # Signal detail dictionary with unit and provenance per channel
    signals: Dict[str, TelemetrySignal] = Field(default_factory=dict)
