/**
 * AI Scout Service - რეალური მონაცემებით
 * აერთიანებს Yahoo Finance, Binance, Reddit, და ახალი ამბების API-ებს
 */

const axios = require('axios');

class AIScoutService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 წუთი

    // თვალყურის დევნება
    this.watchedSymbols = {
      stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'AMD', 'NFLX', 'DIS'],
      crypto: ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'AVAX', 'MATIC']
    };
  }

  // Yahoo Finance - რეალური აქციების ფასები
  async getStockData(symbol) {
    const cacheKey = `stock_${symbol}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Yahoo Finance Chart API
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        {
          params: {
            interval: '1d',
            range: '1mo'
          },
          headers: {
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 10000
        }
      );

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quotes = result.indicators.quote[0];
      const closes = quotes.close.filter(c => c !== null);

      // RSI გამოთვლა
      const rsi = this.calculateRSI(closes);

      // მოცულობის საშუალო
      const volumes = quotes.volume.filter(v => v !== null);
      const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
      const currentVolume = volumes[volumes.length - 1];
      const volumePercent = Math.round((currentVolume / avgVolume) * 100);

      const data = {
        symbol: symbol,
        name: meta.longName || meta.shortName || symbol,
        price: meta.regularMarketPrice,
        change: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
        type: 'stock',
        rsi: rsi,
        volume: volumePercent,
        high52w: meta.fiftyTwoWeekHigh,
        low52w: meta.fiftyTwoWeekLow,
        marketCap: meta.marketCap
      };

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching stock ${symbol}:`, error.message);
      return null;
    }
  }

  // Binance - რეალური კრიპტო ფასები
  async getCryptoData(symbol) {
    const cacheKey = `crypto_${symbol}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const pair = `${symbol}USDT`;

      // მიმდინარე ფასი
      const priceResponse = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr`,
        {
          params: { symbol: pair },
          timeout: 10000
        }
      );

      // ისტორიული მონაცემები RSI-სთვის
      const klineResponse = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        {
          params: {
            symbol: pair,
            interval: '1d',
            limit: 30
          },
          timeout: 10000
        }
      );

      const closes = klineResponse.data.map(k => parseFloat(k[4]));
      const rsi = this.calculateRSI(closes);

      const ticker = priceResponse.data;
      const volumePercent = Math.round((parseFloat(ticker.volume) / parseFloat(ticker.quoteVolume)) * 10000);

      const data = {
        symbol: symbol,
        name: this.getCryptoName(symbol),
        price: parseFloat(ticker.lastPrice),
        change: parseFloat(ticker.priceChangePercent).toFixed(2),
        type: 'crypto',
        rsi: rsi,
        volume: Math.min(volumePercent, 300),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice)
      };

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching crypto ${symbol}:`, error.message);
      return null;
    }
  }

  // RSI გამოთვლა (14 პერიოდი)
  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // პირველი საშუალო
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // დანარჩენი პერიოდები
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round(100 - (100 / (1 + rs)));
  }

  // სენტიმენტის ანალიზი (Reddit/StockTwits)
  async getSentiment(symbol) {
    try {
      // Reddit სენტიმენტი
      const response = await axios.get(
        `https://www.reddit.com/r/wallstreetbets/search.json`,
        {
          params: {
            q: symbol,
            sort: 'new',
            limit: 25,
            t: 'day'
          },
          headers: {
            'User-Agent': 'TradeGid/1.0'
          },
          timeout: 10000
        }
      );

      const posts = response.data.data.children;
      if (posts.length === 0) return { sentiment: 50, mentions: 0 };

      // მარტივი სენტიმენტის ანალიზი
      let positive = 0;
      let negative = 0;

      const bullishWords = ['buy', 'long', 'bull', 'moon', 'rocket', 'calls', 'up', 'gains', 'profit'];
      const bearishWords = ['sell', 'short', 'bear', 'crash', 'puts', 'down', 'loss', 'dump'];

      posts.forEach(post => {
        const text = (post.data.title + ' ' + (post.data.selftext || '')).toLowerCase();
        bullishWords.forEach(word => {
          if (text.includes(word)) positive++;
        });
        bearishWords.forEach(word => {
          if (text.includes(word)) negative++;
        });
      });

      const total = positive + negative;
      const sentiment = total > 0 ? Math.round((positive / total) * 100) : 50;

      return {
        sentiment: Math.max(20, Math.min(80, sentiment)),
        mentions: posts.length
      };
    } catch (error) {
      console.error(`Error fetching sentiment for ${symbol}:`, error.message);
      return { sentiment: 50, mentions: 0 };
    }
  }

  // AI ქულის გამოთვლა
  calculateScore(data, sentiment) {
    let score = 5; // საბაზისო ქულა

    // RSI-ს წვლილი (30%)
    if (data.rsi < 30) score += 2.5; // Oversold - კარგი ყიდვისთვის
    else if (data.rsi < 40) score += 1.5;
    else if (data.rsi > 70) score -= 2; // Overbought
    else if (data.rsi > 60) score -= 1;

    // ფასის ცვლილების წვლილი (20%)
    const change = parseFloat(data.change);
    if (change > 5) score += 1;
    else if (change > 2) score += 0.5;
    else if (change < -5) score -= 1;
    else if (change < -2) score -= 0.5;

    // მოცულობის წვლილი (20%)
    if (data.volume > 200) score += 1.5;
    else if (data.volume > 150) score += 1;
    else if (data.volume < 50) score -= 0.5;

    // სენტიმენტის წვლილი (30%)
    if (sentiment.sentiment > 70) score += 1.5;
    else if (sentiment.sentiment > 60) score += 1;
    else if (sentiment.sentiment < 30) score -= 1.5;
    else if (sentiment.sentiment < 40) score -= 1;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  // რეკომენდაციის განსაზღვრა
  getRecommendation(score, rsi) {
    if (score >= 7.5 && rsi < 50) return 'buy';
    if (score <= 4 || rsi > 70) return 'sell';
    return 'hold';
  }

  // სამიზნე ფასის გამოთვლა
  calculateTargets(price, recommendation, rsi) {
    let targetPercent, stopLossPercent;

    if (recommendation === 'buy') {
      targetPercent = rsi < 30 ? 0.15 : 0.10; // 15% ან 10%
      stopLossPercent = 0.07; // 7%
    } else if (recommendation === 'sell') {
      targetPercent = -0.10;
      stopLossPercent = 0.05;
    } else {
      targetPercent = 0.08;
      stopLossPercent = 0.05;
    }

    return {
      target: Math.round(price * (1 + targetPercent) * 100) / 100,
      stopLoss: Math.round(price * (1 - stopLossPercent) * 100) / 100
    };
  }

  // კრიპტოს სახელი
  getCryptoName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'XRP': 'Ripple',
      'ADA': 'Cardano',
      'DOGE': 'Dogecoin',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon'
    };
    return names[symbol] || symbol;
  }

  // სექტორის განსაზღვრა
  getSector(symbol, type) {
    if (type === 'crypto') return 'კრიპტო';

    const sectors = {
      'AAPL': 'ტექნოლოგია',
      'MSFT': 'ტექნოლოგია',
      'GOOGL': 'ტექნოლოგია',
      'AMZN': 'ელ-კომერცია',
      'NVDA': 'ნახევარგამტარები',
      'TSLA': 'ელ-მობილები',
      'META': 'სოცქსელები',
      'AMD': 'ნახევარგამტარები',
      'NFLX': 'გართობა',
      'DIS': 'გართობა'
    };
    return sectors[symbol] || 'სხვა';
  }

  // ყველა აქტივის სკანირება
  async scanAllAssets() {
    const results = [];

    // აქციების სკანირება
    for (const symbol of this.watchedSymbols.stocks) {
      try {
        const stockData = await this.getStockData(symbol);
        if (stockData) {
          const sentiment = await this.getSentiment(symbol);
          const score = this.calculateScore(stockData, sentiment);
          const recommendation = this.getRecommendation(score, stockData.rsi);
          const targets = this.calculateTargets(stockData.price, recommendation, stockData.rsi);

          results.push({
            symbol: stockData.symbol,
            name: stockData.name,
            price: stockData.price,
            change: parseFloat(stockData.change),
            type: 'stock',
            sector: this.getSector(symbol, 'stock'),
            rsi: stockData.rsi,
            volume: stockData.volume,
            sentiment: sentiment.sentiment,
            score: score,
            recommendation: recommendation,
            target: targets.target,
            stopLoss: targets.stopLoss
          });
        }
      } catch (e) {
        console.error(`Error processing ${symbol}:`, e.message);
      }
    }

    // კრიპტოს სკანირება
    for (const symbol of this.watchedSymbols.crypto) {
      try {
        const cryptoData = await this.getCryptoData(symbol);
        if (cryptoData) {
          const sentiment = await this.getSentiment(symbol);
          const score = this.calculateScore(cryptoData, sentiment);
          const recommendation = this.getRecommendation(score, cryptoData.rsi);
          const targets = this.calculateTargets(cryptoData.price, recommendation, cryptoData.rsi);

          results.push({
            symbol: cryptoData.symbol,
            name: cryptoData.name,
            price: cryptoData.price,
            change: parseFloat(cryptoData.change),
            type: 'crypto',
            sector: 'კრიპტო',
            rsi: cryptoData.rsi,
            volume: cryptoData.volume,
            sentiment: sentiment.sentiment,
            score: score,
            recommendation: recommendation,
            target: targets.target,
            stopLoss: targets.stopLoss
          });
        }
      } catch (e) {
        console.error(`Error processing ${symbol}:`, e.message);
      }
    }

    // დალაგება ქულის მიხედვით
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  // ერთი აქტივის დეტალური ანალიზი
  async getDetailedAnalysis(symbol, type = 'stock') {
    let data, sentiment;

    if (type === 'crypto') {
      data = await this.getCryptoData(symbol);
    } else {
      data = await this.getStockData(symbol);
    }

    if (!data) return null;

    sentiment = await this.getSentiment(symbol);
    const score = this.calculateScore(data, sentiment);
    const recommendation = this.getRecommendation(score, data.rsi);
    const targets = this.calculateTargets(data.price, recommendation, data.rsi);

    return {
      ...data,
      sector: this.getSector(symbol, type),
      sentiment: sentiment.sentiment,
      mentions: sentiment.mentions,
      score: score,
      recommendation: recommendation,
      target: targets.target,
      stopLoss: targets.stopLoss,
      analysis: {
        technical: {
          rsi: data.rsi,
          rsiSignal: data.rsi < 30 ? 'oversold' : data.rsi > 70 ? 'overbought' : 'neutral',
          volume: data.volume,
          volumeSignal: data.volume > 150 ? 'high' : data.volume < 50 ? 'low' : 'normal',
          trend: parseFloat(data.change) > 0 ? 'bullish' : 'bearish'
        },
        sentiment: {
          score: sentiment.sentiment,
          mentions: sentiment.mentions,
          signal: sentiment.sentiment > 60 ? 'bullish' : sentiment.sentiment < 40 ? 'bearish' : 'neutral'
        }
      }
    };
  }
}

module.exports = new AIScoutService();
