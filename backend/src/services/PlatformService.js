/**
 * Platform Service
 * Handles platform data operations
 */

const cache = require('../utils/cache');
const logger = require('../utils/logger');
const DataCollector = require('./DataCollector');

// Platform definitions
const PLATFORMS = [
    {
        id: 1,
        name: 'Google Search',
        slug: 'google',
        category: 'search',
        parent_company: 'Alphabet Inc.',
        ticker_symbol: 'GOOGL',
        sec_cik: '0001652044',
        logo_url: 'https://www.google.com/favicon.ico',
        website_url: 'https://www.google.com',
        founded_year: 1998,
        headquarters: 'Mountain View, CA'
    },
    {
        id: 2,
        name: 'YouTube',
        slug: 'youtube',
        category: 'video',
        parent_company: 'Alphabet Inc.',
        ticker_symbol: 'GOOGL',
        sec_cik: '0001652044',
        logo_url: 'https://www.youtube.com/favicon.ico',
        website_url: 'https://www.youtube.com',
        founded_year: 2005,
        headquarters: 'San Bruno, CA'
    },
    {
        id: 3,
        name: 'Facebook',
        slug: 'facebook',
        category: 'social',
        parent_company: 'Meta Platforms Inc.',
        ticker_symbol: 'META',
        sec_cik: '0001326801',
        logo_url: 'https://www.facebook.com/favicon.ico',
        website_url: 'https://www.facebook.com',
        founded_year: 2004,
        headquarters: 'Menlo Park, CA'
    },
    {
        id: 4,
        name: 'Instagram',
        slug: 'instagram',
        category: 'social',
        parent_company: 'Meta Platforms Inc.',
        ticker_symbol: 'META',
        sec_cik: '0001326801',
        logo_url: 'https://www.instagram.com/favicon.ico',
        website_url: 'https://www.instagram.com',
        founded_year: 2010,
        headquarters: 'Menlo Park, CA'
    },
    {
        id: 5,
        name: 'ChatGPT',
        slug: 'chatgpt',
        category: 'ai',
        parent_company: 'OpenAI',
        ticker_symbol: null,
        sec_cik: null,
        logo_url: 'https://chat.openai.com/favicon.ico',
        website_url: 'https://chat.openai.com',
        founded_year: 2022,
        headquarters: 'San Francisco, CA'
    },
    {
        id: 6,
        name: 'Amazon',
        slug: 'amazon',
        category: 'ecommerce',
        parent_company: 'Amazon.com Inc.',
        ticker_symbol: 'AMZN',
        sec_cik: '0001018724',
        logo_url: 'https://www.amazon.com/favicon.ico',
        website_url: 'https://www.amazon.com',
        founded_year: 1994,
        headquarters: 'Seattle, WA'
    },
    {
        id: 7,
        name: 'X (Twitter)',
        slug: 'twitter',
        category: 'social',
        parent_company: 'X Corp.',
        ticker_symbol: null,
        sec_cik: null,
        logo_url: 'https://twitter.com/favicon.ico',
        website_url: 'https://twitter.com',
        founded_year: 2006,
        headquarters: 'San Francisco, CA'
    },
    {
        id: 8,
        name: 'TikTok',
        slug: 'tiktok',
        category: 'video',
        parent_company: 'ByteDance',
        ticker_symbol: null,
        sec_cik: null,
        logo_url: 'https://www.tiktok.com/favicon.ico',
        website_url: 'https://www.tiktok.com',
        founded_year: 2016,
        headquarters: 'Los Angeles, CA'
    },
    {
        id: 9,
        name: 'Reddit',
        slug: 'reddit',
        category: 'social',
        parent_company: 'Reddit Inc.',
        ticker_symbol: 'RDDT',
        sec_cik: '0001713445',
        logo_url: 'https://www.reddit.com/favicon.ico',
        website_url: 'https://www.reddit.com',
        founded_year: 2005,
        headquarters: 'San Francisco, CA'
    },
    {
        id: 10,
        name: 'LinkedIn',
        slug: 'linkedin',
        category: 'professional',
        parent_company: 'Microsoft Corp.',
        ticker_symbol: 'MSFT',
        sec_cik: '0000789019',
        logo_url: 'https://www.linkedin.com/favicon.ico',
        website_url: 'https://www.linkedin.com',
        founded_year: 2002,
        headquarters: 'Sunnyvale, CA'
    }
];

class PlatformService {
    /**
     * Get all platforms with optional filtering
     */
    async getAllPlatforms(filters = {}) {
        let platforms = [...PLATFORMS];

        if (filters.category) {
            platforms = platforms.filter(p => p.category === filters.category);
        }

        if (filters.parent_company) {
            platforms = platforms.filter(p =>
                p.parent_company?.toLowerCase().includes(filters.parent_company.toLowerCase())
            );
        }

        // Add current metrics to each platform
        const platformsWithMetrics = await Promise.all(
            platforms.map(async (platform) => {
                const metrics = await this.getCurrentMetrics(platform.id);
                return { ...platform, metrics };
            })
        );

        return platformsWithMetrics;
    }

    /**
     * Get platform by slug
     */
    async getPlatformBySlug(slug) {
        return PLATFORMS.find(p => p.slug === slug) || null;
    }

    /**
     * Get platform by ID
     */
    async getPlatformById(id) {
        return PLATFORMS.find(p => p.id === id) || null;
    }

    /**
     * Get current metrics for a platform
     */
    async getCurrentMetrics(platformId) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return {};

        const cacheKey = `platform:${platform.slug}:latest`;
        const cached = await cache.get(cacheKey);

        if (cached?.metrics) {
            return cached.metrics;
        }

        // Return realistic mock data based on platform
        return this.getMockMetrics(platform);
    }

    /**
     * Generate realistic mock metrics for demo
     */
    getMockMetrics(platform) {
        const mockData = {
            'google': {
                stock_price: { value: 141.80, change: 2.34, changePercent: 1.68 },
                market_cap: '1.78T',
                sentiment: { score: 0.72, label: 'Bullish' },
                daily_users: '8.5B searches/day',
                market_share: '91.4%',
                revenue_growth: '+8.7%'
            },
            'youtube': {
                stock_price: { value: 141.80, change: 2.34, changePercent: 1.68 },
                monthly_users: '2.7B',
                sentiment: { score: 0.58, label: 'Positive' },
                daily_views: '5B videos/day',
                creator_payouts: '$50B total',
                premium_subs: '100M+'
            },
            'facebook': {
                stock_price: { value: 594.20, change: -3.15, changePercent: -0.53 },
                market_cap: '1.51T',
                sentiment: { score: 0.31, label: 'Neutral' },
                daily_users: '2.11B DAU',
                ad_revenue: '$135B/year',
                engagement: '-2.3% YoY'
            },
            'instagram': {
                stock_price: { value: 594.20, change: -3.15, changePercent: -0.53 },
                monthly_users: '2.35B',
                sentiment: { score: 0.65, label: 'Positive' },
                stories_daily: '500M users',
                reels_growth: '+48% YoY',
                creator_accounts: '200M+'
            },
            'chatgpt': {
                monthly_users: '200M+',
                sentiment: { score: 0.85, label: 'Very Bullish' },
                api_calls: '100B+/month',
                enterprise_clients: '92% Fortune 500',
                growth_rate: '+340% YoY',
                valuation: '$157B'
            },
            'amazon': {
                stock_price: { value: 227.10, change: 4.52, changePercent: 2.03 },
                market_cap: '2.37T',
                sentiment: { score: 0.61, label: 'Bullish' },
                prime_members: '200M+',
                aws_revenue: '$100B/year',
                market_share: '37.6% e-commerce'
            },
            'twitter': {
                monthly_users: '611M',
                sentiment: { score: -0.15, label: 'Mixed' },
                daily_tweets: '500M',
                ad_revenue: '-40% YoY',
                blue_subs: '1.3M',
                valuation: '$19B (private)'
            },
            'tiktok': {
                monthly_users: '1.58B',
                sentiment: { score: 0.78, label: 'Very Positive' },
                daily_time: '95 min avg',
                creator_fund: '$2B',
                us_ban_risk: 'High',
                growth_rate: '+16% YoY'
            },
            'reddit': {
                stock_price: { value: 168.45, change: 8.23, changePercent: 5.14 },
                market_cap: '$28.5B',
                sentiment: { score: 0.52, label: 'Positive' },
                daily_users: '82M DAU',
                communities: '100K+ active',
                ipo_performance: '+220% since IPO'
            },
            'linkedin': {
                stock_price: { value: 446.30, change: 1.89, changePercent: 0.43 },
                monthly_users: '1B',
                sentiment: { score: 0.44, label: 'Neutral' },
                job_posts: '15M active',
                premium_revenue: '$1.7B/quarter',
                engagement: '+22% YoY'
            }
        };

        const data = mockData[platform.slug] || {};

        return {
            ...data,
            last_updated: new Date().toISOString(),
            data_source: 'aggregated'
        };
    }

    /**
     * Get metrics history for a platform
     */
    async getMetricsHistory(platformId, options = {}) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return [];

        const days = Math.ceil((options.to - options.from) / (24 * 60 * 60 * 1000)) || 30;
        const history = [];
        const basePrice = this.getBasePrice(platform.slug);
        const baseSentiment = this.getBaseSentiment(platform.slug);

        for (let i = 0; i < days; i++) {
            const date = new Date(options.from.getTime() + i * 24 * 60 * 60 * 1000);
            // Create realistic trending data with some volatility
            const trend = Math.sin(i / 10) * 5 + (i / days) * 10;
            const noise = (Math.random() - 0.5) * 3;

            history.push({
                date: date.toISOString().split('T')[0],
                metrics: {
                    stock_price: basePrice + trend + noise,
                    sentiment: Math.max(-1, Math.min(1, baseSentiment + (Math.random() - 0.5) * 0.3)),
                    engagement: Math.floor(1000000 + trend * 50000 + Math.random() * 200000)
                }
            });
        }

        return history;
    }

    /**
     * Get base stock price for platform
     */
    getBasePrice(slug) {
        const prices = {
            'google': 138, 'youtube': 138, 'facebook': 590, 'instagram': 590,
            'amazon': 220, 'linkedin': 440, 'reddit': 155, 'chatgpt': 0,
            'twitter': 0, 'tiktok': 0
        };
        return prices[slug] || 100;
    }

    /**
     * Get base sentiment for platform
     */
    getBaseSentiment(slug) {
        const sentiments = {
            'google': 0.7, 'youtube': 0.55, 'facebook': 0.3, 'instagram': 0.6,
            'chatgpt': 0.85, 'amazon': 0.6, 'twitter': -0.1, 'tiktok': 0.75,
            'reddit': 0.5, 'linkedin': 0.4
        };
        return sentiments[slug] || 0.5;
    }

    /**
     * Get historical data
     */
    async getHistoricalData(platformId, days = 90, metricType = null) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return [];

        const data = [];
        const now = new Date();
        const basePrice = this.getBasePrice(platform.slug);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            // Create realistic stock-like movement
            const trend = ((days - i) / days) * 15; // Gradual upward trend
            const weekly = Math.sin(i / 7 * Math.PI) * 3; // Weekly cycle
            const noise = (Math.random() - 0.5) * 4; // Daily noise

            data.push({
                date: date.toISOString().split('T')[0],
                value: basePrice + trend + weekly + noise,
                metric_type: metricType || 'stock_price'
            });
        }

        return data;
    }

    /**
     * Compare multiple platforms
     */
    async comparePlatforms(slugs, metricTypes = []) {
        const platforms = slugs
            .map(slug => PLATFORMS.find(p => p.slug === slug))
            .filter(Boolean);

        if (platforms.length < 2) {
            throw new Error('Need at least 2 valid platforms to compare');
        }

        const comparison = {
            platforms: [],
            metrics: {},
            generated_at: new Date().toISOString()
        };

        for (const platform of platforms) {
            const metrics = await this.getCurrentMetrics(platform.id);
            comparison.platforms.push({
                ...platform,
                metrics
            });
        }

        // Calculate comparative metrics
        comparison.metrics = {
            market_cap_comparison: platforms.map(p => ({
                platform: p.slug,
                has_public_stock: !!p.ticker_symbol
            })),
            category_breakdown: platforms.reduce((acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + 1;
                return acc;
            }, {})
        };

        return comparison;
    }

    /**
     * Refresh platform data
     */
    async refreshPlatformData(platformId) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) {
            throw new Error('Platform not found');
        }

        // Trigger data collection for this platform
        const sources = this.getSourcesForPlatform(platform.slug);
        const result = await DataCollector.collectFromSources(sources, `refresh_${platform.slug}`);

        return {
            platform: platform.slug,
            sources_updated: sources,
            result
        };
    }

    /**
     * Get data sources for a platform
     */
    getSourcesForPlatform(slug) {
        const sourceMap = {
            'google': ['alphaVantage', 'pytrends', 'redditApi', 'hackerNews', 'secEdgar'],
            'youtube': ['youtubeApi', 'pytrends', 'redditApi'],
            'facebook': ['alphaVantage', 'pytrends', 'redditApi', 'secEdgar'],
            'instagram': ['pytrends', 'redditApi'],
            'chatgpt': ['pytrends', 'redditApi', 'hackerNews', 'githubApi'],
            'amazon': ['alphaVantage', 'pytrends', 'redditApi', 'secEdgar'],
            'twitter': ['pytrends', 'redditApi', 'hackerNews'],
            'tiktok': ['pytrends', 'redditApi'],
            'reddit': ['alphaVantage', 'redditApi', 'secEdgar'],
            'linkedin': ['alphaVantage', 'pytrends', 'secEdgar']
        };

        return sourceMap[slug] || ['pytrends', 'redditApi'];
    }

    /**
     * Get categories
     */
    getCategories() {
        const categories = [...new Set(PLATFORMS.map(p => p.category))];
        return categories.map(cat => ({
            slug: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            count: PLATFORMS.filter(p => p.category === cat).length
        }));
    }

    /**
     * Get parent companies
     */
    getParentCompanies() {
        const companies = [...new Set(PLATFORMS.map(p => p.parent_company).filter(Boolean))];
        return companies.map(company => ({
            name: company,
            platforms: PLATFORMS.filter(p => p.parent_company === company).map(p => p.slug)
        }));
    }
}

module.exports = new PlatformService();
