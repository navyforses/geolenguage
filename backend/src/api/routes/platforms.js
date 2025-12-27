const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validate, slugValidator } = require('../../utils/validators');
const PlatformService = require('../../services/PlatformService');
const RealDataService = require('../../services/RealDataService');
const cache = require('../../utils/cache');

/**
 * GET /api/platforms
 * Get all platforms with optional filtering
 */
router.get('/',
    query('category').optional().isString(),
    query('parent_company').optional().isString(),
    validate,
    async (req, res, next) => {
        try {
            const { category, parent_company } = req.query;

            // Try cache first
            const cacheKey = `platforms:${category || 'all'}:${parent_company || 'all'}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const platforms = await PlatformService.getAllPlatforms({
                category,
                parent_company
            });

            await cache.set(cacheKey, platforms, 300); // 5 min cache
            res.json(platforms);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/:slug
 * Get single platform with current metrics
 */
router.get('/:slug',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;

            const platform = await PlatformService.getPlatformBySlug(slug);
            if (!platform) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            // Get current metrics
            const metrics = await PlatformService.getCurrentMetrics(platform.id);

            res.json({
                ...platform,
                metrics
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/:slug/metrics
 * Get platform metrics with time range
 */
router.get('/:slug/metrics',
    param('slug').custom(slugValidator),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('type').optional().isString(),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const { from, to, type } = req.query;

            const platform = await PlatformService.getPlatformBySlug(slug);
            if (!platform) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            const metrics = await PlatformService.getMetricsHistory(platform.id, {
                from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                to: to ? new Date(to) : new Date(),
                type
            });

            res.json(metrics);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/:slug/historical
 * Get historical data for a platform
 */
router.get('/:slug/historical',
    param('slug').custom(slugValidator),
    query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
    query('metric_type').optional().isString(),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const days = req.query.days || 90;
            const metricType = req.query.metric_type;

            const platform = await PlatformService.getPlatformBySlug(slug);
            if (!platform) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            const historical = await PlatformService.getHistoricalData(platform.id, days, metricType);
            res.json(historical);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/platforms/compare
 * Compare multiple platforms (max 4)
 */
router.post('/compare',
    async (req, res, next) => {
        try {
            const { slugs, metrics } = req.body;

            if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 4) {
                return res.status(400).json({
                    error: 'Please provide 2-4 platform slugs to compare'
                });
            }

            const comparison = await PlatformService.comparePlatforms(slugs, metrics);
            res.json(comparison);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/:slug/refresh
 * Manually trigger data refresh for a platform
 */
router.get('/:slug/refresh',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;

            const platform = await PlatformService.getPlatformBySlug(slug);
            if (!platform) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            const result = await PlatformService.refreshPlatformData(platform.id);
            res.json({
                message: 'Data refresh initiated',
                platform: slug,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// REAL DATA ENDPOINTS (Live API Data)
// ============================================

/**
 * GET /api/platforms/live/all
 * Get real-time data for all platforms from APIs
 */
router.get('/live/all',
    async (req, res, next) => {
        try {
            const data = await RealDataService.getAllPlatformsData();
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                platforms: data
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/live/dashboard
 * Get dashboard summary with real data
 */
router.get('/live/dashboard',
    async (req, res, next) => {
        try {
            const data = await RealDataService.getDashboardData();
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                data
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/live/feed
 * Get live feed of updates
 */
router.get('/live/feed',
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const limit = req.query.limit || 20;
            const feed = await RealDataService.getLiveFeed(limit);
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                feed
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/live/:slug
 * Get real-time data for a specific platform
 */
router.get('/live/:slug',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const data = await RealDataService.getPlatformData(slug);
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                ...data
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/platforms/live/:slug/history
 * Get historical stock data for a platform
 */
router.get('/live/:slug/history',
    param('slug').custom(slugValidator),
    query('range').optional().isIn(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y']),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const range = req.query.range || '1mo';
            const data = await RealDataService.getHistoricalData(slug, range);
            res.json({
                success: true,
                platform: slug,
                range,
                data
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/platforms/live/:slug/refresh
 * Force refresh data for a platform
 */
router.post('/live/:slug/refresh',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const data = await RealDataService.refreshPlatform(slug);
            res.json({
                success: true,
                message: 'მონაცემები განახლდა',
                ...data
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
