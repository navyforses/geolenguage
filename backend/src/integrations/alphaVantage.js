/**
 * Alpha Vantage API Integration
 * Stock prices, technical indicators, news sentiment
 * Free tier: 500 requests/day
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';

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

/**
 * Get real-time stock quote
 */
async function getQuote(symbol) {
    return rateLimiter.execute('alpha_vantage', async () => {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: API_KEY
            }
        });

        const quote = response.data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
            throw new Error('No quote data available');
        }

        return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
            volume: parseInt(quote['06. volume']),
            latestTradingDay: quote['07. latest trading day'],
            previousClose: parseFloat(quote['08. previous close']),
            open: parseFloat(quote['02. open']),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low'])
        };
    });
}

/**
 * Get daily time series
 */
async function getDailyTimeSeries(symbol, outputSize = 'compact') {
    return rateLimiter.execute('alpha_vantage', async () => {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol,
                outputsize: outputSize,
                apikey: API_KEY
            }
        });

        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) {
            throw new Error('No time series data available');
        }

        return Object.entries(timeSeries).map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
        }));
    });
}

/**
 * Get news sentiment for a ticker
 */
async function getNewsSentiment(ticker) {
    return rateLimiter.execute('alpha_vantage', async () => {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'NEWS_SENTIMENT',
                tickers: ticker,
                apikey: API_KEY
            }
        });

        const data = response.data;
        if (!data.feed) {
            return { articles: [], sentiment: null };
        }

        const articles = data.feed.slice(0, 10).map(article => ({
            title: article.title,
            url: article.url,
            source: article.source,
            publishedAt: article.time_published,
            summary: article.summary,
            overallSentiment: article.overall_sentiment_label,
            sentimentScore: article.overall_sentiment_score
        }));

        // Calculate average sentiment
        const avgSentiment = articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length;

        return {
            articles,
            sentiment: {
                average: avgSentiment,
                label: avgSentiment > 0.15 ? 'Bullish' : avgSentiment < -0.15 ? 'Bearish' : 'Neutral'
            }
        };
    });
}

/**
 * Get company overview (fundamental data)
 */
async function getCompanyOverview(symbol) {
    return rateLimiter.execute('alpha_vantage', async () => {
        const response = await axios.get(BASE_URL, {
            params: {
                function: 'OVERVIEW',
                symbol,
                apikey: API_KEY
            }
        });

        const data = response.data;
        if (!data.Symbol) {
            throw new Error('No company data available');
        }

        return {
            symbol: data.Symbol,
            name: data.Name,
            description: data.Description,
            sector: data.Sector,
            industry: data.Industry,
            marketCap: parseInt(data.MarketCapitalization),
            peRatio: parseFloat(data.PERatio),
            eps: parseFloat(data.EPS),
            dividendYield: parseFloat(data.DividendYield),
            fiftyTwoWeekHigh: parseFloat(data['52WeekHigh']),
            fiftyTwoWeekLow: parseFloat(data['52WeekLow']),
            beta: parseFloat(data.Beta),
            priceToBook: parseFloat(data.PriceToBookRatio),
            revenue: parseInt(data.RevenueTTM),
            profitMargin: parseFloat(data.ProfitMargin)
        };
    });
}

/**
 * Fetch data for all tracked platforms
 */
async function fetch() {
    const results = [];
    const processedSymbols = new Set();

    for (const [platform, symbol] of Object.entries(STOCK_SYMBOLS)) {
        // Avoid duplicate API calls for same symbol
        if (processedSymbols.has(symbol)) {
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
                data: { change: quote.change, changePercent: quote.changePercent }
            });
        } catch (error) {
            logger.error(`Alpha Vantage error for ${symbol}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getQuote,
    getDailyTimeSeries,
    getNewsSentiment,
    getCompanyOverview,
    fetch,
    STOCK_SYMBOLS
};
