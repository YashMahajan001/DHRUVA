-- ==============================================================================
-- SIH26054 Digital Twin UAV - PostgreSQL Database Schema
-- Ownership: Gaurav + Diya (Backend & Database Team)
-- ==============================================================================

-- 1. Engine Models Table (Specifications & Design Limits)
CREATE TABLE IF NOT EXISTS engine_models (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_rpm INTEGER NOT NULL,
    max_temperature DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Engines Table (Physical Fleet UAV Engines)
CREATE TABLE IF NOT EXISTS engines (
    id VARCHAR(50) PRIMARY KEY,
    engine_model_id VARCHAR(50) NOT NULL REFERENCES engine_models(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, IDLE, MAINTENANCE, FAULT
    total_hours DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Telemetry Table (Time-Series Sensor Readings)
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL PRIMARY KEY,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    rpm DOUBLE PRECISION NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    oil_pressure DOUBLE PRECISION NOT NULL,
    fuel_flow DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION NOT NULL,
    throttle DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_engine_time ON telemetry (engine_id, timestamp DESC);

-- 4. Digital Twin States Table (State Estimations & Health Predictions)
CREATE TABLE IF NOT EXISTS twin_states (
    id BIGSERIAL PRIMARY KEY,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    health_score DOUBLE PRECISION NOT NULL,
    health_status VARCHAR(50) NOT NULL, -- GOOD, WARNING, CRITICAL
    predicted_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_twin_states_engine_time ON twin_states (engine_id, timestamp DESC);

-- 5. Faults Table (Injected and Detected Anomalies)
CREATE TABLE IF NOT EXISTS faults (
    id BIGSERIAL PRIMARY KEY,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    fault_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faults_engine_time ON faults (engine_id, timestamp DESC);

-- 6. Missions Table (Flight Profiles & Execution Records)
CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    mission_type VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, ABORTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_missions_engine ON missions (engine_id);

-- 7. Tune Profiles Table (Engine Calibration & Custom Parameter Maps)
CREATE TABLE IF NOT EXISTS tune_profiles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    parameters JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tune_profiles_engine ON tune_profiles (engine_id);

-- 8. Maintenance Table (Work Orders, Health Checks & Logged Actions)
CREATE TABLE IF NOT EXISTS maintenance (
    id BIGSERIAL PRIMARY KEY,
    engine_id VARCHAR(50) NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_engine ON maintenance (engine_id);
