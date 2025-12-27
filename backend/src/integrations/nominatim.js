/**
 * Nominatim (OpenStreetMap) API Integration
 * Free geocoding, 1 request/second
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://nominatim.openstreetmap.org';

const headers = {
    'User-Agent': 'DigitalOligopolyForecast/2.0'
};

/**
 * Search for a location (geocoding)
 */
async function search(query, options = {}) {
    return rateLimiter.execute('nominatim', async () => {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: options.limit || 5
            },
            headers
        });

        return response.data.map(result => ({
            placeId: result.place_id,
            displayName: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            type: result.type,
            class: result.class,
            importance: result.importance,
            address: {
                road: result.address?.road,
                city: result.address?.city || result.address?.town,
                state: result.address?.state,
                country: result.address?.country,
                postcode: result.address?.postcode
            }
        }));
    });
}

/**
 * Reverse geocoding (coordinates to address)
 */
async function reverse(latitude, longitude) {
    return rateLimiter.execute('nominatim', async () => {
        const response = await axios.get(`${BASE_URL}/reverse`, {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                addressdetails: 1
            },
            headers
        });

        const result = response.data;
        return {
            placeId: result.place_id,
            displayName: result.display_name,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            address: {
                road: result.address?.road,
                houseNumber: result.address?.house_number,
                city: result.address?.city || result.address?.town,
                state: result.address?.state,
                country: result.address?.country,
                countryCode: result.address?.country_code,
                postcode: result.address?.postcode
            }
        };
    });
}

/**
 * Get details for a place
 */
async function lookup(osmType, osmId) {
    return rateLimiter.execute('nominatim', async () => {
        const typeMap = { node: 'N', way: 'W', relation: 'R' };
        const prefix = typeMap[osmType] || osmType;

        const response = await axios.get(`${BASE_URL}/lookup`, {
            params: {
                osm_ids: `${prefix}${osmId}`,
                format: 'json',
                addressdetails: 1
            },
            headers
        });

        return response.data[0] || null;
    });
}

/**
 * Get headquarters locations for tech companies
 */
async function getTechHQLocations() {
    const hqs = [
        { company: 'Google', query: 'Googleplex Mountain View CA' },
        { company: 'Meta', query: '1 Hacker Way Menlo Park CA' },
        { company: 'Amazon', query: 'Amazon Headquarters Seattle WA' },
        { company: 'Apple', query: 'Apple Park Cupertino CA' },
        { company: 'Microsoft', query: 'Microsoft Redmond WA' }
    ];

    const results = [];
    for (const hq of hqs) {
        try {
            const locations = await search(hq.query, { limit: 1 });
            if (locations.length > 0) {
                results.push({
                    company: hq.company,
                    ...locations[0]
                });
            }
        } catch (error) {
            logger.warn(`Nominatim error for ${hq.company}:`, error.message);
        }
    }

    return results;
}

/**
 * Fetch location data
 */
async function fetch() {
    const results = [];

    try {
        const hqLocations = await getTechHQLocations();

        results.push({
            platformId: 'geo',
            metricType: 'tech_hq_locations',
            value: hqLocations.length,
            unit: 'count',
            data: hqLocations
        });
    } catch (error) {
        logger.error('Nominatim fetch error:', error.message);
    }

    return results;
}

module.exports = {
    search,
    reverse,
    lookup,
    getTechHQLocations,
    fetch
};
