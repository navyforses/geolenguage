/**
 * CoinMarketCap API Integration
 * Free tier available with API key
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = process.env.COINMARKETCAP_KEY || '';

const headers = API_KEY ? {
    'X-CMC_PRO_API_KEY': API_KEY,
    'Accept': 'application/json'
} : {};

/**
 * Get latest listings
 */
async function getLatestListings(limit = 100) {
    if (!API_KEY) {
        logger.warn('CoinMarketCap API key not configured');
        return [];
    }

    try {
        const response = await axios.get(`${BASE_URL}/cryptocurrency/listings/latest`, {
            headers,
            params: {
                limit,
                convert: 'USD'
            }
        });

        return response.data.data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            slug: coin.slug,
            rank: coin.cmc_rank,
            circulatingSupply: coin.circulating_supply,
            totalSupply: coin.total_supply,
            maxSupply: coin.max_supply,
            price: coin.quote.USD.price,
            volume24h: coin.quote.USD.volume_24h,
            volumeChange24h: coin.quote.USD.volume_change_24h,
            percentChange1h: coin.quote.USD.percent_change_1h,
            percentChange24h: coin.quote.USD.percent_change_24h,
            percentChange7d: coin.quote.USD.percent_change_7d,
            marketCap: coin.quote.USD.market_cap,
            lastUpdated: coin.last_updated
        }));
    } catch (error) {
        logger.error('CMC listings error:', error.message);
        return [];
    }
}

/**
 * Get global metrics
 */
async function getGlobalMetrics() {
    if (!API_KEY) {
        return null;
    }

    try {
        const response = await axios.get(`${BASE_URL}/global-metrics/quotes/latest`, {
            headers,
            params: { convert: 'USD' }
        });

        const data = response.data.data;
        return {
            activeCryptos: data.active_cryptocurrencies,
            totalCryptos: data.total_cryptocurrencies,
            activeExchanges: data.active_exchanges,
            totalExchanges: data.total_exchanges,
            ethDominance: data.eth_dominance,
            btcDominance: data.btc_dominance,
            totalMarketCap: data.quote.USD.total_market_cap,
            totalVolume24h: data.quote.USD.total_volume_24h,
            altcoinVolume24h: data.quote.USD.altcoin_volume_24h,
            altcoinMarketCap: data.quote.USD.altcoin_market_cap,
            lastUpdated: data.last_updated
        };
    } catch (error) {
        logger.error('CMC global metrics error:', error.message);
        return null;
    }
}

/**
 * Get cryptocurrency info
 */
async function getCoinInfo(symbol) {
    if (!API_KEY) {
        return null;
    }

    try {
        const response = await axios.get(`${BASE_URL}/cryptocurrency/info`, {
            headers,
            params: { symbol }
        });

        const data = Object.values(response.data.data)[0];
        return {
            id: data.id,
            name: data.name,
            symbol: data.symbol,
            category: data.category,
            description: data.description,
            logo: data.logo,
            website: data.urls.website?.[0],
            twitter: data.urls.twitter?.[0],
            reddit: data.urls.reddit?.[0],
            dateAdded: data.date_added,
            tags: data.tags
        };
    } catch (error) {
        logger.error('CMC coin info error:', error.message);
        return null;
    }
}

/**
 * Fetch crypto data
 */
async function fetch() {
    if (!API_KEY) {
        return [];
    }

    const results = [];

    try {
        const [listings, global] = await Promise.all([
            getLatestListings(50),
            getGlobalMetrics()
        ]);

        if (global) {
            results.push({
                platformId: 'crypto',
                metricType: 'cmc_global',
                value: global.totalMarketCap,
                unit: 'USD',
                data: global
            });
        }

        if (listings.length > 0) {
            results.push({
                platformId: 'crypto',
                metricType: 'cmc_listings',
                value: listings.length,
                unit: 'count',
                data: listings
            });
        }
    } catch (error) {
        logger.error('CMC fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getLatestListings,
    getGlobalMetrics,
    getCoinInfo,
    fetch
};
