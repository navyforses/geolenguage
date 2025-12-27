/**
 * FRED API Integration (Federal Reserve Economic Data)
 * Free API for economic indicators
 * 120 requests/minute
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://api.stlouisfed.org/fred';
const API_KEY = process.env.FRED_API_KEY || '';

// Key economic series
const ECONOMIC_SERIES = {
    'GDP': 'GDPC1',              // Real GDP
    'INFLATION': 'CPIAUCSL',     // Consumer Price Index
    'UNEMPLOYMENT': 'UNRATE',    // Unemployment Rate
    'FED_RATE': 'FEDFUNDS',      // Federal Funds Rate
    'SP500': 'SP500',            // S&P 500
    'TECH_EMPLOYMENT': 'CES5000000001', // Computer/Tech Employment
    'RETAIL_SALES': 'RSXFS',     // Retail Sales
    'CONSUMER_SENTIMENT': 'UMCSENT', // Consumer Sentiment
    'INDUSTRIAL_PRODUCTION': 'INDPRO' // Industrial Production
};

/**
 * Get series observations
 */
async function getSeriesObservations(seriesId, options = {}) {
    if (!API_KEY) {
        logger.warn('FRED API key not configured');
        return null;
    }

    return rateLimiter.execute('fred', async () => {
        const response = await axios.get(`${BASE_URL}/series/observations`, {
            params: {
                series_id: seriesId,
                api_key: API_KEY,
                file_type: 'json',
                sort_order: 'desc',
                limit: options.limit || 30,
                observation_start: options.startDate,
                observation_end: options.endDate
            }
        });

        return response.data.observations.map(obs => ({
            date: obs.date,
            value: obs.value === '.' ? null : parseFloat(obs.value)
        })).filter(obs => obs.value !== null);
    });
}

/**
 * Get series info
 */
async function getSeriesInfo(seriesId) {
    if (!API_KEY) {
        return null;
    }

    return rateLimiter.execute('fred', async () => {
        const response = await axios.get(`${BASE_URL}/series`, {
            params: {
                series_id: seriesId,
                api_key: API_KEY,
                file_type: 'json'
            }
        });

        const series = response.data.seriess?.[0];
        if (!series) return null;

        return {
            id: series.id,
            title: series.title,
            frequency: series.frequency,
            units: series.units,
            seasonalAdjustment: series.seasonal_adjustment,
            lastUpdated: series.last_updated
        };
    });
}

/**
 * Get latest value for a series
 */
async function getLatestValue(seriesId) {
    const observations = await getSeriesObservations(seriesId, { limit: 1 });
    return observations?.[0] || null;
}

/**
 * Get all key economic indicators
 */
async function getAllIndicators() {
    const indicators = {};

    for (const [name, seriesId] of Object.entries(ECONOMIC_SERIES)) {
        try {
            const [info, observations] = await Promise.all([
                getSeriesInfo(seriesId),
                getSeriesObservations(seriesId, { limit: 12 })
            ]);

            if (observations && observations.length > 0) {
                const latest = observations[0];
                const previous = observations[1];
                const change = previous ? ((latest.value - previous.value) / previous.value * 100) : 0;

                indicators[name] = {
                    name: info?.title || name,
                    value: latest.value,
                    date: latest.date,
                    change,
                    unit: info?.units || '',
                    trend: observations.slice(0, 6)
                };
            }
        } catch (error) {
            logger.error(`FRED error for ${name}:`, error.message);
        }
    }

    return indicators;
}

/**
 * Search for series
 */
async function searchSeries(query, limit = 10) {
    if (!API_KEY) {
        return [];
    }

    return rateLimiter.execute('fred', async () => {
        const response = await axios.get(`${BASE_URL}/series/search`, {
            params: {
                search_text: query,
                api_key: API_KEY,
                file_type: 'json',
                limit
            }
        });

        return response.data.seriess?.map(s => ({
            id: s.id,
            title: s.title,
            frequency: s.frequency,
            popularity: s.popularity
        })) || [];
    });
}

/**
 * Fetch data for platform analysis
 */
async function fetch() {
    const indicators = await getAllIndicators();
    const results = [];

    for (const [name, data] of Object.entries(indicators)) {
        results.push({
            platformId: 'economy',
            metricType: `economic_${name.toLowerCase()}`,
            value: data.value,
            unit: data.unit,
            data
        });
    }

    return results;
}

module.exports = {
    getSeriesObservations,
    getSeriesInfo,
    getLatestValue,
    getAllIndicators,
    searchSeries,
    fetch,
    ECONOMIC_SERIES
};
