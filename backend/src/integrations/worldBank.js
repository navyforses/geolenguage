/**
 * World Bank API Integration
 * Free global economic data
 * No API key required
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.worldbank.org/v2';

// Key indicators
const INDICATORS = {
    'GDP': 'NY.GDP.MKTP.CD',
    'GDP_GROWTH': 'NY.GDP.MKTP.KD.ZG',
    'POPULATION': 'SP.POP.TOTL',
    'INTERNET_USERS': 'IT.NET.USER.ZS',
    'MOBILE_SUBSCRIPTIONS': 'IT.CEL.SETS.P2',
    'INFLATION': 'FP.CPI.TOTL.ZG',
    'UNEMPLOYMENT': 'SL.UEM.TOTL.ZS',
    'HIGH_TECH_EXPORTS': 'TX.VAL.TECH.CD',
    'ICT_SERVICE_EXPORTS': 'BX.GSR.CCIS.CD'
};

// Key countries for tech industry
const KEY_COUNTRIES = ['USA', 'CHN', 'IND', 'DEU', 'GBR', 'JPN', 'KOR', 'ISR'];

/**
 * Get indicator data for a country
 */
async function getIndicator(countryCode, indicatorId, years = 10) {
    try {
        const response = await axios.get(
            `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}`,
            {
                params: {
                    format: 'json',
                    per_page: years,
                    date: `${new Date().getFullYear() - years}:${new Date().getFullYear()}`
                }
            }
        );

        const data = response.data[1];
        if (!data) return [];

        return data
            .filter(d => d.value !== null)
            .map(d => ({
                year: parseInt(d.date),
                value: d.value,
                country: d.country.value,
                countryCode: d.countryiso3code
            }))
            .sort((a, b) => b.year - a.year);
    } catch (error) {
        logger.error(`World Bank API error:`, error.message);
        return [];
    }
}

/**
 * Get latest value for indicator across countries
 */
async function getLatestGlobal(indicatorId, countries = KEY_COUNTRIES) {
    const countryList = countries.join(';');

    try {
        const response = await axios.get(
            `${BASE_URL}/country/${countryList}/indicator/${indicatorId}`,
            {
                params: {
                    format: 'json',
                    per_page: 100,
                    mrnev: 1 // Most recent non-empty value
                }
            }
        );

        const data = response.data[1];
        if (!data) return [];

        return data
            .filter(d => d.value !== null)
            .map(d => ({
                country: d.country.value,
                countryCode: d.countryiso3code,
                value: d.value,
                year: parseInt(d.date)
            }));
    } catch (error) {
        logger.error(`World Bank API error:`, error.message);
        return [];
    }
}

/**
 * Get global internet penetration stats
 */
async function getInternetStats() {
    const data = await getLatestGlobal(INDICATORS.INTERNET_USERS);

    return {
        indicator: 'Internet Users (% of population)',
        data: data.sort((a, b) => b.value - a.value),
        updated: new Date().toISOString()
    };
}

/**
 * Get global GDP rankings
 */
async function getGDPRankings() {
    const data = await getLatestGlobal(INDICATORS.GDP);

    return {
        indicator: 'GDP (current US$)',
        data: data.sort((a, b) => b.value - a.value),
        updated: new Date().toISOString()
    };
}

/**
 * Get tech export data
 */
async function getTechExports() {
    const data = await getLatestGlobal(INDICATORS.HIGH_TECH_EXPORTS);

    return {
        indicator: 'High-technology exports (current US$)',
        data: data.sort((a, b) => b.value - a.value),
        updated: new Date().toISOString()
    };
}

/**
 * Get country info
 */
async function getCountryInfo(countryCode) {
    try {
        const response = await axios.get(
            `${BASE_URL}/country/${countryCode}`,
            { params: { format: 'json' } }
        );

        const data = response.data[1]?.[0];
        if (!data) return null;

        return {
            name: data.name,
            capital: data.capitalCity,
            region: data.region.value,
            incomeLevel: data.incomeLevel.value,
            longitude: parseFloat(data.longitude),
            latitude: parseFloat(data.latitude)
        };
    } catch (error) {
        logger.error(`World Bank country error:`, error.message);
        return null;
    }
}

/**
 * Fetch data for platform analysis
 */
async function fetch() {
    const results = [];

    try {
        const [internet, gdp, tech] = await Promise.all([
            getInternetStats(),
            getGDPRankings(),
            getTechExports()
        ]);

        results.push({
            platformId: 'global',
            metricType: 'internet_penetration',
            value: internet.data[0]?.value || 0,
            unit: 'percent',
            data: internet
        });

        results.push({
            platformId: 'global',
            metricType: 'gdp_rankings',
            value: gdp.data.length,
            unit: 'count',
            data: gdp
        });

        results.push({
            platformId: 'global',
            metricType: 'tech_exports',
            value: tech.data.reduce((sum, d) => sum + d.value, 0),
            unit: 'USD',
            data: tech
        });
    } catch (error) {
        logger.error('World Bank fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getIndicator,
    getLatestGlobal,
    getInternetStats,
    getGDPRankings,
    getTechExports,
    getCountryInfo,
    fetch,
    INDICATORS
};
