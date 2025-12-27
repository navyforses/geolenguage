/**
 * Wikipedia / MediaWiki API Integration
 * Free, no API key required
 */

const axios = require('axios');
const logger = require('../utils/logger');

const API_URL = 'https://en.wikipedia.org/w/api.php';
const REST_URL = 'https://en.wikipedia.org/api/rest_v1';
const PAGEVIEWS_URL = 'https://wikimedia.org/api/rest_v1/metrics/pageviews';

// Wikipedia article titles for platforms
const PLATFORM_ARTICLES = {
    'google': 'Google',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'chatgpt': 'ChatGPT',
    'amazon': 'Amazon_(company)',
    'twitter': 'Twitter',
    'tiktok': 'TikTok',
    'reddit': 'Reddit',
    'linkedin': 'LinkedIn'
};

/**
 * Get article summary
 */
async function getSummary(title) {
    try {
        const response = await axios.get(`${REST_URL}/page/summary/${encodeURIComponent(title)}`);

        return {
            title: response.data.title,
            extract: response.data.extract,
            description: response.data.description,
            thumbnail: response.data.thumbnail?.source,
            pageUrl: response.data.content_urls?.desktop?.page,
            lastModified: response.data.timestamp
        };
    } catch (error) {
        logger.error(`Wikipedia summary error for ${title}:`, error.message);
        return null;
    }
}

/**
 * Get article content
 */
async function getContent(title) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                action: 'query',
                titles: title,
                prop: 'extracts|info',
                exintro: true,
                explaintext: true,
                format: 'json'
            }
        });

        const pages = response.data.query?.pages;
        const page = Object.values(pages)[0];

        if (page.missing !== undefined) {
            return null;
        }

        return {
            pageId: page.pageid,
            title: page.title,
            extract: page.extract,
            lastRevision: page.lastrevid
        };
    } catch (error) {
        logger.error(`Wikipedia content error for ${title}:`, error.message);
        return null;
    }
}

/**
 * Get page views for an article
 */
async function getPageViews(title, days = 30) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const formatDate = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

    try {
        const response = await axios.get(
            `${PAGEVIEWS_URL}/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(title)}/daily/${formatDate(startDate)}/${formatDate(endDate)}`
        );

        const items = response.data.items || [];
        const totalViews = items.reduce((sum, item) => sum + item.views, 0);
        const avgViews = items.length > 0 ? totalViews / items.length : 0;

        return {
            article: title,
            totalViews,
            avgDailyViews: Math.round(avgViews),
            period: `${days} days`,
            daily: items.map(item => ({
                date: item.timestamp.substring(0, 8),
                views: item.views
            }))
        };
    } catch (error) {
        logger.error(`Wikipedia pageviews error for ${title}:`, error.message);
        return { article: title, totalViews: 0, avgDailyViews: 0, daily: [] };
    }
}

/**
 * Search Wikipedia
 */
async function search(query, limit = 10) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                action: 'opensearch',
                search: query,
                limit,
                namespace: 0,
                format: 'json'
            }
        });

        const [, titles, descriptions, urls] = response.data;

        return titles.map((title, i) => ({
            title,
            description: descriptions[i],
            url: urls[i]
        }));
    } catch (error) {
        logger.error('Wikipedia search error:', error.message);
        return [];
    }
}

/**
 * Get related articles
 */
async function getRelated(title, limit = 10) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                action: 'query',
                titles: title,
                prop: 'links',
                pllimit: limit,
                format: 'json'
            }
        });

        const pages = response.data.query?.pages;
        const page = Object.values(pages)[0];

        return page.links?.map(link => link.title) || [];
    } catch (error) {
        logger.error(`Wikipedia related error for ${title}:`, error.message);
        return [];
    }
}

/**
 * Get platform Wikipedia data
 */
async function getPlatformData(platformName) {
    const title = PLATFORM_ARTICLES[platformName];
    if (!title) return null;

    const [summary, pageViews] = await Promise.all([
        getSummary(title),
        getPageViews(title, 30)
    ]);

    return {
        platform: platformName,
        wikipedia: {
            title,
            ...summary,
            pageViews
        }
    };
}

/**
 * Fetch Wikipedia data for all platforms
 */
async function fetch() {
    const results = [];

    for (const [platform, title] of Object.entries(PLATFORM_ARTICLES)) {
        try {
            const pageViews = await getPageViews(title, 7);

            results.push({
                platformId: platform,
                metricType: 'wikipedia_views',
                value: pageViews.avgDailyViews,
                unit: 'views/day',
                data: pageViews
            });
        } catch (error) {
            logger.error(`Wikipedia fetch error for ${platform}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getSummary,
    getContent,
    getPageViews,
    search,
    getRelated,
    getPlatformData,
    fetch,
    PLATFORM_ARTICLES
};
