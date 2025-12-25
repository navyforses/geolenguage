const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validate } = require('../../utils/validators');
const PlatformService = require('../../services/PlatformService');
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
    param('slug').isSlug(),
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
    param('slug').isSlug(),
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
    param('slug').isSlug(),
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
    param('slug').isSlug(),
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

module.exports = router;
