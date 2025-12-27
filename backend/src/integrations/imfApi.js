/**
 * IMF Data API Integration
 * World Economic Outlook and exchange rates
 * Free, no API key required
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://www.imf.org/external/datamapper/api/v1';

/**
 * Get World Economic Outlook indicators
 */
async function getWEOIndicator(indicator, countries = ['USA']) {
    try {
        const response = await axios.get(`${BASE_URL}/${indicator}`);

        const data = response.data.values?.[indicator];
        if (!data) return null;

        const results = {};
        for (const country of countries) {
            if (data[country]) {
                results[country] = Object.entries(data[country])
                    .map(([year, value]) => ({ year: parseInt(year), value }))
                    .filter(d => d.value !== null)
                    .sort((a, b) => b.year - a.year);
            }
        }

        return results;
    } catch (error) {
        logger.error('IMF API error:', error.message);
        return null;
    }
}

/**
 * Get available indicators
 */
async function getIndicators() {
    try {
        const response = await axios.get(`${BASE_URL}/indicators`);
        return response.data.indicators || {};
    } catch (error) {
        logger.error('IMF indicators error:', error.message);
        return {};
    }
}

/**
 * Get GDP growth projections
 */
async function getGDPGrowth(countries = ['USA', 'CHN', 'DEU', 'JPN', 'GBR']) {
    return getWEOIndicator('NGDP_RPCH', countries);
}

/**
 * Get inflation rates
 */
async function getInflation(countries = ['USA', 'CHN', 'DEU', 'JPN', 'GBR']) {
    return getWEOIndicator('PCPIPCH', countries);
}

/**
 * Get unemployment rates
 */
async function getUnemployment(countries = ['USA', 'CHN', 'DEU', 'JPN', 'GBR']) {
    return getWEOIndicator('LUR', countries);
}

/**
 * Fetch data for platform analysis
 */
async function fetch() {
    const results = [];

    try {
        const [gdp, inflation, unemployment] = await Promise.all([
            getGDPGrowth(),
            getInflation(),
            getUnemployment()
        ]);

        if (gdp?.USA?.[0]) {
            results.push({
                platformId: 'economy',
                metricType: 'imf_gdp_growth',
                value: gdp.USA[0].value,
                unit: 'percent',
                data: gdp
            });
        }

        if (inflation?.USA?.[0]) {
            results.push({
                platformId: 'economy',
                metricType: 'imf_inflation',
                value: inflation.USA[0].value,
                unit: 'percent',
                data: inflation
            });
        }

        if (unemployment?.USA?.[0]) {
            results.push({
                platformId: 'economy',
                metricType: 'imf_unemployment',
                value: unemployment.USA[0].value,
                unit: 'percent',
                data: unemployment
            });
        }
    } catch (error) {
        logger.error('IMF fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getWEOIndicator,
    getIndicators,
    getGDPGrowth,
    getInflation,
    getUnemployment,
    fetch
};
