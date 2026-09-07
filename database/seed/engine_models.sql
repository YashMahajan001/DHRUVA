-- ==============================================================================
-- Seed Data: Engine Models
-- Reference engine specifications: Lycoming O-320, Rotax 914, Austro Engine AE300
-- ==============================================================================

INSERT INTO engine_models (id, name, manufacturer, model, type, max_rpm, max_temperature, created_at)
VALUES 
    ('MDL-O320', 'Lycoming O-320-D2J', 'Lycoming', 'O-320', '4-Cylinder Horizontally Opposed', 2700, 260.0, CURRENT_TIMESTAMP),
    ('MDL-ROTAX914', 'Rotax 914 F/UL', 'BRP-Rotax', '914', '4-Cylinder Turbocharged', 5800, 135.0, CURRENT_TIMESTAMP),
    ('MDL-AE300', 'Austro Engine AE300', 'Austro Engine', 'AE300', '4-Cylinder Inline Turbo Diesel', 3880, 140.0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
