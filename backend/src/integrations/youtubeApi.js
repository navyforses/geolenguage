/**
 * YouTube Data API v3 Integration
 * Video stats, channels, trends
 * Free tier: 10,000 units/day
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY || '';

// Quota costs
const QUOTA = {
    'search.list': 100,
    'videos.list': 1,
    'channels.list': 1,
    'commentThreads.list': 1
};

/**
 * Get trending videos
 */
async function getTrendingVideos(regionCode = 'US', maxResults = 25) {
    if (!API_KEY) {
        logger.warn('YouTube API key not configured');
        return [];
    }

    return rateLimiter.execute('youtube', async () => {
        const response = await axios.get(`${BASE_URL}/videos`, {
            params: {
                part: 'snippet,statistics,contentDetails',
                chart: 'mostPopular',
                regionCode,
                maxResults,
                key: API_KEY
            }
        });

        return response.data.items.map(video => ({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description?.substring(0, 200),
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails?.high?.url,
            categoryId: video.snippet.categoryId,
            duration: video.contentDetails?.duration,
            stats: {
                views: parseInt(video.statistics.viewCount) || 0,
                likes: parseInt(video.statistics.likeCount) || 0,
                comments: parseInt(video.statistics.commentCount) || 0
            }
        }));
    });
}

/**
 * Get channel statistics
 */
async function getChannelStats(channelId) {
    if (!API_KEY) return null;

    return rateLimiter.execute('youtube', async () => {
        const response = await axios.get(`${BASE_URL}/channels`, {
            params: {
                part: 'snippet,statistics,brandingSettings',
                id: channelId,
                key: API_KEY
            }
        });

        const channel = response.data.items?.[0];
        if (!channel) return null;

        return {
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description?.substring(0, 300),
            customUrl: channel.snippet.customUrl,
            thumbnail: channel.snippet.thumbnails?.high?.url,
            country: channel.snippet.country,
            stats: {
                subscribers: parseInt(channel.statistics.subscriberCount) || 0,
                views: parseInt(channel.statistics.viewCount) || 0,
                videos: parseInt(channel.statistics.videoCount) || 0
            }
        };
    });
}

/**
 * Search videos
 */
async function searchVideos(query, options = {}) {
    if (!API_KEY) return { items: [], totalResults: 0 };

    return rateLimiter.execute('youtube', async () => {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                order: options.order || 'relevance',
                maxResults: options.maxResults || 10,
                publishedAfter: options.publishedAfter,
                regionCode: options.regionCode || 'US',
                key: API_KEY
            }
        });

        return {
            items: response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description?.substring(0, 200),
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails?.high?.url
            })),
            totalResults: response.data.pageInfo.totalResults,
            nextPageToken: response.data.nextPageToken
        };
    });
}

/**
 * Get video details
 */
async function getVideoDetails(videoId) {
    if (!API_KEY) return null;

    return rateLimiter.execute('youtube', async () => {
        const response = await axios.get(`${BASE_URL}/videos`, {
            params: {
                part: 'snippet,statistics,contentDetails',
                id: videoId,
                key: API_KEY
            }
        });

        const video = response.data.items?.[0];
        if (!video) return null;

        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            publishedAt: video.snippet.publishedAt,
            tags: video.snippet.tags?.slice(0, 10),
            duration: video.contentDetails.duration,
            stats: {
                views: parseInt(video.statistics.viewCount) || 0,
                likes: parseInt(video.statistics.likeCount) || 0,
                comments: parseInt(video.statistics.commentCount) || 0
            }
        };
    });
}

/**
 * Get video categories
 */
async function getCategories(regionCode = 'US') {
    if (!API_KEY) return [];

    return rateLimiter.execute('youtube', async () => {
        const response = await axios.get(`${BASE_URL}/videoCategories`, {
            params: {
                part: 'snippet',
                regionCode,
                key: API_KEY
            }
        });

        return response.data.items.map(cat => ({
            id: cat.id,
            title: cat.snippet.title
        }));
    });
}

/**
 * Fetch YouTube data for platform analysis
 */
async function fetch() {
    const results = [];

    try {
        const trending = await getTrendingVideos('US', 50);

        // Calculate aggregate stats
        const totalViews = trending.reduce((sum, v) => sum + v.stats.views, 0);
        const avgLikes = trending.reduce((sum, v) => sum + v.stats.likes, 0) / trending.length;
        const avgComments = trending.reduce((sum, v) => sum + v.stats.comments, 0) / trending.length;

        results.push({
            platformId: 'youtube',
            metricType: 'trending_views',
            value: totalViews,
            unit: 'count',
            data: { videos: trending.length, totalViews }
        });

        results.push({
            platformId: 'youtube',
            metricType: 'avg_engagement',
            value: avgLikes,
            unit: 'count',
            data: { avgLikes, avgComments }
        });

        // Category distribution
        const categories = {};
        trending.forEach(v => {
            categories[v.categoryId] = (categories[v.categoryId] || 0) + 1;
        });

        results.push({
            platformId: 'youtube',
            metricType: 'category_distribution',
            value: Object.keys(categories).length,
            unit: 'count',
            data: categories
        });
    } catch (error) {
        logger.error('YouTube fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getTrendingVideos,
    getChannelStats,
    searchVideos,
    getVideoDetails,
    getCategories,
    fetch
};
