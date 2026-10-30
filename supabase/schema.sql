-- PulseGrid V2 - Database Schema
-- Supabase / PostgreSQL Schema

-- 1. Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PHCs Table (Primary Health Centres across Bengaluru)
CREATE TABLE IF NOT EXISTS phcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone_id TEXT REFERENCES zones(id) ON DELETE CASCADE,
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    country TEXT NOT NULL DEFAULT 'India',
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    contact_phone TEXT,
    operational_hours TEXT DEFAULT '24x7 Emergency / 8am-8pm OPD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'tablets',
    critical_threshold INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PHC Medicine Stock Table
CREATE TABLE IF NOT EXISTS phc_medicine_stock (
    id TEXT PRIMARY KEY,
    phc_id TEXT REFERENCES phcs(id) ON DELETE CASCADE,
    medicine_id TEXT REFERENCES medicines(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    daily_consumption INTEGER NOT NULL DEFAULT 0,
    incoming_quantity INTEGER NOT NULL DEFAULT 0,
    stockout_risk TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    predicted_days_left DOUBLE PRECISION DEFAULT 14.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(phc_id, medicine_id)
);

-- 5. Bed Occupancy Table
CREATE TABLE IF NOT EXISTS bed_occupancy (
    id TEXT PRIMARY KEY,
    phc_id TEXT UNIQUE REFERENCES phcs(id) ON DELETE CASCADE,
    total_beds INTEGER NOT NULL DEFAULT 12,
    occupied_beds INTEGER NOT NULL DEFAULT 0,
    available_beds INTEGER NOT NULL DEFAULT 12,
    occupancy_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    occupancy_trend TEXT NOT NULL DEFAULT 'STABLE', -- RISING, STABLE, DECLINING
    predicted_occupancy_7d DOUBLE PRECISION DEFAULT 50.0,
    high_occupancy_risk TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Operational Events Table
CREATE TABLE IF NOT EXISTS operational_events (
    id TEXT PRIMARY KEY,
    phc_id TEXT REFERENCES phcs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- medicine_consumed, medicine_received, patient_admitted, patient_discharged, shortage_detected, emergency_spike
    details JSONB DEFAULT '{}'::jsonb,
    severity TEXT DEFAULT 'INFO', -- INFO, WARNING, CRITICAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Action Approvals Table (Health Administrator audit log)
CREATE TABLE IF NOT EXISTS action_approvals (
    id TEXT PRIMARY KEY,
    phc_id TEXT REFERENCES phcs(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- EMERGENCY_TRANSFER, EXTERNAL_PROCUREMENT, REALLOCATION
    medicine_name TEXT,
    source_name TEXT,
    target_name TEXT,
    quantity INTEGER,
    ai_recommendation_summary TEXT,
    tinyfish_evidence JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_phcs_zone ON phcs(zone_id);
CREATE INDEX IF NOT EXISTS idx_stock_phc ON phc_medicine_stock(phc_id);
CREATE INDEX IF NOT EXISTS idx_stock_med ON phc_medicine_stock(medicine_id);
CREATE INDEX IF NOT EXISTS idx_events_phc ON operational_events(phc_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON operational_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON action_approvals(status);
