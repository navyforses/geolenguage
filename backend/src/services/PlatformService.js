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

        // Return default metrics if no cached data
        return {
            status: 'pending_update',
            message: 'Metrics collection in progress'
        };
    }

    /**
     * Get metrics history for a platform
     */
    async getMetricsHistory(platformId, options = {}) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return [];

        // For MVP, return simulated historical data
        const days = Math.ceil((options.to - options.from) / (24 * 60 * 60 * 1000));
        const history = [];

        for (let i = 0; i < days; i++) {
            const date = new Date(options.from.getTime() + i * 24 * 60 * 60 * 1000);
            history.push({
                date: date.toISOString().split('T')[0],
                metrics: {
                    stock_price: 100 + Math.random() * 50,
                    sentiment: Math.random() * 2 - 1,
                    engagement: Math.floor(Math.random() * 1000000)
                }
            });
        }

        return history;
    }

    /**
     * Get historical data
     */
    async getHistoricalData(platformId, days = 90, metricType = null) {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (!platform) return [];

        const data = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.random() * 100,
                metric_type: metricType || 'aggregate'
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
