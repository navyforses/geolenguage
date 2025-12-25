/**
 * GH Archive Integration
 * GitHub events archive since 2011
 * Free, gzip compressed JSON files
 */

const axios = require('axios');
const zlib = require('zlib');
const logger = require('../utils/logger');

const BASE_URL = 'https://data.gharchive.org';

/**
 * Get archive URL for a specific hour
 */
function getArchiveUrl(date, hour) {
    const d = new Date(date);
    const dateStr = d.toISOString().split('T')[0];
    return `${BASE_URL}/${dateStr}-${hour}.json.gz`;
}

/**
 * Download and parse archive file
 * Note: This can be large (100MB+), use with caution
 */
async function downloadArchive(date, hour) {
    const url = getArchiveUrl(date, hour);

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000 // 60 second timeout
        });

        // Decompress gzip
        const decompressed = zlib.gunzipSync(response.data);
        const text = decompressed.toString('utf-8');

        // Parse newline-delimited JSON
        const events = text
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);

        return events;
    } catch (error) {
        logger.error(`GH Archive download error for ${url}:`, error.message);
        return [];
    }
}

/**
 * Get summary of events for a date
 * This is a lighter alternative that doesn't download full archive
 */
async function getEventSummary(date) {
    // GH Archive doesn't have a summary API, so we provide metadata
    const d = new Date(date);
    const dateStr = d.toISOString().split('T')[0];

    return {
        date: dateStr,
        archiveUrls: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            url: getArchiveUrl(date, i)
        })),
        note: 'Full archive download required for event data'
    };
}

/**
 * Analyze events from archive
 */
function analyzeEvents(events) {
    const summary = {
        total: events.length,
        byType: {},
        byRepo: {},
        byActor: {},
        languages: {}
    };

    for (const event of events) {
        // Count by type
        summary.byType[event.type] = (summary.byType[event.type] || 0) + 1;

        // Count by repo
        const repo = event.repo?.name;
        if (repo) {
            summary.byRepo[repo] = (summary.byRepo[repo] || 0) + 1;
        }

        // Count by actor
        const actor = event.actor?.login;
        if (actor) {
            summary.byActor[actor] = (summary.byActor[actor] || 0) + 1;
        }
    }

    // Sort and limit
    summary.topRepos = Object.entries(summary.byRepo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([repo, count]) => ({ repo, count }));

    summary.topActors = Object.entries(summary.byActor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([actor, count]) => ({ actor, count }));

    delete summary.byRepo;
    delete summary.byActor;

    return summary;
}

/**
 * Get recent archive availability
 */
async function checkAvailability(date = new Date()) {
    const url = getArchiveUrl(date, 0);

    try {
        await axios.head(url);
        return { available: true, url };
    } catch (error) {
        if (error.response?.status === 404) {
            return { available: false, url, reason: 'Not yet available' };
        }
        return { available: false, url, reason: error.message };
    }
}

/**
 * Fetch GH Archive data (lightweight - just availability check)
 */
async function fetch() {
    const results = [];

    try {
        // Check yesterday's availability (today might not be ready)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const availability = await checkAvailability(yesterday);

        results.push({
            platformId: 'github',
            metricType: 'gharchive_availability',
            value: availability.available ? 1 : 0,
            unit: 'boolean',
            data: {
                date: yesterday.toISOString().split('T')[0],
                ...availability,
                note: 'Use downloadArchive() for full event data'
            }
        });
    } catch (error) {
        logger.error('GH Archive fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getArchiveUrl,
    downloadArchive,
    getEventSummary,
    analyzeEvents,
    checkAvailability,
    fetch
};
