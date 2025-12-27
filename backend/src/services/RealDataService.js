/**
 * Real Data Service
 * Aggregates data from multiple free APIs
 * Provides unified interface for platform metrics
 */

const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Import integrations
const yahooFinance = require('../integrations/yahooFinance');
const redditApi = require('../integrations/redditApi');
const finnhub = require('../integrations/finnhub');

// Cache TTL in seconds
const CACHE_TTL = {
    STOCK: 300,      // 5 minutes for stock data
    SENTIMENT: 600,  // 10 minutes for sentiment
    NEWS: 900        // 15 minutes for news
};

// Platform configuration
const PLATFORMS = {
    'google': {
        ticker: 'GOOGL',
        name: 'Google Search',
        hasStock: true,
        subreddits: ['google', 'GooglePixel']
    },
    'youtube': {
        ticker: 'GOOGL',
        name: 'YouTube',
        hasStock: true,
        subreddits: ['youtube', 'youtubers']
    },
    'facebook': {
        ticker: 'META',
        name: 'Facebook',
        hasStock: true,
        subreddits: ['facebook']
    },
    'instagram': {
        ticker: 'META',
        name: 'Instagram',
        hasStock: true,
        subreddits: ['Instagram']
    },
    'chatgpt': {
        ticker: null,
        name: 'ChatGPT',
        hasStock: false,
        subreddits: ['ChatGPT', 'OpenAI']
    },
    'amazon': {
        ticker: 'AMZN',
        name: 'Amazon',
        hasStock: true,
        subreddits: ['amazon', 'amazonprime']
    },
    'twitter': {
        ticker: null,
        name: 'X (Twitter)',
        hasStock: false,
        subreddits: ['Twitter']
    },
    'tiktok': {
        ticker: null,
        name: 'TikTok',
        hasStock: false,
        subreddits: ['TikTok']
    },
    'reddit': {
        ticker: 'RDDT',
        name: 'Reddit',
        hasStock: true,
        subreddits: ['TheoryOfReddit']
    },
    'linkedin': {
        ticker: 'MSFT',
        name: 'LinkedIn',
        hasStock: true,
        subreddits: ['linkedin']
    }
};

class RealDataService {
    constructor() {
        this.lastFetch = {};
        this.cachedData = {};
    }

    /**
     * Get all data for a specific platform
     */
    async getPlatformData(platformSlug) {
        const platform = PLATFORMS[platformSlug];
        if (!platform) {
            throw new Error(`Unknown platform: ${platformSlug}`);
        }

        const cacheKey = `realdata:${platformSlug}`;
        const cached = await cache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const data = {
            platform: platformSlug,
            name: platform.name,
            lastUpdated: new Date().toISOString(),
            stock: null,
            sentiment: null,
            news: [],
            social: null
        };

        // Fetch stock data if available
        if (platform.hasStock && platform.ticker) {
            try {
                data.stock = await yahooFinance.getQuote(platform.ticker);
                logger.info(`✓ Stock data for ${platformSlug}: $${data.stock.price}`);
            } catch (error) {
                logger.warn(`Stock fetch failed for ${platformSlug}:`, error.message);
            }
        }

        // Fetch Reddit sentiment
        try {
            const redditData = await redditApi.getPlatformSentiment(platformSlug);
            data.social = {
                reddit: {
                    sentiment: redditData.sentiment,
                    posts: redditData.posts.slice(0, 5),
                    totalPosts: redditData.totalPosts
                }
            };
            data.sentiment = this.calculateOverallSentiment(data);
            logger.info(`✓ Reddit sentiment for ${platformSlug}: ${data.social.reddit.sentiment.score.toFixed(2)}`);
        } catch (error) {
            logger.warn(`Reddit fetch failed for ${platformSlug}:`, error.message);
        }

        // Fetch news from Finnhub (if API key is configured)
        if (platform.ticker && process.env.FINNHUB_API_KEY) {
            try {
                const news = await finnhub.getCompanyNews(platform.ticker);
                data.news = news.slice(0, 5);
                logger.info(`✓ News for ${platformSlug}: ${news.length} articles`);
            } catch (error) {
                logger.warn(`News fetch failed for ${platformSlug}:`, error.message);
            }
        }

        // Cache the result
        await cache.set(cacheKey, data, CACHE_TTL.STOCK);

        return data;
    }

    /**
     * Calculate overall sentiment from multiple sources
     */
    calculateOverallSentiment(data) {
        const scores = [];
        const weights = [];

        // Reddit sentiment (weight: 40%)
        if (data.social?.reddit?.sentiment?.score !== undefined) {
            scores.push(data.social.reddit.sentiment.score);
            weights.push(0.4);
        }

        // Stock performance sentiment (weight: 60%)
        if (data.stock?.changePercent !== undefined) {
            // Convert stock change to sentiment (-5% to +5% maps to -1 to +1)
            const stockSentiment = Math.max(-1, Math.min(1, data.stock.changePercent / 5));
            scores.push(stockSentiment);
            weights.push(0.6);
        }

        if (scores.length === 0) {
            return { score: 0, label: 'ნეიტრალური', confidence: 0 };
        }

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const weightedScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;

        return {
            score: parseFloat(weightedScore.toFixed(2)),
            label: this.getSentimentLabel(weightedScore),
            confidence: Math.min(scores.length / 2, 1)
        };
    }

    /**
     * Get sentiment label in Georgian
     */
    getSentimentLabel(score) {
        if (score >= 0.5) return 'ძალიან ზრდადი';
        if (score >= 0.2) return 'ზრდადი';
        if (score >= -0.2) return 'ნეიტრალური';
        if (score >= -0.5) return 'კლებადი';
        return 'ძალიან კლებადი';
    }

    /**
     * Get all platforms data
     */
    async getAllPlatformsData() {
        const results = {};

        await Promise.all(
            Object.keys(PLATFORMS).map(async (slug) => {
                try {
                    results[slug] = await this.getPlatformData(slug);
                } catch (error) {
                    logger.error(`Failed to fetch ${slug}:`, error.message);
                    results[slug] = this.getFallbackData(slug);
                }
            })
        );

        return results;
    }

    /**
     * Get quick overview for dashboard
     */
    async getDashboardData() {
        const platforms = await this.getAllPlatformsData();

        return Object.entries(platforms).map(([slug, data]) => ({
            slug,
            name: data.name,
            stock: data.stock ? {
                price: data.stock.price,
                change: data.stock.change,
                changePercent: data.stock.changePercent
            } : null,
            sentiment: data.sentiment,
            lastUpdated: data.lastUpdated
        }));
    }

    /**
     * Get live feed items from all sources
     */
    async getLiveFeed(limit = 20) {
        const feed = [];
        const platforms = await this.getAllPlatformsData();

        for (const [slug, data] of Object.entries(platforms)) {
            // Add stock updates
            if (data.stock) {
                feed.push({
                    type: 'stock',
                    platform: slug,
                    platformName: data.name,
                    title: `${data.name} აქცია: $${data.stock.price.toFixed(2)}`,
                    description: `${data.stock.changePercent >= 0 ? '+' : ''}${data.stock.changePercent.toFixed(2)}% ცვლილება`,
                    sentiment: data.stock.changePercent >= 0 ? 'positive' : 'negative',
                    timestamp: data.lastUpdated
                });
            }

            // Add news items
            if (data.news && data.news.length > 0) {
                data.news.slice(0, 2).forEach(article => {
                    feed.push({
                        type: 'news',
                        platform: slug,
                        platformName: data.name,
                        title: article.headline,
                        description: article.summary?.substring(0, 100) + '...',
                        url: article.url,
                        source: article.source,
                        timestamp: article.publishedAt
                    });
                });
            }

            // Add social mentions
            if (data.social?.reddit?.posts?.length > 0) {
                const topPost = data.social.reddit.posts[0];
                feed.push({
                    type: 'social',
                    platform: slug,
                    platformName: data.name,
                    title: `Reddit: ${topPost.title.substring(0, 60)}...`,
                    description: `${topPost.score} upvotes • ${topPost.numComments} კომენტარი`,
                    url: topPost.permalink,
                    timestamp: topPost.created
                });
            }
        }

        // Sort by timestamp and limit
        return feed
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Fallback data when API fails
     */
    getFallbackData(slug) {
        const platform = PLATFORMS[slug];
        return {
            platform: slug,
            name: platform?.name || slug,
            lastUpdated: new Date().toISOString(),
            stock: null,
            sentiment: { score: 0, label: 'ნეიტრალური', confidence: 0 },
            news: [],
            social: null,
            isOffline: true
        };
    }

    /**
     * Force refresh data for a platform
     */
    async refreshPlatform(platformSlug) {
        const cacheKey = `realdata:${platformSlug}`;
        await cache.del(cacheKey);
        return this.getPlatformData(platformSlug);
    }

    /**
     * Get historical stock data
     */
    async getHistoricalData(platformSlug, range = '1mo') {
        const platform = PLATFORMS[platformSlug];
        if (!platform?.ticker) {
            return [];
        }

        try {
            return await yahooFinance.getHistoricalData(platform.ticker, range);
        } catch (error) {
            logger.error(`Historical data failed for ${platformSlug}:`, error.message);
            return [];
        }
    }
}

module.exports = new RealDataService();
