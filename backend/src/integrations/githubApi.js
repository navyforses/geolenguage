/**
 * GitHub API Integration
 * Free: 5,000 requests/hour (authenticated)
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = TOKEN ? {
    'Authorization': `token ${TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
} : {
    'Accept': 'application/vnd.github.v3+json'
};

// GitHub organizations for tech companies
const COMPANY_ORGS = {
    'google': ['google', 'googleapis', 'GoogleCloudPlatform'],
    'facebook': ['facebook', 'facebookresearch', 'facebookincubator'],
    'amazon': ['aws', 'amzn', 'amazon-science'],
    'microsoft': ['microsoft', 'Azure', 'dotnet'],
    'tiktok': ['bytedance'],
    'reddit': ['reddit'],
    'linkedin': ['linkedin']
};

/**
 * Search repositories
 */
async function searchRepos(query, options = {}) {
    return rateLimiter.execute('github', async () => {
        const response = await axios.get(`${BASE_URL}/search/repositories`, {
            headers,
            params: {
                q: query,
                sort: options.sort || 'stars',
                order: options.order || 'desc',
                per_page: options.perPage || 30,
                page: options.page || 1
            }
        });

        return {
            totalCount: response.data.total_count,
            items: response.data.items.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                watchers: repo.watchers_count,
                language: repo.language,
                topics: repo.topics,
                createdAt: repo.created_at,
                updatedAt: repo.updated_at,
                pushedAt: repo.pushed_at,
                openIssues: repo.open_issues_count,
                license: repo.license?.name
            }))
        };
    });
}

/**
 * Get trending repositories (created recently with high stars)
 */
async function getTrendingRepos(days = 7, language = null) {
    const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    let query = `created:>${dateStr}`;
    if (language) {
        query += ` language:${language}`;
    }

    return searchRepos(query, { sort: 'stars', perPage: 25 });
}

/**
 * Get organization info
 */
async function getOrg(orgName) {
    return rateLimiter.execute('github', async () => {
        const response = await axios.get(`${BASE_URL}/orgs/${orgName}`, { headers });

        const org = response.data;
        return {
            login: org.login,
            name: org.name,
            description: org.description,
            blog: org.blog,
            location: org.location,
            publicRepos: org.public_repos,
            followers: org.followers,
            createdAt: org.created_at,
            updatedAt: org.updated_at
        };
    });
}

/**
 * Get organization repositories
 */
async function getOrgRepos(orgName, perPage = 30) {
    return rateLimiter.execute('github', async () => {
        const response = await axios.get(`${BASE_URL}/orgs/${orgName}/repos`, {
            headers,
            params: {
                sort: 'updated',
                per_page: perPage
            }
        });

        return response.data.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            updatedAt: repo.updated_at
        }));
    });
}

/**
 * Get repository stats
 */
async function getRepoStats(owner, repo) {
    return rateLimiter.execute('github', async () => {
        const [repoData, contributors, commits] = await Promise.all([
            axios.get(`${BASE_URL}/repos/${owner}/${repo}`, { headers }),
            axios.get(`${BASE_URL}/repos/${owner}/${repo}/contributors`, {
                headers,
                params: { per_page: 10 }
            }).catch(() => ({ data: [] })),
            axios.get(`${BASE_URL}/repos/${owner}/${repo}/commits`, {
                headers,
                params: { per_page: 10 }
            }).catch(() => ({ data: [] }))
        ]);

        return {
            name: repoData.data.name,
            fullName: repoData.data.full_name,
            description: repoData.data.description,
            stars: repoData.data.stargazers_count,
            forks: repoData.data.forks_count,
            watchers: repoData.data.subscribers_count,
            openIssues: repoData.data.open_issues_count,
            language: repoData.data.language,
            topics: repoData.data.topics,
            license: repoData.data.license?.name,
            defaultBranch: repoData.data.default_branch,
            topContributors: contributors.data.slice(0, 5).map(c => ({
                login: c.login,
                contributions: c.contributions
            })),
            recentCommits: commits.data.slice(0, 5).map(c => ({
                sha: c.sha.substring(0, 7),
                message: c.commit.message.split('\n')[0],
                author: c.commit.author.name,
                date: c.commit.author.date
            }))
        };
    });
}

/**
 * Get company GitHub activity
 */
async function getCompanyActivity(companyName) {
    const orgs = COMPANY_ORGS[companyName];
    if (!orgs) return null;

    const activity = {
        company: companyName,
        organizations: [],
        totalRepos: 0,
        totalStars: 0
    };

    for (const orgName of orgs.slice(0, 2)) { // Limit to 2 orgs to save API calls
        try {
            const [org, repos] = await Promise.all([
                getOrg(orgName),
                getOrgRepos(orgName, 10)
            ]);

            if (org) {
                activity.organizations.push({
                    ...org,
                    topRepos: repos.slice(0, 5)
                });
                activity.totalRepos += org.publicRepos;
                activity.totalStars += repos.reduce((sum, r) => sum + r.stars, 0);
            }
        } catch (error) {
            logger.warn(`GitHub org error for ${orgName}:`, error.message);
        }
    }

    return activity;
}

/**
 * Fetch GitHub data for platforms
 */
async function fetch() {
    const results = [];

    try {
        // Get trending repos
        const trending = await getTrendingRepos(7);
        results.push({
            platformId: 'github',
            metricType: 'trending_repos',
            value: trending.totalCount,
            unit: 'count',
            data: trending.items.slice(0, 20)
        });

        // Get company activity
        for (const company of Object.keys(COMPANY_ORGS)) {
            try {
                const activity = await getCompanyActivity(company);
                if (activity) {
                    results.push({
                        platformId: company,
                        metricType: 'github_activity',
                        value: activity.totalRepos,
                        unit: 'repos',
                        data: activity
                    });
                }
            } catch (error) {
                logger.error(`GitHub fetch error for ${company}:`, error.message);
            }
        }
    } catch (error) {
        logger.error('GitHub fetch error:', error.message);
    }

    return results;
}

module.exports = {
    searchRepos,
    getTrendingRepos,
    getOrg,
    getOrgRepos,
    getRepoStats,
    getCompanyActivity,
    fetch,
    COMPANY_ORGS
};
