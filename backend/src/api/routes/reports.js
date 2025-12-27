const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validate, slugValidator } = require('../../utils/validators');
const ReportService = require('../../services/ReportService');

/**
 * GET /api/reports
 * Get list of generated reports
 */
router.get('/',
    query('type').optional().isIn(['weekly', 'monthly', 'quarterly', 'custom']),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { type, limit = 10 } = req.query;

            const reports = await ReportService.getReports({ type, limit });
            res.json(reports);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/reports/latest
 * Get latest weekly report
 */
router.get('/latest',
    async (req, res, next) => {
        try {
            const report = await ReportService.getLatestReport();
            if (!report) {
                return res.status(404).json({
                    error: 'No reports available',
                    message: 'Generate a new report using POST /api/reports/generate'
                });
            }

            res.json(report);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/reports/:id
 * Get single report
 */
router.get('/:id',
    param('id').isInt().toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const report = await ReportService.getReportById(id);
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            res.json(report);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/reports/generate
 * Generate a new report
 */
router.post('/generate',
    async (req, res, next) => {
        try {
            const {
                type = 'weekly',
                platforms = [],
                include_forecasts = true,
                include_alerts = true
            } = req.body;

            const report = await ReportService.generateReport({
                type,
                platforms,
                includeForecasts: include_forecasts,
                includeAlerts: include_alerts
            });

            res.json({
                message: 'Report generated successfully',
                report
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/reports/dashboard
 * Get dashboard summary data
 */
router.get('/data/dashboard',
    async (req, res, next) => {
        try {
            const dashboard = await ReportService.getDashboardData();
            res.json(dashboard);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/reports/trends
 * Get market trends analysis
 */
router.get('/data/trends',
    query('days').optional().isInt({ min: 7, max: 90 }).toInt(),
    validate,
    async (req, res, next) => {
        try {
            const { days = 30 } = req.query;

            const trends = await ReportService.getTrendsAnalysis(days);
            res.json(trends);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/reports/platform/:slug
 * Get platform-specific report
 */
router.get('/platform/:slug',
    param('slug').custom(slugValidator),
    validate,
    async (req, res, next) => {
        try {
            const { slug } = req.params;

            const report = await ReportService.getPlatformReport(slug);
            if (!report) {
                return res.status(404).json({ error: 'Platform not found' });
            }

            res.json(report);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
