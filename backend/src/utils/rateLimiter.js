const logger = require('./logger');

/**
 * Rate limiter for external API calls
 * Prevents hitting API rate limits
 */
class RateLimiter {
    constructor() {
        this.queues = new Map();
        this.limits = {
            // API limits per minute
            'alpha_vantage': { requests: 5, interval: 60000 },
            'youtube': { requests: 100, interval: 60000 },
            'reddit': { requests: 60, interval: 60000 },
            'coingecko': { requests: 30, interval: 60000 },
            'github': { requests: 30, interval: 60000 },
            'fred': { requests: 120, interval: 60000 },
            'sec_edgar': { requests: 10, interval: 1000 },
            'hackernews': { requests: 100, interval: 60000 },
            'nominatim': { requests: 1, interval: 1000 },
            'default': { requests: 60, interval: 60000 }
        };

        this.requestCounts = new Map();
        this.lastReset = new Map();
    }

    /**
     * Check if request can proceed
     */
    canProceed(apiName) {
        const limit = this.limits[apiName] || this.limits.default;
        const now = Date.now();

        // Reset counter if interval has passed
        const lastReset = this.lastReset.get(apiName) || 0;
        if (now - lastReset >= limit.interval) {
            this.requestCounts.set(apiName, 0);
            this.lastReset.set(apiName, now);
        }

        const currentCount = this.requestCounts.get(apiName) || 0;
        return currentCount < limit.requests;
    }

    /**
     * Record a request
     */
    recordRequest(apiName) {
        const currentCount = this.requestCounts.get(apiName) || 0;
        this.requestCounts.set(apiName, currentCount + 1);
    }

    /**
     * Get wait time until next available slot
     */
    getWaitTime(apiName) {
        const limit = this.limits[apiName] || this.limits.default;
        const lastReset = this.lastReset.get(apiName) || 0;
        const now = Date.now();

        const elapsed = now - lastReset;
        if (elapsed >= limit.interval) {
            return 0;
        }

        return limit.interval - elapsed;
    }

    /**
     * Wait for rate limit slot
     */
    async waitForSlot(apiName) {
        while (!this.canProceed(apiName)) {
            const waitTime = this.getWaitTime(apiName);
            logger.debug(`Rate limit: waiting ${waitTime}ms for ${apiName}`);
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000)));
        }
        this.recordRequest(apiName);
    }

    /**
     * Execute function with rate limiting
     */
    async execute(apiName, fn) {
        await this.waitForSlot(apiName);
        try {
            return await fn();
        } catch (error) {
            // If we hit rate limit error, wait and retry
            if (error.response?.status === 429) {
                const retryAfter = parseInt(error.response.headers['retry-after'] || '60') * 1000;
                logger.warn(`Rate limited by ${apiName}, waiting ${retryAfter}ms`);
                await new Promise(resolve => setTimeout(resolve, retryAfter));
                return await fn();
            }
            throw error;
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        const status = {};
        for (const [apiName, limit] of Object.entries(this.limits)) {
            const currentCount = this.requestCounts.get(apiName) || 0;
            const lastReset = this.lastReset.get(apiName) || Date.now();
            const now = Date.now();
            const remaining = Math.max(0, limit.requests - currentCount);
            const resetsIn = Math.max(0, limit.interval - (now - lastReset));

            status[apiName] = {
                limit: limit.requests,
                remaining,
                resetsInMs: resetsIn
            };
        }
        return status;
    }
}

module.exports = new RateLimiter();
