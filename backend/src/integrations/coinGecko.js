/**
 * CoinGecko API Integration
 * Crypto prices, market data
 * Free: 30 calls/minute (Demo plan)
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://api.coingecko.com/api/v3';

/**
 * Get simple price
 */
async function getPrice(ids, currencies = ['usd']) {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/simple/price`, {
            params: {
                ids: Array.isArray(ids) ? ids.join(',') : ids,
                vs_currencies: currencies.join(','),
                include_24hr_change: true,
                include_market_cap: true
            }
        });

        return response.data;
    });
}

/**
 * Get top coins by market cap
 */
async function getTopCoins(limit = 100, page = 1) {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: limit,
                page,
                sparkline: false,
                price_change_percentage: '24h,7d,30d'
            }
        });

        return response.data.map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image,
            currentPrice: coin.current_price,
            marketCap: coin.market_cap,
            marketCapRank: coin.market_cap_rank,
            totalVolume: coin.total_volume,
            high24h: coin.high_24h,
            low24h: coin.low_24h,
            priceChange24h: coin.price_change_24h,
            priceChangePercent24h: coin.price_change_percentage_24h,
            priceChangePercent7d: coin.price_change_percentage_7d_in_currency,
            priceChangePercent30d: coin.price_change_percentage_30d_in_currency,
            circulatingSupply: coin.circulating_supply,
            totalSupply: coin.total_supply,
            ath: coin.ath,
            athChangePercent: coin.ath_change_percentage
        }));
    });
}

/**
 * Get trending coins
 */
async function getTrending() {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/search/trending`);

        return {
            coins: response.data.coins?.map(item => ({
                id: item.item.id,
                name: item.item.name,
                symbol: item.item.symbol,
                marketCapRank: item.item.market_cap_rank,
                thumb: item.item.thumb,
                score: item.item.score
            })) || [],
            nfts: response.data.nfts || [],
            categories: response.data.categories || []
        };
    });
}

/**
 * Get global market data
 */
async function getGlobalData() {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/global`);
        const data = response.data.data;

        return {
            activeCryptos: data.active_cryptocurrencies,
            markets: data.markets,
            totalMarketCap: data.total_market_cap?.usd,
            totalVolume: data.total_volume?.usd,
            marketCapPercentage: {
                btc: data.market_cap_percentage?.btc,
                eth: data.market_cap_percentage?.eth
            },
            marketCapChange24h: data.market_cap_change_percentage_24h_usd,
            updatedAt: new Date(data.updated_at * 1000).toISOString()
        };
    });
}

/**
 * Get coin historical data
 */
async function getCoinHistory(id, days = 30) {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/coins/${id}/market_chart`, {
            params: {
                vs_currency: 'usd',
                days
            }
        });

        return {
            prices: response.data.prices?.map(([timestamp, price]) => ({
                date: new Date(timestamp).toISOString(),
                price
            })) || [],
            marketCaps: response.data.market_caps?.map(([timestamp, cap]) => ({
                date: new Date(timestamp).toISOString(),
                marketCap: cap
            })) || [],
            volumes: response.data.total_volumes?.map(([timestamp, volume]) => ({
                date: new Date(timestamp).toISOString(),
                volume
            })) || []
        };
    });
}

/**
 * Search coins
 */
async function search(query) {
    return rateLimiter.execute('coingecko', async () => {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: { query }
        });

        return {
            coins: response.data.coins?.slice(0, 10).map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                marketCapRank: coin.market_cap_rank,
                thumb: coin.thumb
            })) || [],
            exchanges: response.data.exchanges?.slice(0, 5) || []
        };
    });
}

/**
 * Fetch crypto market data
 */
async function fetch() {
    const results = [];

    try {
        const [global, top, trending] = await Promise.all([
            getGlobalData(),
            getTopCoins(20),
            getTrending()
        ]);

        results.push({
            platformId: 'crypto',
            metricType: 'global_market',
            value: global.totalMarketCap,
            unit: 'USD',
            data: global
        });

        results.push({
            platformId: 'crypto',
            metricType: 'market_change',
            value: global.marketCapChange24h,
            unit: 'percent',
            data: { change24h: global.marketCapChange24h }
        });

        results.push({
            platformId: 'crypto',
            metricType: 'top_coins',
            value: top.length,
            unit: 'count',
            data: top
        });

        results.push({
            platformId: 'crypto',
            metricType: 'trending_coins',
            value: trending.coins.length,
            unit: 'count',
            data: trending
        });

        // Bitcoin and Ethereum specific
        const btc = top.find(c => c.symbol === 'BTC');
        const eth = top.find(c => c.symbol === 'ETH');

        if (btc) {
            results.push({
                platformId: 'crypto',
                metricType: 'btc_price',
                value: btc.currentPrice,
                unit: 'USD',
                data: btc
            });
        }

        if (eth) {
            results.push({
                platformId: 'crypto',
                metricType: 'eth_price',
                value: eth.currentPrice,
                unit: 'USD',
                data: eth
            });
        }
    } catch (error) {
        logger.error('CoinGecko fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getPrice,
    getTopCoins,
    getTrending,
    getGlobalData,
    getCoinHistory,
    search,
    fetch
};
