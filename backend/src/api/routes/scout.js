/**
 * AI Scout Routes - რეალური მონაცემებით
 */

const express = require('express');
const router = express.Router();
const AIScoutService = require('../../services/AIScoutService');

// ყველა აქტივის სკანირება
router.get('/scan', async (req, res) => {
  try {
    console.log('Starting full asset scan...');
    const results = await AIScoutService.scanAllAssets();
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      count: results.length
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ერთი აქტივის დეტალური ანალიზი
router.get('/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { type = 'stock' } = req.query;

    console.log(`Analyzing ${symbol} (${type})...`);
    const analysis = await AIScoutService.getDetailedAnalysis(symbol.toUpperCase(), type);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: `Could not find data for ${symbol}`
      });
    }

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// აქციის მონაცემები
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await AIScoutService.getStockData(symbol.toUpperCase());

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Could not find stock ${symbol}`
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// კრიპტოს მონაცემები
router.get('/crypto/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await AIScoutService.getCryptoData(symbol.toUpperCase());

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Could not find crypto ${symbol}`
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// სენტიმენტის ანალიზი
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const sentiment = await AIScoutService.getSentiment(symbol.toUpperCase());

    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// TOP შესაძლებლობები
router.get('/top', async (req, res) => {
  try {
    const { limit = 5, type } = req.query;
    let results = await AIScoutService.scanAllAssets();

    // ფილტრაცია ტიპის მიხედვით
    if (type && (type === 'stock' || type === 'crypto')) {
      results = results.filter(r => r.type === type);
    }

    // TOP N
    results = results.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ძებნა სიმბოლოთი
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    let data;
    const symbol = q.toUpperCase();

    // თუ ტიპი მითითებულია
    if (type === 'crypto') {
      data = await AIScoutService.getCryptoData(symbol);
    } else if (type === 'stock') {
      data = await AIScoutService.getStockData(symbol);
    } else {
      // პირველად ვცადოთ აქცია, შემდეგ კრიპტო
      data = await AIScoutService.getStockData(symbol);
      if (!data) {
        data = await AIScoutService.getCryptoData(symbol);
      }
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `No results for ${q}`
      });
    }

    // სრული ანალიზი
    const sentiment = await AIScoutService.getSentiment(symbol);
    const score = AIScoutService.calculateScore(data, sentiment);
    const recommendation = AIScoutService.getRecommendation(score, data.rsi);
    const targets = AIScoutService.calculateTargets(data.price, recommendation, data.rsi);

    res.json({
      success: true,
      data: {
        ...data,
        sector: AIScoutService.getSector(symbol, data.type),
        sentiment: sentiment.sentiment,
        mentions: sentiment.mentions,
        score: score,
        recommendation: recommendation,
        target: targets.target,
        stopLoss: targets.stopLoss
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
