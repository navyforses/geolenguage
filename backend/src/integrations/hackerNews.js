/**
 * Hacker News API Integration
 * Stories, comments, users
 * Free, no rate limit
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const ALGOLIA_URL = 'https://hn.algolia.com/api/v1';

// Platform-related search terms
const PLATFORM_TERMS = {
    'google': ['Google', 'Alphabet', 'GOOGL'],
    'youtube': ['YouTube', 'youtube.com'],
    'facebook': ['Facebook', 'Meta', 'META'],
    'instagram': ['Instagram'],
    'chatgpt': ['ChatGPT', 'OpenAI', 'GPT-4', 'GPT-5'],
    'amazon': ['Amazon', 'AWS', 'AMZN'],
    'twitter': ['Twitter', 'X.com', 'Elon Musk'],
    'tiktok': ['TikTok', 'ByteDance'],
    'reddit': ['Reddit', 'RDDT'],
    'linkedin': ['LinkedIn', 'Microsoft']
};

/**
 * Get story IDs by type
 */
async function getStoryIds(type = 'top', limit = 100) {
    const validTypes = ['top', 'new', 'best', 'ask', 'show', 'job'];
    if (!validTypes.includes(type)) {
        throw new Error(`Invalid story type: ${type}`);
    }

    const response = await axios.get(`${BASE_URL}/${type}stories.json`);
    return response.data.slice(0, limit);
}

/**
 * Get item (story/comment) by ID
 */
async function getItem(id) {
    const response = await axios.get(`${BASE_URL}/item/${id}.json`);
    return response.data;
}

/**
 * Get multiple items in parallel
 */
async function getItems(ids, concurrency = 10) {
    const items = [];

    for (let i = 0; i < ids.length; i += concurrency) {
        const batch = ids.slice(i, i + concurrency);
        const results = await Promise.all(
            batch.map(id => getItem(id).catch(() => null))
        );
        items.push(...results.filter(Boolean));
    }

    return items;
}

/**
 * Get top stories with details
 */
async function getTopStories(limit = 30) {
    const ids = await getStoryIds('top', limit);
    const stories = await getItems(ids);

    return stories.map(story => ({
        id: story.id,
        title: story.title,
        url: story.url,
        score: story.score,
        author: story.by,
        time: new Date(story.time * 1000).toISOString(),
        comments: story.descendants || 0,
        type: story.type
    }));
}

/**
 * Search stories using Algolia
 */
async function searchStories(query, options = {}) {
    try {
        const response = await axios.get(`${ALGOLIA_URL}/search`, {
            params: {
                query,
                tags: options.tags || 'story',
                numericFilters: options.numericFilters,
                page: options.page || 0,
                hitsPerPage: options.limit || 20
            }
        });

        return {
            hits: response.data.hits.map(hit => ({
                id: hit.objectID,
                title: hit.title,
                url: hit.url,
                author: hit.author,
                points: hit.points,
                comments: hit.num_comments,
                createdAt: hit.created_at
            })),
            totalHits: response.data.nbHits,
            page: response.data.page,
            totalPages: response.data.nbPages
        };
    } catch (error) {
        logger.error('HN Algolia search error:', error.message);
        return { hits: [], totalHits: 0 };
    }
}

/**
 * Search for recent stories about a topic
 */
async function searchRecent(query, hours = 24) {
    const timestamp = Math.floor((Date.now() - hours * 60 * 60 * 1000) / 1000);

    return searchStories(query, {
        numericFilters: `created_at_i>${timestamp}`,
        limit: 30
    });
}

/**
 * Get platform mentions and sentiment
 */
async function getPlatformMentions(platformName) {
    const terms = PLATFORM_TERMS[platformName] || [platformName];
    const allHits = [];

    for (const term of terms) {
        const results = await searchRecent(term, 72); // Last 3 days
        allHits.push(...results.hits);
    }

    // Deduplicate by ID
    const unique = Array.from(
        new Map(allHits.map(h => [h.id, h])).values()
    );

    // Calculate engagement score
    const totalPoints = unique.reduce((sum, h) => sum + (h.points || 0), 0);
    const totalComments = unique.reduce((sum, h) => sum + (h.comments || 0), 0);
    const avgEngagement = unique.length > 0 ?
        (totalPoints + totalComments) / unique.length : 0;

    return {
        platform: platformName,
        mentions: unique.length,
        totalPoints,
        totalComments,
        avgEngagement,
        stories: unique.slice(0, 20)
    };
}

/**
 * Get user info
 */
async function getUser(username) {
    try {
        const response = await axios.get(`${BASE_URL}/user/${username}.json`);
        const user = response.data;

        return {
            id: user.id,
            karma: user.karma,
            about: user.about,
            created: new Date(user.created * 1000).toISOString(),
            submitted: user.submitted?.length || 0
        };
    } catch (error) {
        return null;
    }
}

/**
 * Fetch data for all platforms
 */
async function fetch() {
    const results = [];

    try {
        // Get top tech stories
        const topStories = await getTopStories(50);
        results.push({
            platformId: 'hackernews',
            metricType: 'top_stories',
            value: topStories.length,
            unit: 'count',
            data: topStories
        });

        // Get mentions for each platform
        for (const platform of Object.keys(PLATFORM_TERMS)) {
            const mentions = await getPlatformMentions(platform);

            results.push({
                platformId: platform,
                metricType: 'hn_mentions',
                value: mentions.mentions,
                unit: 'count',
                data: mentions
            });

            results.push({
                platformId: platform,
                metricType: 'hn_engagement',
                value: mentions.avgEngagement,
                unit: 'score',
                data: {
                    totalPoints: mentions.totalPoints,
                    totalComments: mentions.totalComments
                }
            });
        }
    } catch (error) {
        logger.error('HackerNews fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getStoryIds,
    getItem,
    getItems,
    getTopStories,
    searchStories,
    searchRecent,
    getPlatformMentions,
    getUser,
    fetch,
    PLATFORM_TERMS
};
