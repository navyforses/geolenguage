/**
 * Wikidata API Integration
 * Free structured data, CC-0 license
 */

const axios = require('axios');
const logger = require('../utils/logger');

const API_URL = 'https://www.wikidata.org/w/api.php';
const SPARQL_URL = 'https://query.wikidata.org/sparql';

// Wikidata entity IDs for platforms/companies
const PLATFORM_ENTITIES = {
    'google': 'Q95',
    'youtube': 'Q866',
    'facebook': 'Q355',
    'instagram': 'Q209330',
    'amazon': 'Q3884',
    'twitter': 'Q918',
    'tiktok': 'Q48938486',
    'reddit': 'Q1136',
    'linkedin': 'Q213660',
    'microsoft': 'Q2283',
    'alphabet': 'Q20800404',
    'meta': 'Q380'
};

/**
 * Get entity data
 */
async function getEntity(entityId, languages = ['en']) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                action: 'wbgetentities',
                ids: entityId,
                languages: languages.join('|'),
                format: 'json'
            }
        });

        const entity = response.data.entities?.[entityId];
        if (!entity) return null;

        return {
            id: entity.id,
            type: entity.type,
            label: entity.labels?.en?.value,
            description: entity.descriptions?.en?.value,
            aliases: entity.aliases?.en?.map(a => a.value) || [],
            claims: extractClaims(entity.claims)
        };
    } catch (error) {
        logger.error(`Wikidata entity error for ${entityId}:`, error.message);
        return null;
    }
}

/**
 * Extract useful claims from entity
 */
function extractClaims(claims) {
    if (!claims) return {};

    const propertyMap = {
        'P571': 'inception',      // Founded date
        'P159': 'headquarters',   // HQ location
        'P112': 'founder',        // Founder
        'P169': 'ceo',            // CEO
        'P1128': 'employees',     // Number of employees
        'P2139': 'revenue',       // Revenue
        'P856': 'website',        // Official website
        'P452': 'industry',       // Industry
        'P749': 'parent',         // Parent company
        'P127': 'owner'           // Owner
    };

    const extracted = {};

    for (const [propId, propName] of Object.entries(propertyMap)) {
        const claim = claims[propId]?.[0];
        if (claim) {
            const value = claim.mainsnak?.datavalue?.value;
            if (value) {
                if (typeof value === 'string') {
                    extracted[propName] = value;
                } else if (value.time) {
                    extracted[propName] = value.time.replace('+', '').split('T')[0];
                } else if (value.amount) {
                    extracted[propName] = parseFloat(value.amount);
                } else if (value.id) {
                    extracted[propName] = value.id; // Reference to another entity
                }
            }
        }
    }

    return extracted;
}

/**
 * Run SPARQL query
 */
async function sparqlQuery(query) {
    try {
        const response = await axios.get(SPARQL_URL, {
            params: { query, format: 'json' },
            headers: { 'Accept': 'application/sparql-results+json' }
        });

        return response.data.results?.bindings || [];
    } catch (error) {
        logger.error('Wikidata SPARQL error:', error.message);
        return [];
    }
}

/**
 * Get tech companies data via SPARQL
 */
async function getTechCompanies(limit = 50) {
    const query = `
        SELECT ?company ?companyLabel ?foundedDate ?employees ?revenue WHERE {
            ?company wdt:P31 wd:Q4830453.  # Instance of business
            ?company wdt:P452 wd:Q11661.   # Industry: IT
            OPTIONAL { ?company wdt:P571 ?foundedDate. }
            OPTIONAL { ?company wdt:P1128 ?employees. }
            OPTIONAL { ?company wdt:P2139 ?revenue. }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        ORDER BY DESC(?revenue)
        LIMIT ${limit}
    `;

    const results = await sparqlQuery(query);

    return results.map(result => ({
        id: result.company?.value?.split('/').pop(),
        name: result.companyLabel?.value,
        founded: result.foundedDate?.value,
        employees: result.employees?.value ? parseInt(result.employees.value) : null,
        revenue: result.revenue?.value ? parseFloat(result.revenue.value) : null
    }));
}

/**
 * Search Wikidata
 */
async function search(query, limit = 10) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                action: 'wbsearchentities',
                search: query,
                language: 'en',
                limit,
                format: 'json'
            }
        });

        return response.data.search?.map(result => ({
            id: result.id,
            label: result.label,
            description: result.description,
            url: result.concepturi
        })) || [];
    } catch (error) {
        logger.error('Wikidata search error:', error.message);
        return [];
    }
}

/**
 * Get platform structured data
 */
async function getPlatformData(platformName) {
    const entityId = PLATFORM_ENTITIES[platformName];
    if (!entityId) return null;

    return getEntity(entityId);
}

/**
 * Fetch Wikidata for all platforms
 */
async function fetch() {
    const results = [];

    for (const [platform, entityId] of Object.entries(PLATFORM_ENTITIES)) {
        try {
            const entity = await getEntity(entityId);
            if (entity) {
                results.push({
                    platformId: platform,
                    metricType: 'wikidata_info',
                    value: 1,
                    unit: 'entity',
                    data: entity
                });
            }
        } catch (error) {
            logger.error(`Wikidata fetch error for ${platform}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getEntity,
    sparqlQuery,
    getTechCompanies,
    search,
    getPlatformData,
    fetch,
    PLATFORM_ENTITIES
};
