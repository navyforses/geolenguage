const Redis = require('ioredis');
const logger = require('./logger');

class Cache {
    constructor() {
        this.client = null;
        this.memoryCache = new Map();
        this.initialized = false;

        if (process.env.REDIS_URL) {
            this.initRedis();
        } else {
            logger.info('Redis not configured, using in-memory cache');
            this.initialized = true;
        }
    }

    initRedis() {
        try {
            this.client = new Redis(process.env.REDIS_URL, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                lazyConnect: true
            });

            this.client.on('connect', () => {
                logger.info('Redis connected');
                this.initialized = true;
            });

            this.client.on('error', (err) => {
                logger.error('Redis error:', err);
                // Fall back to memory cache
                this.client = null;
            });

            this.client.connect().catch(() => {
                this.client = null;
                this.initialized = true;
            });
        } catch (error) {
            logger.error('Failed to initialize Redis:', error);
            this.client = null;
            this.initialized = true;
        }
    }

    async get(key) {
        try {
            if (this.client) {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            }

            // Memory cache fallback
            const cached = this.memoryCache.get(key);
            if (cached && cached.expires > Date.now()) {
                return cached.value;
            }
            if (cached) {
                this.memoryCache.delete(key);
            }
            return null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttlSeconds = 300) {
        try {
            if (this.client) {
                await this.client.setex(key, ttlSeconds, JSON.stringify(value));
            } else {
                // Memory cache fallback
                this.memoryCache.set(key, {
                    value,
                    expires: Date.now() + ttlSeconds * 1000
                });

                // Clean up old entries periodically
                if (this.memoryCache.size > 1000) {
                    this.cleanupMemoryCache();
                }
            }
        } catch (error) {
            logger.error('Cache set error:', error);
        }
    }

    async del(key) {
        try {
            if (this.client) {
                await this.client.del(key);
            } else {
                this.memoryCache.delete(key);
            }
        } catch (error) {
            logger.error('Cache delete error:', error);
        }
    }

    async clear(pattern = '*') {
        try {
            if (this.client) {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } else {
                if (pattern === '*') {
                    this.memoryCache.clear();
                } else {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    for (const key of this.memoryCache.keys()) {
                        if (regex.test(key)) {
                            this.memoryCache.delete(key);
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Cache clear error:', error);
        }
    }

    cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expires <= now) {
                this.memoryCache.delete(key);
            }
        }
    }
}

module.exports = new Cache();
