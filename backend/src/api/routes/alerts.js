const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { validate, slugValidator } = require('../../utils/validators');
const AlertService = require('../../services/AlertService');

/**
 * GET /api/alerts
 * Get all alerts with optional filtering
 */
router.get('/',
    query('platform_id').optional().isInt().toInt(),
    query('type').optional().isString(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('is_read').optional().isBoolean().toBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const {
                platform_id,
                type,
                severity,
                is_read,
                limit = 50,
                offset = 0
            } = req.query;

            const alerts = await AlertService.getAlerts({
                platformId: platform_id,
                type,
                severity,
                isRead: is_read,
                limit,
                offset
            });

            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/alerts/unread
 * Get unread alerts count
 */
router.get('/unread/count',
    async (req, res, next) => {
        try {
            const count = await AlertService.getUnreadCount();
            res.json({ unread_count: count });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/alerts/:id
 * Get single alert details
 */
router.get('/:id',
    param('id').isInt().toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const alert = await AlertService.getAlertById(id);
            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            res.json(alert);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/alerts/:id/read
 * Mark alert as read
 */
router.patch('/:id/read',
    param('id').isInt().toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const alert = await AlertService.markAsRead(id);
            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            res.json(alert);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/alerts/read-all
 * Mark all alerts as read
 */
router.patch('/read-all',
    async (req, res, next) => {
        try {
            const count = await AlertService.markAllAsRead();
            res.json({
                message: 'All alerts marked as read',
                updated_count: count
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id',
    param('id').isInt().toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const deleted = await AlertService.deleteAlert(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            res.json({ message: 'Alert deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/alerts/platform/:slug
 * Get alerts for a specific platform
 */
router.get('/platform/:slug',
    param('slug').custom(slugValidator),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;
            const { limit = 20 } = req.query;

            const alerts = await AlertService.getAlertsByPlatform(slug, limit);
            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/alerts/recent
 * Get recent alerts across all platforms
 */
router.get('/feed/recent',
    query('hours').optional().isInt({ min: 1, max: 168 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { hours = 24 } = req.query;

            const alerts = await AlertService.getRecentAlerts(hours);
            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
