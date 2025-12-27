-- =====================================================
-- Digital Oligopoly Forecast - Seed Data
-- Version: 2.0
-- =====================================================

-- ===== PLATFORMS =====
INSERT INTO platforms (name, slug, category, parent_company, ticker_symbol, sec_cik, website_url, founded_year, headquarters, description) VALUES
('Google Search', 'google', 'search', 'Alphabet Inc.', 'GOOGL', '0001652044', 'https://www.google.com', 1998, 'Mountain View, CA', 'World''s largest search engine, handling over 8.5 billion searches per day'),
('YouTube', 'youtube', 'video', 'Alphabet Inc.', 'GOOGL', '0001652044', 'https://www.youtube.com', 2005, 'San Bruno, CA', 'World''s largest video sharing platform with over 2 billion monthly users'),
('Facebook', 'facebook', 'social', 'Meta Platforms Inc.', 'META', '0001326801', 'https://www.facebook.com', 2004, 'Menlo Park, CA', 'Leading social network with nearly 3 billion monthly active users'),
('Instagram', 'instagram', 'social', 'Meta Platforms Inc.', 'META', '0001326801', 'https://www.instagram.com', 2010, 'Menlo Park, CA', 'Photo and video sharing platform with over 2 billion monthly users'),
('ChatGPT', 'chatgpt', 'ai', 'OpenAI', NULL, NULL, 'https://chat.openai.com', 2022, 'San Francisco, CA', 'Revolutionary AI chatbot that reached 100 million users in 2 months'),
('Amazon', 'amazon', 'ecommerce', 'Amazon.com Inc.', 'AMZN', '0001018724', 'https://www.amazon.com', 1994, 'Seattle, WA', 'World''s largest e-commerce and cloud computing company'),
('X (Twitter)', 'twitter', 'social', 'X Corp.', NULL, NULL, 'https://twitter.com', 2006, 'San Francisco, CA', 'Real-time social media platform for news and public discourse'),
('TikTok', 'tiktok', 'video', 'ByteDance', NULL, NULL, 'https://www.tiktok.com', 2016, 'Los Angeles, CA', 'Short-form video platform with over 1 billion monthly active users'),
('Reddit', 'reddit', 'social', 'Reddit Inc.', 'RDDT', '0001713445', 'https://www.reddit.com', 2005, 'San Francisco, CA', 'Community-driven discussion platform with millions of active communities'),
('LinkedIn', 'linkedin', 'professional', 'Microsoft Corp.', 'MSFT', '0000789019', 'https://www.linkedin.com', 2002, 'Sunnyvale, CA', 'Professional networking platform with over 900 million members')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    parent_company = EXCLUDED.parent_company,
    ticker_symbol = EXCLUDED.ticker_symbol,
    sec_cik = EXCLUDED.sec_cik,
    website_url = EXCLUDED.website_url,
    description = EXCLUDED.description;

-- ===== SAMPLE METRICS =====
-- Note: In production, these would be populated by the data collection service

-- Stock prices (as of seed date)
INSERT INTO platform_metrics (platform_id, metric_type, metric_value, metric_unit, source, recorded_at) VALUES
((SELECT id FROM platforms WHERE slug = 'google'), 'stock_price', 175.50, 'USD', 'alpha_vantage', NOW()),
((SELECT id FROM platforms WHERE slug = 'facebook'), 'stock_price', 485.20, 'USD', 'alpha_vantage', NOW()),
((SELECT id FROM platforms WHERE slug = 'amazon'), 'stock_price', 185.75, 'USD', 'alpha_vantage', NOW()),
((SELECT id FROM platforms WHERE slug = 'linkedin'), 'stock_price', 425.80, 'USD', 'alpha_vantage', NOW()),
((SELECT id FROM platforms WHERE slug = 'reddit'), 'stock_price', 125.30, 'USD', 'alpha_vantage', NOW());

-- Sentiment scores
INSERT INTO platform_metrics (platform_id, metric_type, metric_value, metric_unit, source, recorded_at) VALUES
((SELECT id FROM platforms WHERE slug = 'google'), 'sentiment_score', 0.65, 'score', 'reddit_api', NOW()),
((SELECT id FROM platforms WHERE slug = 'youtube'), 'sentiment_score', 0.45, 'score', 'reddit_api', NOW()),
((SELECT id FROM platforms WHERE slug = 'facebook'), 'sentiment_score', -0.15, 'score', 'reddit_api', NOW()),
((SELECT id FROM platforms WHERE slug = 'chatgpt'), 'sentiment_score', 0.78, 'score', 'reddit_api', NOW()),
((SELECT id FROM platforms WHERE slug = 'tiktok'), 'sentiment_score', 0.35, 'score', 'reddit_api', NOW()),
((SELECT id FROM platforms WHERE slug = 'twitter'), 'sentiment_score', -0.25, 'score', 'reddit_api', NOW());

-- ===== SAMPLE FORECASTS =====
INSERT INTO forecasts (platform_id, forecast_type, time_horizon, prediction_value, confidence_score, methodology, data_sources, ai_reasoning) VALUES
((SELECT id FROM platforms WHERE slug = 'google'), 'revenue', '30d',
 '{"value": 85000000000, "unit": "USD", "change_percent": 5.2, "direction": "up"}',
 0.75, 'ai_analysis', ARRAY['sec_edgar', 'alpha_vantage', 'pytrends'],
 'Strong advertising revenue growth driven by AI integration and cloud services expansion'),

((SELECT id FROM platforms WHERE slug = 'chatgpt'), 'traffic', '30d',
 '{"value": 200000000, "unit": "monthly_visits", "change_percent": 15, "direction": "up"}',
 0.68, 'ai_analysis', ARRAY['pytrends', 'reddit_api', 'hackernews'],
 'Continued rapid user adoption expected as new features are released'),

((SELECT id FROM platforms WHERE slug = 'tiktok'), 'risk', '30d',
 '{"value": 72, "unit": "risk_score", "change_percent": 10, "direction": "up"}',
 0.82, 'ai_analysis', ARRAY['pytrends', 'reddit_api', 'hackernews'],
 'Elevated regulatory risk due to ongoing legislative discussions in multiple countries');

-- ===== SAMPLE ALERTS =====
INSERT INTO alerts (platform_id, alert_type, severity, title, description, trigger_value, source) VALUES
((SELECT id FROM platforms WHERE slug = 'google'), 'price_change', 'medium',
 'GOOGL up 3.2% on AI announcements',
 'Alphabet stock rose following announcements of new AI features in Google Search',
 '{"symbol": "GOOGL", "change": 3.2, "price": 175.50}', 'alpha_vantage'),

((SELECT id FROM platforms WHERE slug = 'chatgpt'), 'trend_shift', 'high',
 'ChatGPT trending globally',
 'Significant increase in search interest and social media mentions',
 '{"search_interest": 95, "reddit_mentions": 1250}', 'pytrends'),

((SELECT id FROM platforms WHERE slug = 'tiktok'), 'risk_warning', 'high',
 'TikTok regulatory concerns',
 'New legislation proposed that may affect platform operations',
 '{"topic": "regulation", "severity": "high"}', 'hackernews'),

((SELECT id FROM platforms WHERE slug = 'twitter'), 'news', 'low',
 'X announces new features',
 'Platform updates include enhanced video capabilities',
 '{"source": "company_announcement"}', 'reddit_api');

-- ===== DEMO USER =====
-- Password: demo123456 (hashed with bcrypt, cost 10)
INSERT INTO users (email, password_hash, name, subscription_tier, email_verified) VALUES
('demo@digitaloligopoly.app', '$2a$10$rQnM1.5FxUHvKzCvL6ZU0u9UKRM3gX6qQwZXkVNEhqPZWEj6DPhOy', 'Demo User', 'premium', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Demo user preferences
INSERT INTO user_preferences (user_id, watched_platforms, alert_frequency, email_notifications)
SELECT id, ARRAY(SELECT id FROM platforms WHERE slug IN ('google', 'chatgpt', 'amazon')), 'daily', TRUE
FROM users WHERE email = 'demo@digitaloligopoly.app'
ON CONFLICT (user_id) DO NOTHING;

-- ===== HISTORICAL DATA SAMPLE =====
-- Generate 30 days of sample historical data for Google stock price
INSERT INTO historical_data (platform_id, date, metric_type, value, source)
SELECT
    (SELECT id FROM platforms WHERE slug = 'google'),
    CURRENT_DATE - (n || ' days')::interval,
    'stock_price',
    150 + (random() * 30)::numeric(10,2),
    'alpha_vantage'
FROM generate_series(1, 30) n
ON CONFLICT (platform_id, date, metric_type, source) DO NOTHING;

-- ===== VERIFICATION =====
DO $$
BEGIN
    RAISE NOTICE 'Seed completed:';
    RAISE NOTICE '  - Platforms: %', (SELECT COUNT(*) FROM platforms);
    RAISE NOTICE '  - Metrics: %', (SELECT COUNT(*) FROM platform_metrics);
    RAISE NOTICE '  - Forecasts: %', (SELECT COUNT(*) FROM forecasts);
    RAISE NOTICE '  - Alerts: %', (SELECT COUNT(*) FROM alerts);
    RAISE NOTICE '  - Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE '  - Historical records: %', (SELECT COUNT(*) FROM historical_data);
END $$;
