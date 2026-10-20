"""Physical constants and standard atmospheric reference values."""

# Standard Atmospheric Conditions (ISA at Sea Level)
P_STD_PA: float = 101325.0       # Standard sea-level pressure [Pa]
P_STD_KPA: float = 101.325       # Standard sea-level pressure [kPa]
P_STD_BAR: float = 1.01325       # Standard sea-level pressure [bar]
T_STD_K: float = 288.15          # Standard sea-level temperature [K] (15 deg C)
T_STD_C: float = 15.0            # Standard sea-level temperature [deg C]
R_AIR: float = 287.058           # Specific gas constant for dry air [J/(kg*K)]
R_UNIVERSAL: float = 8.314462    # Universal gas constant [J/(mol*K)]
GAMMA_AIR: float = 1.40          # Ratio of specific heats for ambient air [-]
GAMMA_EXHAUST: float = 1.33      # Ratio of specific heats for combustion products [-]

# Specific Heat Capacities [J/(kg*K)]
CP_AIR: float = 1005.0           # Isobaric specific heat of air [J/(kg*K)]
CP_EXHAUST: float = 1150.0       # Isobaric specific heat of exhaust gas [J/(kg*K)]
CP_COOLANT: float = 3600.0       # Specific heat of 50/50 water-glycol mixture [J/(kg*K)]
CP_OIL: float = 2100.0           # Specific heat of typical synthetic engine oil [J/(kg*K)]

# Gravitational Acceleration
G_ACCEL: float = 9.80665         # Earth gravitational acceleration [m/s^2]

# Air-Fuel Ratio Stoichiometric Constants
AFR_STOICH_GASOLINE: float = 14.7   # Stoichiometric AFR for standard gasoline
AFR_STOICH_DIESEL: float = 14.5     # Stoichiometric AFR for diesel / Jet-A1
AFR_STOICH_AVGAS: float = 14.8      # Stoichiometric AFR for AVGAS 100LL
