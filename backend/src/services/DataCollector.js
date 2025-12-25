/**
 * Data Collection Service
 * Manages scheduled data collection from all API sources
 */

const cron = require('node-cron');
const integrations = require('../integrations');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class DataCollector {
    constructor() {
        this.schedules = {
            // Every 5 minutes - real-time data
            realtime: {
                cron: '*/5 * * * *',
                sources: ['alphaVantage', 'redditApi', 'hackerNews']
            },

            // Every hour
            hourly: {
                cron: '0 * * * *',
                sources: ['youtubeApi', 'pytrends', 'coinGecko']
            },

            // Every 6 hours
            sixHourly: {
                cron: '0 */6 * * *',
                sources: ['githubApi', 'wikipedia']
            },

            // Daily at 6:00 UTC
            daily: {
                cron: '0 6 * * *',
                sources: ['secEdgar', 'fredApi', 'worldBank', 'wikidata']
            },

            // Weekly on Sunday
            weekly: {
                cron: '0 6 * * 0',
                sources: ['imfApi']
            }
        };

        this.isRunning = false;
        this.lastRun = {};
        this.jobs = [];
    }

    /**
     * Start all scheduled collection jobs
     */
    start() {
        if (this.isRunning) {
            logger.warn('Data collector already running');
            return;
        }

        Object.entries(this.schedules).forEach(([name, config]) => {
            const job = cron.schedule(config.cron, async () => {
                logger.info(`Running ${name} collection job`);
                await this.collectFromSources(config.sources, name);
            });

            this.jobs.push({ name, job });
        });

        this.isRunning = true;
        logger.info('Data collection schedules initialized');

        // Run initial collection for real-time sources
        this.collectFromSources(this.schedules.realtime.sources, 'initial');
    }

    /**
     * Stop all scheduled jobs
     */
    stop() {
        this.jobs.forEach(({ name, job }) => {
            job.stop();
            logger.info(`Stopped ${name} collection job`);
        });

        this.jobs = [];
        this.isRunning = false;
        logger.info('Data collection stopped');
    }

    /**
     * Collect data from specified sources
     */
    async collectFromSources(sourceNames, jobName = 'manual') {
        const results = {
            job: jobName,
            timestamp: new Date().toISOString(),
            sources: {},
            errors: []
        };

        for (const sourceName of sourceNames) {
            try {
                const source = integrations[sourceName];
                if (!source || typeof source.fetch !== 'function') {
                    logger.warn(`Unknown or invalid source: ${sourceName}`);
                    continue;
                }

                const startTime = Date.now();
                const data = await source.fetch();
                const duration = Date.now() - startTime;

                results.sources[sourceName] = {
                    records: data.length,
                    duration: `${duration}ms`,
                    success: true
                };

                // Process and cache the data
                await this.processAndStore(data, sourceName);

                logger.info(`Collected ${data.length} records from ${sourceName} in ${duration}ms`);
            } catch (error) {
                logger.error(`Error collecting from ${sourceName}:`, error);
                results.sources[sourceName] = {
                    success: false,
                    error: error.message
                };
                results.errors.push({ source: sourceName, error: error.message });
            }
        }

        this.lastRun[jobName] = results;

        // Broadcast update if we have global broadcast function
        if (global.broadcast) {
            global.broadcast({
                type: 'data_update',
                job: jobName,
                timestamp: results.timestamp,
                sources: Object.keys(results.sources)
            });
        }

        return results;
    }

    /**
     * Process and store collected data
     */
    async processAndStore(data, source) {
        for (const record of data) {
            try {
                // Store in cache for real-time access
                const cacheKey = `metric:${record.platformId}:${record.metricType}`;
                await cache.set(cacheKey, {
                    value: record.value,
                    unit: record.unit,
                    data: record.data,
                    source,
                    timestamp: new Date().toISOString()
                }, 600); // 10 min TTL

                // Store platform-level summary
                const platformKey = `platform:${record.platformId}:latest`;
                const platformData = await cache.get(platformKey) || { metrics: {} };
                platformData.metrics[record.metricType] = {
                    value: record.value,
                    unit: record.unit,
                    source,
                    timestamp: new Date().toISOString()
                };
                await cache.set(platformKey, platformData, 600);

            } catch (error) {
                logger.error(`Error storing record from ${source}:`, error);
            }
        }
    }

    /**
     * Manual trigger for testing or on-demand collection
     */
    async collectNow(sourceName) {
        if (!integrations[sourceName]) {
            throw new Error(`Unknown source: ${sourceName}`);
        }
        return this.collectFromSources([sourceName], 'manual');
    }

    /**
     * Collect all sources now
     */
    async collectAll() {
        const allSources = Object.values(this.schedules)
            .flatMap(s => s.sources)
            .filter((v, i, a) => a.indexOf(v) === i); // Unique

        return this.collectFromSources(allSources, 'collect_all');
    }

    /**
     * Get collection status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            schedules: Object.keys(this.schedules),
            lastRun: this.lastRun,
            activeJobs: this.jobs.map(j => j.name)
        };
    }

    /**
     * Get last results for a job
     */
    getLastResults(jobName) {
        return this.lastRun[jobName] || null;
    }
}

module.exports = new DataCollector();
