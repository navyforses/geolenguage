/**
 * Metrics Service
 * Aggregates and serves metrics from all sources
 */

const integrations = require('../integrations');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class MetricsService {
    /**
     * Get real-time metrics for all platforms
     */
    async getRealTimeMetrics() {
        const metrics = {
            platforms: {},
            global: {},
            updated_at: new Date().toISOString()
        };

        // Try to get cached platform data
        const platformSlugs = ['google', 'youtube', 'facebook', 'instagram', 'chatgpt',
            'amazon', 'twitter', 'tiktok', 'reddit', 'linkedin'];

        for (const slug of platformSlugs) {
            const cached = await cache.get(`platform:${slug}:latest`);
            if (cached?.metrics) {
                metrics.platforms[slug] = cached.metrics;
            } else {
                metrics.platforms[slug] = { status: 'pending' };
            }
        }

        return metrics;
    }

    /**
     * Get stock prices for public companies
     */
    async getStockPrices() {
        try {
            const stocks = await integrations.alphaVantage.fetch();

            const prices = {};
            for (const stock of stocks) {
                if (stock.metricType === 'stock_price') {
                    prices[stock.platformId] = {
                        price: stock.value,
                        data: stock.data
                    };
                }
            }

            return {
                prices,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Stock prices error:', error);
            return { prices: {}, error: error.message };
        }
    }

    /**
     * Get Google Trends data
     */
    async getGoogleTrends(platforms = null, timeframe = 'today 1-m') {
        try {
            const trends = await integrations.pytrends.fetch();

            if (platforms) {
                // Filter to requested platforms
                const filtered = trends.filter(t =>
                    platforms.includes(t.platformId)
                );
                return {
                    trends: filtered,
                    updated_at: new Date().toISOString()
                };
            }

            return {
                trends,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Google Trends error:', error);
            return { trends: [], error: error.message };
        }
    }

    /**
     * Get aggregated sentiment data
     */
    async getSentimentData(platform = null) {
        try {
            const reddit = await integrations.redditApi.fetch();
            const hn = await integrations.hackerNews.fetch();

            const sentiment = {};

            // Process Reddit sentiment
            for (const item of reddit) {
                if (item.metricType === 'reddit_sentiment') {
                    sentiment[item.platformId] = sentiment[item.platformId] || {};
                    sentiment[item.platformId].reddit = item.value;
                }
            }

            // Process HackerNews engagement
            for (const item of hn) {
                if (item.metricType === 'hn_engagement') {
                    sentiment[item.platformId] = sentiment[item.platformId] || {};
                    sentiment[item.platformId].hackernews = item.value;
                }
            }

            // Calculate aggregated sentiment
            for (const plat of Object.keys(sentiment)) {
                const s = sentiment[plat];
                const values = [s.reddit, s.hackernews].filter(v => v !== undefined);
                s.aggregated = values.length > 0
                    ? values.reduce((a, b) => a + b, 0) / values.length
                    : 0;
                s.label = s.aggregated > 0.2 ? 'positive'
                    : s.aggregated < -0.2 ? 'negative' : 'neutral';
            }

            if (platform) {
                return sentiment[platform] || { aggregated: 0, label: 'neutral' };
            }

            return {
                sentiment,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Sentiment data error:', error);
            return { sentiment: {}, error: error.message };
        }
    }

    /**
     * Get economic indicators
     */
    async getEconomicIndicators() {
        try {
            const fred = await integrations.fredApi.fetch();
            const worldBank = await integrations.worldBank.fetch();

            return {
                fred: fred.filter(f => f.platformId === 'economy'),
                worldBank: worldBank.filter(w => w.platformId === 'global'),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Economic indicators error:', error);
            return { fred: [], worldBank: [], error: error.message };
        }
    }

    /**
     * Get GitHub activity
     */
    async getGitHubActivity() {
        try {
            const github = await integrations.githubApi.fetch();

            return {
                trending: github.find(g => g.metricType === 'trending_repos')?.data || [],
                companies: github.filter(g => g.metricType === 'github_activity'),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('GitHub activity error:', error);
            return { trending: [], companies: [], error: error.message };
        }
    }

    /**
     * Get crypto market data
     */
    async getCryptoData() {
        try {
            const crypto = await integrations.coinGecko.fetch();

            return {
                global: crypto.find(c => c.metricType === 'global_market')?.data,
                topCoins: crypto.find(c => c.metricType === 'top_coins')?.data || [],
                trending: crypto.find(c => c.metricType === 'trending_coins')?.data || [],
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Crypto data error:', error);
            return { global: null, topCoins: [], trending: [], error: error.message };
        }
    }

    /**
     * Get YouTube data
     */
    async getYouTubeData(region = 'US') {
        try {
            const youtube = await integrations.youtubeApi.fetch();

            return {
                trendingViews: youtube.find(y => y.metricType === 'trending_views')?.data,
                avgEngagement: youtube.find(y => y.metricType === 'avg_engagement')?.data,
                categories: youtube.find(y => y.metricType === 'category_distribution')?.data,
                region,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('YouTube data error:', error);
            return { error: error.message };
        }
    }

    /**
     * Get comprehensive metrics summary
     */
    async getMetricsSummary() {
        const [stocks, sentiment, crypto] = await Promise.all([
            this.getStockPrices(),
            this.getSentimentData(),
            this.getCryptoData()
        ]);

        return {
            stocks: Object.keys(stocks.prices || {}).length,
            platformsWithSentiment: Object.keys(sentiment.sentiment || {}).length,
            cryptoGlobalMarketCap: crypto.global?.totalMarketCap,
            updated_at: new Date().toISOString()
        };
    }
}

module.exports = new MetricsService();
