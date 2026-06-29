-- Phase 2: TimescaleDB Setup
-- Ensure the TimescaleDB extension is enabled
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert Trades table to a hypertable
-- 'exitTime' is used as the time partitioning column as it represents when the trade concluded
SELECT create_hypertable('Trade', 'exitTime', if_not_exists => TRUE, migrate_data => TRUE);

-- Convert DailyAnchor table to a hypertable
-- 'date' is used as the time partitioning column
SELECT create_hypertable('DailyAnchor', 'date', if_not_exists => TRUE, migrate_data => TRUE);

-- Create necessary indexes for time-series analytics (if not already existing)
CREATE INDEX IF NOT EXISTS ix_trade_user_exittime ON "Trade"("userId", "exitTime" DESC);
CREATE INDEX IF NOT EXISTS ix_dailyanchor_phase_date ON "DailyAnchor"("phaseAccountId", "date" DESC);
