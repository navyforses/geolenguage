const express = require('express');
const router = express.Router();

const platformsRouter = require('./routes/platforms');
const forecastsRouter = require('./routes/forecasts');
const alertsRouter = require('./routes/alerts');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const metricsRouter = require('./routes/metrics');
const scoutRouter = require('./routes/scout');

// API Info
router.get('/', (req, res) => {
    res.json({
        name: 'Digital Oligopoly Forecast API',
        version: '2.0.0',
        endpoints: {
            platforms: '/api/platforms',
            forecasts: '/api/forecasts',
            alerts: '/api/alerts',
            reports: '/api/reports',
            metrics: '/api/metrics',
            auth: '/api/auth',
            scout: '/api/scout'
        },
        documentation: '/api/docs'
    });
});

// Mount routes
router.use('/platforms', platformsRouter);
router.use('/forecasts', forecastsRouter);
router.use('/alerts', alertsRouter);
router.use('/reports', reportsRouter);
router.use('/auth', authRouter);
router.use('/metrics', metricsRouter);
router.use('/scout', scoutRouter);

module.exports = router;
