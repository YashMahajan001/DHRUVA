-- ==============================================================================
-- Seed Data: Active UAV Fleet Engines
-- ==============================================================================

INSERT INTO engines (id, engine_model_id, name, status, total_hours, created_at)
VALUES 
    ('ENG001', 'MDL-O320', 'Eagle-1 Primary Engine', 'ACTIVE', 142.5, CURRENT_TIMESTAMP),
    ('ENG002', 'MDL-ROTAX914', 'Falcon-2 Surveillance Engine', 'ACTIVE', 88.0, CURRENT_TIMESTAMP),
    ('ENG003', 'MDL-AE300', 'Predator-3 Heavy Endurance Engine', 'IDLE', 210.3, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
