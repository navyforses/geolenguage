/**
 * Finnhub API Integration
 * News, sentiment, company info
 * Free tier: 60 requests/minute
 * Get free API key at: https://finnhub.io/register
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = process.env.FINNHUB_API_KEY || '';

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
 * Make API request with rate limiting
 */
async function apiRequest(endpoint, params = {}) {
    if (!API_KEY) {
        logger.warn('Finnhub API key not configured');
        return null;
    }

    return rateLimiter.execute('finnhub', async () => {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            params: {
                ...params,
                token: API_KEY
            },
            timeout: 10000
        });
        return response.data;
    });
}

/**
 * Get company news
 */
async function getCompanyNews(symbol, fromDate, toDate) {
    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];

    try {
        const data = await apiRequest('/company-news', {
            symbol,
            from,
            to
        });

        if (!data) return [];

        return data.slice(0, 20).map(article => ({
            id: article.id,
            headline: article.headline,
            summary: article.summary,
            source: article.source,
            url: article.url,
            image: article.image,
            publishedAt: new Date(article.datetime * 1000).toISOString(),
            category: article.category,
            related: article.related
        }));
    } catch (error) {
        logger.error(`Finnhub news error for ${symbol}:`, error.message);
        return [];
    }
}

/**
 * Get news sentiment
 */
async function getNewsSentiment(symbol) {
    try {
        const data = await apiRequest('/news-sentiment', { symbol });

        if (!data || !data.sentiment) {
            return null;
        }

        return {
            symbol: data.symbol,
            companyNewsScore: data.companyNewsScore,
            sectorAverageBullishPercent: data.sectorAverageBullishPercent,
            sectorAverageNewsScore: data.sectorAverageNewsScore,
            sentiment: {
                bearishPercent: data.sentiment.bearishPercent,
                bullishPercent: data.sentiment.bullishPercent
            },
            buzz: {
                articlesInLastWeek: data.buzz.articlesInLastWeek,
                weeklyAverage: data.buzz.weeklyAverage,
                buzz: data.buzz.buzz
            }
        };
    } catch (error) {
        logger.error(`Finnhub sentiment error for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Get market news (general)
 */
async function getMarketNews(category = 'general') {
    try {
        const data = await apiRequest('/news', { category });

        if (!data) return [];

        return data.slice(0, 20).map(article => ({
            id: article.id,
            headline: article.headline,
            summary: article.summary,
            source: article.source,
            url: article.url,
            image: article.image,
            publishedAt: new Date(article.datetime * 1000).toISOString(),
            category: article.category
        }));
    } catch (error) {
        logger.error('Finnhub market news error:', error.message);
        return [];
    }
}

/**
 * Get basic financials
 */
async function getBasicFinancials(symbol) {
    try {
        const data = await apiRequest('/stock/metric', {
            symbol,
            metric: 'all'
        });

        if (!data || !data.metric) return null;

        const m = data.metric;
        return {
            symbol: data.symbol,
            marketCap: m.marketCapitalization,
            peRatio: m.peBasicExclExtraTTM,
            eps: m.epsBasicExclExtraItemsTTM,
            beta: m.beta,
            high52Week: m['52WeekHigh'],
            low52Week: m['52WeekLow'],
            dividendYield: m.dividendYieldIndicatedAnnual,
            revenueGrowth: m.revenueGrowthTTMYoy,
            profitMargin: m.netProfitMarginTTM
        };
    } catch (error) {
        logger.error(`Finnhub financials error for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Get company profile
 */
async function getCompanyProfile(symbol) {
    try {
        const data = await apiRequest('/stock/profile2', { symbol });

        if (!data || !data.name) return null;

        return {
            symbol: data.ticker,
            name: data.name,
            country: data.country,
            exchange: data.exchange,
            industry: data.finnhubIndustry,
            logo: data.logo,
            marketCap: data.marketCapitalization,
            weburl: data.weburl,
            ipo: data.ipo
        };
    } catch (error) {
        logger.error(`Finnhub profile error for ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Fetch data for all platforms
 */
async function fetch() {
    if (!API_KEY) {
        logger.warn('Finnhub: No API key configured, skipping');
        return [];
    }

    const results = [];
    const processedSymbols = new Set();

    for (const [platform, symbol] of Object.entries(STOCK_SYMBOLS)) {
        if (processedSymbols.has(symbol)) continue;
        processedSymbols.add(symbol);

        try {
            // Get sentiment
            const sentiment = await getNewsSentiment(symbol);
            if (sentiment) {
                const bullishScore = (sentiment.sentiment.bullishPercent - sentiment.sentiment.bearishPercent) / 100;

                results.push({
                    platformId: platform,
                    metricType: 'news_sentiment',
                    value: bullishScore,
                    unit: 'score',
                    data: sentiment
                });

                logger.info(`✓ Finnhub sentiment: ${symbol} = ${(bullishScore * 100).toFixed(1)}% bullish`);
            }

            // Get news
            const news = await getCompanyNews(symbol);
            if (news.length > 0) {
                results.push({
                    platformId: platform,
                    metricType: 'news',
                    value: news.length,
                    unit: 'articles',
                    data: { articles: news }
                });
            }
        } catch (error) {
            logger.error(`Finnhub error for ${platform}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getCompanyNews,
    getNewsSentiment,
    getMarketNews,
    getBasicFinancials,
    getCompanyProfile,
    fetch,
    STOCK_SYMBOLS
};
