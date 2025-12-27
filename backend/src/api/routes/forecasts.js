const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validate, slugValidator } = require('../../utils/validators');
const ForecastService = require('../../services/ForecastService');
const cache = require('../../utils/cache');

/**
 * GET /api/forecasts
 * Get all active forecasts
 */
router.get('/',
    query('platform_id').optional().isInt().toInt(),
    query('type').optional().isString(),
    query('horizon').optional().isIn(['7d', '30d', '90d', '1y']),
    validate,
    async (req, res, next) => {
        try {
            const { platform_id, type, horizon } = req.query;

            const forecasts = await ForecastService.getActiveForecasts({
                platformId: platform_id,
                type,
                horizon
            });

            res.json(forecasts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/forecasts/platform/:slug
 * Get forecasts for a specific platform
 */
router.get('/platform/:slug',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;

            const forecasts = await ForecastService.getForecastsByPlatform(slug);
            if (!forecasts) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            res.json(forecasts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/forecasts/:id
 * Get single forecast details
 */
router.get('/:id',
    param('id').isInt().toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const forecast = await ForecastService.getForecastById(id);
            if (!forecast) {
                return res.status(404).json({ error: 'Forecast not found' });
            }

            res.json(forecast);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/forecasts/generate
 * Generate new forecasts using AI
 */
router.post('/generate',
    async (req, res, next) => {
        try {
            const { platform_slug, force = false } = req.body;

            if (!platform_slug) {
                return res.status(400).json({ error: 'platform_slug is required' });
            }

            // Check if recent forecast exists (unless force=true)
            if (!force) {
                const existing = await ForecastService.getRecentForecast(platform_slug);
                if (existing) {
                    return res.json({
                        message: 'Recent forecast already exists',
                        forecast: existing,
                        cached: true
                    });
                }
            }

            const forecast = await ForecastService.generateForecast(platform_slug);

            res.json({
                message: 'Forecast generated successfully',
                forecast,
                cached: false
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/forecasts/accuracy
 * Get forecast accuracy metrics
 */
router.get('/stats/accuracy',
    query('platform_id').optional().isInt().toInt(),
    query('days').optional().isInt({ min: 7, max: 365 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { platform_id, days = 30 } = req.query;

            const accuracy = await ForecastService.getAccuracyStats({
                platformId: platform_id,
                days
            });

            res.json(accuracy);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/forecasts/summary
 * Get forecasts summary for all platforms
 */
router.get('/stats/summary',
    async (req, res, next) => {
        try {
            const cacheKey = 'forecasts:summary';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const summary = await ForecastService.getForecastsSummary();

            await cache.set(cacheKey, summary, 600); // 10 min cache
            res.json(summary);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
