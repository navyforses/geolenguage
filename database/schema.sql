-- =====================================================
-- Digital Oligopoly Forecast - Database Schema
-- Version: 2.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== PLATFORMS =====
CREATE TABLE IF NOT EXISTS platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),                    -- 'search', 'social', 'ecommerce', 'ai', 'video', 'professional'
    parent_company VARCHAR(100),             -- 'Alphabet', 'Meta', etc.
    ticker_symbol VARCHAR(10),               -- 'GOOGL', 'META', etc.
    sec_cik VARCHAR(20),                     -- SEC CIK number
    logo_url TEXT,
    website_url TEXT,
    founded_year INT,
    headquarters VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_platforms_category ON platforms(category);
CREATE INDEX idx_platforms_ticker ON platforms(ticker_symbol);

-- ===== REAL-TIME METRICS =====
CREATE TABLE IF NOT EXISTS platform_metrics (
    id BIGSERIAL PRIMARY KEY,
    platform_id INT REFERENCES platforms(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,        -- 'stock_price', 'search_interest', 'sentiment', etc.
    metric_value DECIMAL(20,4),
    metric_unit VARCHAR(20),                 -- 'USD', 'percent', 'count', etc.
    source VARCHAR(50) NOT NULL,             -- 'alpha_vantage', 'pytrends', etc.
    source_url TEXT,
    confidence DECIMAL(3,2),                 -- 0.00 to 1.00
    metadata JSONB,                          -- Additional data
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX idx_metrics_platform ON platform_metrics(platform_id);
CREATE INDEX idx_metrics_type ON platform_metrics(metric_type);
CREATE INDEX idx_metrics_recorded ON platform_metrics(recorded_at DESC);
CREATE INDEX idx_metrics_platform_type_time ON platform_metrics(platform_id, metric_type, recorded_at DESC);

-- ===== FORECASTS =====
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES platforms(id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL,      -- 'traffic', 'revenue', 'sentiment', 'risk', 'strategic'
    time_horizon VARCHAR(20),                -- '7d', '30d', '90d', '1y'
    prediction_date DATE,                    -- Date the forecast is for
    prediction_value JSONB NOT NULL,         -- {"value": 100, "unit": "M", "range": {"low": 90, "high": 110}}
    confidence_score DECIMAL(3,2),           -- 0.00 to 1.00
    methodology VARCHAR(50),                 -- 'ai_analysis', 'algorithmic', 'hybrid'
    data_sources TEXT[],                     -- ['sec_edgar', 'alpha_vantage', ...]
    ai_reasoning TEXT,                       -- Claude's explanation
    created_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for forecast queries
CREATE INDEX idx_forecasts_platform ON forecasts(platform_id);
CREATE INDEX idx_forecasts_type ON forecasts(forecast_type);
CREATE INDEX idx_forecasts_active ON forecasts(is_active, valid_until);
CREATE INDEX idx_forecasts_created ON forecasts(created_at DESC);

-- ===== ALERTS =====
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES platforms(id) ON DELETE CASCADE,
    alert_type VARCHAR(50),                  -- 'price_change', 'news', 'trend_shift', 'anomaly', 'risk_warning'
    severity VARCHAR(20),                    -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_value JSONB,                     -- What triggered the alert
    source VARCHAR(50),
    source_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for alert queries
CREATE INDEX idx_alerts_platform ON alerts(platform_id);
CREATE INDEX idx_alerts_unread ON alerts(is_read, created_at DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_type ON alerts(alert_type);

-- ===== HISTORICAL DATA =====
CREATE TABLE IF NOT EXISTS historical_data (
    id BIGSERIAL PRIMARY KEY,
    platform_id INT REFERENCES platforms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(20,4),
    metadata JSONB,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(platform_id, date, metric_type, source)
);

-- Indexes for historical queries
CREATE INDEX idx_historical_platform ON historical_data(platform_id);
CREATE INDEX idx_historical_date ON historical_data(date DESC);
CREATE INDEX idx_historical_lookup ON historical_data(platform_id, metric_type, date DESC);

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    subscription_tier VARCHAR(20) DEFAULT 'free',  -- 'free', 'premium', 'enterprise'
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_users_email ON users(email);

-- ===== USER PREFERENCES =====
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    watched_platforms INT[],                  -- platform IDs
    alert_frequency VARCHAR(20) DEFAULT 'instant',  -- 'instant', 'hourly', 'daily', 'weekly'
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ===== USER ALERT SUBSCRIPTIONS =====
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    platform_id INT REFERENCES platforms(id) ON DELETE CASCADE,
    alert_types TEXT[],                       -- ['price_change', 'news', ...]
    min_severity VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, platform_id)
);

-- ===== REPORTS =====
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,         -- 'weekly', 'monthly', 'quarterly', 'custom'
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,                   -- Full report content
    platforms INT[],                          -- Platform IDs included
    period_start DATE,
    period_end DATE,
    generated_by INT REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for report queries
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ===== API USAGE TRACKING =====
CREATE TABLE IF NOT EXISTS api_usage (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,              -- 'alpha_vantage', 'youtube', etc.
    endpoint VARCHAR(255),
    requests_count INT DEFAULT 1,
    success_count INT DEFAULT 0,
    error_count INT DEFAULT 0,
    avg_response_time INT,                    -- milliseconds
    date DATE DEFAULT CURRENT_DATE,

    UNIQUE(source, endpoint, date)
);

-- Index for usage tracking
CREATE INDEX idx_api_usage_source ON api_usage(source, date DESC);

-- ===== DATA COLLECTION JOBS =====
CREATE TABLE IF NOT EXISTS collection_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    sources TEXT[],
    status VARCHAR(20) DEFAULT 'pending',     -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    records_collected INT DEFAULT 0,
    errors JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== TRIGGER: Update updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== VIEWS =====

-- Latest metrics per platform
CREATE OR REPLACE VIEW latest_platform_metrics AS
SELECT DISTINCT ON (platform_id, metric_type)
    platform_id,
    metric_type,
    metric_value,
    metric_unit,
    source,
    recorded_at
FROM platform_metrics
ORDER BY platform_id, metric_type, recorded_at DESC;

-- Active forecasts
CREATE OR REPLACE VIEW active_forecasts AS
SELECT
    f.*,
    p.name as platform_name,
    p.slug as platform_slug
FROM forecasts f
JOIN platforms p ON f.platform_id = p.id
WHERE f.is_active = TRUE
  AND f.valid_until > NOW();

-- Unread alerts
CREATE OR REPLACE VIEW unread_alerts AS
SELECT
    a.*,
    p.name as platform_name,
    p.slug as platform_slug
FROM alerts a
JOIN platforms p ON a.platform_id = p.id
WHERE a.is_read = FALSE
  AND a.is_dismissed = FALSE
ORDER BY a.created_at DESC;

-- ===== INITIAL COMMENTS =====
COMMENT ON TABLE platforms IS 'Digital platforms being tracked (Google, YouTube, Facebook, etc.)';
COMMENT ON TABLE platform_metrics IS 'Real-time metrics collected from various APIs';
COMMENT ON TABLE forecasts IS 'AI-generated forecasts and predictions';
COMMENT ON TABLE alerts IS 'System-generated alerts for significant events';
COMMENT ON TABLE historical_data IS 'Historical time-series data for analysis';
COMMENT ON TABLE users IS 'User accounts';
COMMENT ON TABLE user_preferences IS 'User preferences and settings';
COMMENT ON TABLE reports IS 'Generated reports (weekly, monthly, etc.)';
