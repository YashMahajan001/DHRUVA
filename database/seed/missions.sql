-- ==============================================================================
-- Seed Data: Sample Missions
-- ==============================================================================

INSERT INTO missions (id, name, engine_id, mission_type, start_time, end_time, status, created_at)
VALUES 
    ('MSN-001', 'High Altitude ISR Alpha', 'ENG001', 'high_altitude_isr', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'COMPLETED', CURRENT_TIMESTAMP),
    ('MSN-002', 'Border Patrol Long Endurance', 'ENG002', 'long_endurance', CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL, 'IN_PROGRESS', CURRENT_TIMESTAMP),
    ('MSN-003', 'Coastal Rapid Response Recon', 'ENG001', 'rapid_response', CURRENT_TIMESTAMP + INTERVAL '2 hours', NULL, 'PLANNED', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
