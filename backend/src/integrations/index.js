/**
 * Digital Oligopoly Forecast - API Integrations
 * Exports all 18 free API integrations
 */

const secEdgar = require('./secEdgar');
const alphaVantage = require('./alphaVantage');
const fredApi = require('./fredApi');
const worldBank = require('./worldBank');
const imfApi = require('./imfApi');
const youtubeApi = require('./youtubeApi');
const redditApi = require('./redditApi');
const pytrends = require('./pytrends');
const hackerNews = require('./hackerNews');
const coinGecko = require('./coinGecko');
const coinMarketCap = require('./coinMarketCap');
const openMeteo = require('./openMeteo');
const openWeatherMap = require('./openWeatherMap');
const nominatim = require('./nominatim');
const wikipedia = require('./wikipedia');
const wikidata = require('./wikidata');
const githubApi = require('./githubApi');
const ghArchive = require('./ghArchive');

module.exports = {
    // Financial APIs
    secEdgar,
    alphaVantage,
    fredApi,
    worldBank,
    imfApi,

    // Platform APIs
    youtubeApi,
    redditApi,
    pytrends,
    hackerNews,

    // Crypto APIs
    coinGecko,
    coinMarketCap,

    // Geo/Weather APIs
    openMeteo,
    openWeatherMap,
    nominatim,

    // Knowledge APIs
    wikipedia,
    wikidata,

    // Developer APIs
    githubApi,
    ghArchive
};
