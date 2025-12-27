/**
 * Google Trends Integration
 * Using direct HTTP requests (pytrends-style)
 * No official API, scraping-based
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://trends.google.com/trends/api';

// Platform search terms
const PLATFORM_TERMS = {
    'google': 'Google',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'chatgpt': 'ChatGPT',
    'amazon': 'Amazon',
    'twitter': 'Twitter',
    'tiktok': 'TikTok',
    'reddit': 'Reddit',
    'linkedin': 'LinkedIn'
};

/**
 * Get daily search trends
 */
async function getDailyTrends(geo = 'US') {
    try {
        const response = await axios.get(
            `${BASE_URL}/dailytrends`,
            {
                params: {
                    hl: 'en-US',
                    tz: -300,
                    geo,
                    ns: 15
                }
            }
        );

        // Response starts with ")]}',\n" which needs to be removed
        const jsonStr = response.data.substring(response.data.indexOf('{'));
        const data = JSON.parse(jsonStr);

        const trends = data.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

        return trends.slice(0, 20).map(trend => ({
            title: trend.title.query,
            formattedTraffic: trend.formattedTraffic,
            relatedQueries: trend.relatedQueries?.map(q => q.query) || [],
            articles: trend.articles?.slice(0, 3).map(a => ({
                title: a.title,
                url: a.url,
                source: a.source
            })) || []
        }));
    } catch (error) {
        logger.error('Google Trends daily error:', error.message);
        return [];
    }
}

/**
 * Get real-time search trends
 */
async function getRealtimeTrends(geo = 'US', category = 'all') {
    try {
        const categoryMap = {
            'all': '',
            'business': 'b',
            'entertainment': 'e',
            'health': 'm',
            'sci_tech': 't',
            'sports': 's',
            'top_stories': 'h'
        };

        const response = await axios.get(
            `${BASE_URL}/realtimetrends`,
            {
                params: {
                    hl: 'en-US',
                    tz: -300,
                    geo,
                    cat: categoryMap[category] || '',
                    fi: 0,
                    fs: 0,
                    ri: 300,
                    rs: 20,
                    sort: 0
                }
            }
        );

        const jsonStr = response.data.substring(response.data.indexOf('{'));
        const data = JSON.parse(jsonStr);

        return data.storySummaries?.trendingStories?.slice(0, 15).map(story => ({
            title: story.title,
            entityNames: story.entityNames || [],
            articles: story.articles?.slice(0, 3).map(a => ({
                title: a.articleTitle,
                url: a.url,
                source: a.source
            })) || []
        })) || [];
    } catch (error) {
        logger.error('Google Trends realtime error:', error.message);
        return [];
    }
}

/**
 * Check if a platform is trending
 */
async function isPlatformTrending(platformName) {
    const trends = await getDailyTrends('US');
    const searchTerm = PLATFORM_TERMS[platformName] || platformName;

    const found = trends.find(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        platform: platformName,
        isTrending: !!found,
        trendData: found || null
    };
}

/**
 * Get interest over time (simplified - would need token in production)
 */
async function getInterestOverTime(keywords, timeframe = 'today 3-m') {
    // This is a simplified version - full implementation would require
    // handling Google's token system
    try {
        // Return mock data structure for now
        // In production, you'd use a proper pytrends implementation
        return {
            keywords,
            timeframe,
            message: 'Use pytrends Python library for full functionality',
            mockData: keywords.map((kw, i) => ({
                keyword: kw,
                interestScore: 50 + Math.floor(Math.random() * 50),
                trend: i % 2 === 0 ? 'rising' : 'stable'
            }))
        };
    } catch (error) {
        logger.error('Interest over time error:', error.message);
        return null;
    }
}

/**
 * Get related queries for a topic
 */
async function getRelatedQueries(keyword) {
    // Simplified - would need token handling in production
    return {
        keyword,
        top: [],
        rising: [],
        message: 'Use pytrends Python library for full functionality'
    };
}

/**
 * Fetch trends data for all platforms
 */
async function fetch() {
    const results = [];

    try {
        const dailyTrends = await getDailyTrends('US');
        const realtimeTrends = await getRealtimeTrends('US', 'sci_tech');

        // Check each platform
        for (const [platform, term] of Object.entries(PLATFORM_TERMS)) {
            const isTrendingDaily = dailyTrends.some(t =>
                t.title.toLowerCase().includes(term.toLowerCase())
            );
            const isTrendingRealtime = realtimeTrends.some(t =>
                t.title?.toLowerCase().includes(term.toLowerCase()) ||
                t.entityNames?.some(e => e.toLowerCase().includes(term.toLowerCase()))
            );

            results.push({
                platformId: platform,
                metricType: 'google_trends',
                value: isTrendingDaily || isTrendingRealtime ? 1 : 0,
                unit: 'boolean',
                data: {
                    isTrending: isTrendingDaily || isTrendingRealtime,
                    daily: isTrendingDaily,
                    realtime: isTrendingRealtime
                }
            });
        }

        // Add overall trends
        results.push({
            platformId: 'global',
            metricType: 'daily_trends',
            value: dailyTrends.length,
            unit: 'count',
            data: dailyTrends
        });

        results.push({
            platformId: 'global',
            metricType: 'tech_realtime_trends',
            value: realtimeTrends.length,
            unit: 'count',
            data: realtimeTrends
        });
    } catch (error) {
        logger.error('Pytrends fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getDailyTrends,
    getRealtimeTrends,
    isPlatformTrending,
    getInterestOverTime,
    getRelatedQueries,
    fetch,
    PLATFORM_TERMS
};
