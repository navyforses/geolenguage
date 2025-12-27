/**
 * Yahoo Finance Integration
 * Real-time stock prices, quotes, and historical data
 * FREE - No API key required!
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Yahoo Finance API endpoints
const QUOTE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';

// Stock symbols for tracked platforms
const STOCK_SYMBOLS = {
    'google': 'GOOGL',
    'youtube': 'GOOGL',
    'facebook': 'META',
    'instagram': 'META',
    'amazon': 'AMZN',
    'linkedin': 'MSFT',
    'reddit': 'RDDT'
};

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

/**
 * Get real-time stock quote
 */
async function getQuote(symbol) {
    try {
        const response = await axios.get(`${QUOTE_URL}/${symbol}`, {
            params: {
                interval: '1d',
                range: '1d'
            },
            headers,
            timeout: 10000
        });

        const result = response.data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators.quote[0];

        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose || meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
            symbol: meta.symbol,
            price: currentPrice,
            previousClose: previousClose,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            open: quote.open?.[0] || meta.regularMarketOpen,
            high: quote.high?.[0] || meta.regularMarketDayHigh,
            low: quote.low?.[0] || meta.regularMarketDayLow,
            volume: quote.volume?.[0] || meta.regularMarketVolume,
            marketCap: meta.marketCap || null,
            currency: meta.currency,
            exchangeName: meta.exchangeName,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`Yahoo Finance quote error for ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Get historical price data
 */
async function getHistoricalData(symbol, range = '1mo', interval = '1d') {
    try {
        const response = await axios.get(`${QUOTE_URL}/${symbol}`, {
            params: {
                interval,
                range
            },
            headers,
            timeout: 15000
        });

        const result = response.data.chart.result[0];
        const timestamps = result.timestamp || [];
        const quote = result.indicators.quote[0];

        return timestamps.map((ts, i) => ({
            date: new Date(ts * 1000).toISOString().split('T')[0],
            open: quote.open?.[i],
            high: quote.high?.[i],
            low: quote.low?.[i],
            close: quote.close?.[i],
            volume: quote.volume?.[i]
        })).filter(d => d.close !== null);
    } catch (error) {
        logger.error(`Yahoo Finance historical error for ${symbol}:`, error.message);
        throw error;
    }
}

/**
 * Get multiple quotes at once
 */
async function getMultipleQuotes(symbols) {
    const results = {};
    const uniqueSymbols = [...new Set(symbols)];

    await Promise.all(
        uniqueSymbols.map(async (symbol) => {
            try {
                results[symbol] = await getQuote(symbol);
            } catch (error) {
                logger.warn(`Failed to fetch ${symbol}:`, error.message);
                results[symbol] = null;
            }
        })
    );

    return results;
}

/**
 * Fetch data for all tracked platforms
 */
async function fetch() {
    const results = [];
    const processedSymbols = new Set();

    for (const [platform, symbol] of Object.entries(STOCK_SYMBOLS)) {
        if (processedSymbols.has(symbol)) {
            // Use cached result for same symbol
            const existing = results.find(r => r.data?.symbol === symbol);
            if (existing) {
                results.push({
                    platformId: platform,
                    metricType: 'stock_price',
                    value: existing.value,
                    unit: 'USD',
                    data: existing.data
                });
            }
            continue;
        }
        processedSymbols.add(symbol);

        try {
            const quote = await getQuote(symbol);

            results.push({
                platformId: platform,
                metricType: 'stock_price',
                value: quote.price,
                unit: 'USD',
                data: quote
            });

            results.push({
                platformId: platform,
                metricType: 'stock_change',
                value: quote.changePercent,
                unit: 'percent',
                data: {
                    change: quote.change,
                    changePercent: quote.changePercent,
                    previousClose: quote.previousClose
                }
            });

            logger.info(`✓ Yahoo Finance: ${symbol} = $${quote.price} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent}%)`);
        } catch (error) {
            logger.error(`Yahoo Finance error for ${platform} (${symbol}):`, error.message);
        }
    }

    return results;
}

/**
 * Get stock data for a specific platform
 */
async function getPlatformStock(platformSlug) {
    const symbol = STOCK_SYMBOLS[platformSlug];
    if (!symbol) {
        return null;
    }

    try {
        return await getQuote(symbol);
    } catch (error) {
        logger.error(`Failed to get stock for ${platformSlug}:`, error.message);
        return null;
    }
}

module.exports = {
    getQuote,
    getHistoricalData,
    getMultipleQuotes,
    fetch,
    getPlatformStock,
    STOCK_SYMBOLS
};
