const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { validate } = require('../../utils/validators');
const MetricsService = require('../../services/MetricsService');
const cache = require('../../utils/cache');

/**
 * GET /api/metrics/realtime
 * Get real-time metrics for all platforms
 */
router.get('/realtime',
    async (req, res, next) => {
        try {
            const cacheKey = 'metrics:realtime';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const metrics = await MetricsService.getRealTimeMetrics();

            await cache.set(cacheKey, metrics, 60); // 1 min cache
            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/stocks
 * Get stock prices for public companies
 */
router.get('/stocks',
    async (req, res, next) => {
        try {
            const cacheKey = 'metrics:stocks';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const stocks = await MetricsService.getStockPrices();

            await cache.set(cacheKey, stocks, 300); // 5 min cache
            res.json(stocks);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/trends
 * Get Google Trends data
 */
router.get('/trends',
    query('platforms').optional().isString(),
    query('timeframe').optional().isIn(['now 1-H', 'now 4-H', 'now 1-d', 'now 7-d', 'today 1-m', 'today 3-m']),
    validate,
    async (req, res, next) => {
        try {
            const { platforms, timeframe = 'today 1-m' } = req.query;
            const platformList = platforms ? platforms.split(',') : null;

            const cacheKey = `metrics:trends:${platforms || 'all'}:${timeframe}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const trends = await MetricsService.getGoogleTrends(platformList, timeframe);

            await cache.set(cacheKey, trends, 3600); // 1 hour cache
            res.json(trends);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/sentiment
 * Get aggregated sentiment from Reddit, HN, etc.
 */
router.get('/sentiment',
    query('platform').optional().isString(),
    validate,
    async (req, res, next) => {
        try {
            const { platform } = req.query;

            const cacheKey = `metrics:sentiment:${platform || 'all'}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const sentiment = await MetricsService.getSentimentData(platform);

            await cache.set(cacheKey, sentiment, 900); // 15 min cache
            res.json(sentiment);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/economic
 * Get economic indicators (FRED, World Bank)
 */
router.get('/economic',
    async (req, res, next) => {
        try {
            const cacheKey = 'metrics:economic';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const economic = await MetricsService.getEconomicIndicators();

            await cache.set(cacheKey, economic, 3600); // 1 hour cache
            res.json(economic);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/github
 * Get GitHub activity for tech companies
 */
router.get('/github',
    async (req, res, next) => {
        try {
            const cacheKey = 'metrics:github';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const github = await MetricsService.getGitHubActivity();

            await cache.set(cacheKey, github, 3600); // 1 hour cache
            res.json(github);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/crypto
 * Get crypto market data
 */
router.get('/crypto',
    async (req, res, next) => {
        try {
            const cacheKey = 'metrics:crypto';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const crypto = await MetricsService.getCryptoData();

            await cache.set(cacheKey, crypto, 120); // 2 min cache
            res.json(crypto);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/metrics/youtube
 * Get YouTube trending data
 */
router.get('/youtube',
    query('region').optional().isLength({ min: 2, max: 2 }),
    validate,
    async (req, res, next) => {
        try {
            const { region = 'US' } = req.query;

            const cacheKey = `metrics:youtube:${region}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const youtube = await MetricsService.getYouTubeData(region);

            await cache.set(cacheKey, youtube, 1800); // 30 min cache
            res.json(youtube);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
