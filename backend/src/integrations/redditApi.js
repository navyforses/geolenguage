/**
 * Reddit API Integration
 * Posts, comments, subreddit stats
 * Free, 60 requests/minute
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://www.reddit.com';

// Subreddits to monitor for each platform
const PLATFORM_SUBREDDITS = {
    'google': ['google', 'GooglePixel', 'GoogleFi'],
    'youtube': ['youtube', 'youtubers', 'NewTubers'],
    'facebook': ['facebook', 'deletefacebook'],
    'instagram': ['Instagram', 'instagrammarketing'],
    'chatgpt': ['ChatGPT', 'OpenAI', 'artificial'],
    'amazon': ['amazon', 'amazonprime', 'AmazonSeller'],
    'twitter': ['Twitter', 'elonmusk'],
    'tiktok': ['TikTok', 'TikTokCringe'],
    'reddit': ['TheoryOfReddit', 'help', 'announcements'],
    'linkedin': ['linkedin', 'jobs']
};

const headers = {
    'User-Agent': 'DigitalOligopolyForecast/2.0'
};

/**
 * Get top posts from a subreddit
 */
async function getTopPosts(subreddit, timeframe = 'day', limit = 25) {
    return rateLimiter.execute('reddit', async () => {
        const response = await axios.get(
            `${BASE_URL}/r/${subreddit}/top.json`,
            {
                params: { t: timeframe, limit },
                headers
            }
        );

        return response.data.data.children.map(post => ({
            id: post.data.id,
            title: post.data.title,
            author: post.data.author,
            score: post.data.score,
            upvoteRatio: post.data.upvote_ratio,
            numComments: post.data.num_comments,
            created: new Date(post.data.created_utc * 1000).toISOString(),
            url: post.data.url,
            permalink: `https://reddit.com${post.data.permalink}`,
            isVideo: post.data.is_video,
            domain: post.data.domain,
            selftext: post.data.selftext?.substring(0, 300)
        }));
    });
}

/**
 * Get new posts from a subreddit
 */
async function getNewPosts(subreddit, limit = 25) {
    return rateLimiter.execute('reddit', async () => {
        const response = await axios.get(
            `${BASE_URL}/r/${subreddit}/new.json`,
            {
                params: { limit },
                headers
            }
        );

        return response.data.data.children.map(post => ({
            id: post.data.id,
            title: post.data.title,
            author: post.data.author,
            score: post.data.score,
            numComments: post.data.num_comments,
            created: new Date(post.data.created_utc * 1000).toISOString(),
            permalink: `https://reddit.com${post.data.permalink}`
        }));
    });
}

/**
 * Get subreddit info
 */
async function getSubredditInfo(subreddit) {
    return rateLimiter.execute('reddit', async () => {
        const response = await axios.get(
            `${BASE_URL}/r/${subreddit}/about.json`,
            { headers }
        );

        const data = response.data.data;
        return {
            name: data.display_name,
            title: data.title,
            description: data.public_description?.substring(0, 300),
            subscribers: data.subscribers,
            activeUsers: data.accounts_active,
            created: new Date(data.created_utc * 1000).toISOString(),
            over18: data.over18
        };
    });
}

/**
 * Search Reddit
 */
async function search(query, options = {}) {
    return rateLimiter.execute('reddit', async () => {
        const response = await axios.get(
            `${BASE_URL}/search.json`,
            {
                params: {
                    q: query,
                    sort: options.sort || 'new',
                    limit: options.limit || 25,
                    t: options.timeframe || 'week'
                },
                headers
            }
        );

        return response.data.data.children.map(post => ({
            id: post.data.id,
            title: post.data.title,
            subreddit: post.data.subreddit,
            author: post.data.author,
            score: post.data.score,
            numComments: post.data.num_comments,
            created: new Date(post.data.created_utc * 1000).toISOString(),
            permalink: `https://reddit.com${post.data.permalink}`
        }));
    });
}

/**
 * Calculate sentiment from posts
 */
function calculateSentiment(posts) {
    if (!posts.length) return { score: 0, label: 'neutral' };

    // Simple sentiment based on upvote ratio and engagement
    const avgUpvoteRatio = posts.reduce((sum, p) => sum + (p.upvoteRatio || 0.5), 0) / posts.length;
    const avgScore = posts.reduce((sum, p) => sum + p.score, 0) / posts.length;

    // Normalize to -1 to 1 scale
    const sentimentScore = (avgUpvoteRatio - 0.5) * 2;

    return {
        score: sentimentScore,
        label: sentimentScore > 0.2 ? 'positive' : sentimentScore < -0.2 ? 'negative' : 'neutral',
        avgScore,
        avgUpvoteRatio,
        sampleSize: posts.length
    };
}

/**
 * Get platform mentions and sentiment
 */
async function getPlatformSentiment(platformName) {
    const subreddits = PLATFORM_SUBREDDITS[platformName] || [platformName];
    const allPosts = [];

    for (const sub of subreddits.slice(0, 3)) {
        try {
            const posts = await getTopPosts(sub, 'day', 25);
            allPosts.push(...posts);
        } catch (error) {
            logger.warn(`Could not fetch r/${sub}:`, error.message);
        }
    }

    return {
        platform: platformName,
        posts: allPosts.slice(0, 50),
        sentiment: calculateSentiment(allPosts),
        totalPosts: allPosts.length
    };
}

/**
 * Fetch data for all platforms
 */
async function fetch() {
    const results = [];

    for (const [platform, subreddits] of Object.entries(PLATFORM_SUBREDDITS)) {
        try {
            const sentiment = await getPlatformSentiment(platform);

            results.push({
                platformId: platform,
                metricType: 'reddit_sentiment',
                value: sentiment.sentiment.score,
                unit: 'score',
                data: sentiment
            });

            results.push({
                platformId: platform,
                metricType: 'reddit_mentions',
                value: sentiment.totalPosts,
                unit: 'count',
                data: { subreddits, count: sentiment.totalPosts }
            });
        } catch (error) {
            logger.error(`Reddit error for ${platform}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getTopPosts,
    getNewPosts,
    getSubredditInfo,
    search,
    calculateSentiment,
    getPlatformSentiment,
    fetch,
    PLATFORM_SUBREDDITS
};
