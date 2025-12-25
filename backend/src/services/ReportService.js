/**
 * Report Service
 * Generates reports and dashboard data
 */

const PlatformService = require('./PlatformService');
const ForecastService = require('./ForecastService');
const AlertService = require('./AlertService');
const AnalysisEngine = require('./AnalysisEngine');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class ReportService {
    constructor() {
        this.reports = [];
        this.reportId = 1;
    }

    /**
     * Get list of reports
     */
    async getReports(options = {}) {
        let reports = [...this.reports];

        if (options.type) {
            reports = reports.filter(r => r.type === options.type);
        }

        return reports
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, options.limit || 10);
    }

    /**
     * Get latest report
     */
    async getLatestReport() {
        if (this.reports.length === 0) {
            return null;
        }
        return this.reports.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        )[0];
    }

    /**
     * Get report by ID
     */
    async getReportById(id) {
        return this.reports.find(r => r.id === id) || null;
    }

    /**
     * Generate a new report
     */
    async generateReport(options = {}) {
        const platforms = await PlatformService.getAllPlatforms();
        const targetPlatforms = options.platforms?.length > 0
            ? platforms.filter(p => options.platforms.includes(p.slug))
            : platforms;

        const report = {
            id: this.reportId++,
            type: options.type || 'weekly',
            title: `${options.type || 'Weekly'} Digital Oligopoly Report`,
            generated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            period: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
            },
            executive_summary: '',
            platforms: [],
            market_overview: {},
            key_insights: [],
            risks: [],
            opportunities: [],
            recommendations: []
        };

        // Gather platform data
        for (const platform of targetPlatforms) {
            const metrics = await PlatformService.getCurrentMetrics(platform.id);
            const forecast = options.includeForecasts
                ? await ForecastService.getRecentForecast(platform.slug)
                : null;

            report.platforms.push({
                name: platform.name,
                slug: platform.slug,
                category: platform.category,
                metrics,
                forecast_summary: forecast ? {
                    outlook: forecast.overall_outlook,
                    confidence: forecast.forecasts?.[0]?.confidence_score
                } : null
            });
        }

        // Add alerts if requested
        if (options.includeAlerts) {
            const recentAlerts = await AlertService.getRecentAlerts(168); // 1 week
            report.alerts = recentAlerts.slice(0, 10);
        }

        // Generate market overview
        report.market_overview = {
            total_platforms: targetPlatforms.length,
            by_category: this.groupByCategory(targetPlatforms),
            public_companies: targetPlatforms.filter(p => p.ticker_symbol).length,
            private_companies: targetPlatforms.filter(p => !p.ticker_symbol).length
        };

        // Generate key insights
        report.key_insights = [
            'Tech giants continue to dominate their respective markets',
            'AI integration is accelerating across all major platforms',
            'Regulatory scrutiny increasing for social media companies',
            'Strong revenue growth in cloud and advertising segments'
        ];

        // Generate executive summary
        report.executive_summary = this.generateExecutiveSummary(report);

        // Store report
        this.reports.push(report);

        logger.info(`Generated ${report.type} report with ${report.platforms.length} platforms`);
        return report;
    }

    /**
     * Group platforms by category
     */
    groupByCategory(platforms) {
        return platforms.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(report) {
        return `This ${report.type} report covers ${report.platforms.length} major digital platforms. ` +
            `The analysis period spans from ${new Date(report.period.start).toLocaleDateString()} ` +
            `to ${new Date(report.period.end).toLocaleDateString()}. ` +
            `Key observations include continued market dominance by established players, ` +
            `with emerging AI platforms showing significant growth in user engagement.`;
    }

    /**
     * Get dashboard summary data
     */
    async getDashboardData() {
        const cacheKey = 'dashboard:summary';
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const platforms = await PlatformService.getAllPlatforms();
        const forecastSummary = await ForecastService.getForecastsSummary();
        const unreadAlerts = await AlertService.getUnreadCount();
        const recentAlerts = await AlertService.getRecentAlerts(24);

        const dashboard = {
            overview: {
                total_platforms: platforms.length,
                categories: PlatformService.getCategories(),
                public_companies: platforms.filter(p => p.ticker_symbol).length
            },
            forecasts: forecastSummary,
            alerts: {
                unread: unreadAlerts,
                recent: recentAlerts.slice(0, 5)
            },
            top_movers: this.getTopMovers(platforms),
            market_sentiment: this.getMarketSentiment(platforms),
            updated_at: new Date().toISOString()
        };

        await cache.set(cacheKey, dashboard, 300); // 5 min cache
        return dashboard;
    }

    /**
     * Get top movers
     */
    getTopMovers(platforms) {
        // Simulate top movers for MVP
        return platforms
            .filter(p => p.ticker_symbol)
            .slice(0, 3)
            .map(p => ({
                platform: p.slug,
                ticker: p.ticker_symbol,
                change: (Math.random() * 10 - 5).toFixed(2),
                direction: Math.random() > 0.5 ? 'up' : 'down'
            }));
    }

    /**
     * Get market sentiment
     */
    getMarketSentiment(platforms) {
        return {
            overall: 'neutral',
            score: 0.15,
            bullish_count: 4,
            bearish_count: 2,
            neutral_count: 4
        };
    }

    /**
     * Get trends analysis
     */
    async getTrendsAnalysis(days = 30) {
        return {
            period: `${days} days`,
            top_trends: [
                { topic: 'AI Integration', score: 95, change: '+15%' },
                { topic: 'Cloud Computing', score: 88, change: '+8%' },
                { topic: 'Social Commerce', score: 75, change: '+12%' },
                { topic: 'Privacy Regulations', score: 70, change: '+20%' },
                { topic: 'Content Moderation', score: 65, change: '+5%' }
            ],
            platform_trends: {
                google: { trend: 'stable', momentum: 0.2 },
                chatgpt: { trend: 'rising', momentum: 0.8 },
                tiktok: { trend: 'rising', momentum: 0.6 },
                twitter: { trend: 'volatile', momentum: -0.1 },
                facebook: { trend: 'declining', momentum: -0.3 }
            }
        };
    }

    /**
     * Get platform-specific report
     */
    async getPlatformReport(slug) {
        const platform = await PlatformService.getPlatformBySlug(slug);
        if (!platform) return null;

        const metrics = await PlatformService.getCurrentMetrics(platform.id);
        const historical = await PlatformService.getHistoricalData(platform.id, 30);
        const forecast = await ForecastService.getRecentForecast(slug);
        const alerts = await AlertService.getAlertsByPlatform(slug, 5);

        return {
            platform,
            metrics,
            historical,
            forecast,
            alerts,
            analysis: {
                strengths: ['Strong market position', 'Diversified revenue streams'],
                weaknesses: ['Regulatory challenges', 'Competition pressure'],
                opportunities: ['Emerging markets expansion', 'New product categories'],
                threats: ['Antitrust scrutiny', 'Market saturation']
            },
            generated_at: new Date().toISOString()
        };
    }
}

module.exports = new ReportService();
