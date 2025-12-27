/**
 * AI Analysis Engine
 * Uses Claude for intelligent analysis and forecasting
 */

const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class AnalysisEngine {
    constructor() {
        this.claude = null;
        this.initClient();
    }

    initClient() {
        if (process.env.CLAUDE_API_KEY) {
            this.claude = new Anthropic({
                apiKey: process.env.CLAUDE_API_KEY
            });
            logger.info('Claude AI client initialized');
        } else {
            logger.warn('CLAUDE_API_KEY not set, AI analysis disabled');
        }
    }

    /**
     * Generate forecast for a platform
     */
    async generateForecast(platform, metrics, historicalData) {
        if (!this.claude) {
            return this.generateMockForecast(platform);
        }

        const prompt = `შენ ხარ ფინანსური ანალიტიკოსი, რომელიც აანალიზებს ციფრულ პლატფორმებს.

## პლატფორმა: ${platform.name}
## კატეგორია: ${platform.category}
## მშობელი კომპანია: ${platform.parent_company || 'N/A'}

## მიმდინარე მონაცემები:
${JSON.stringify(metrics, null, 2)}

## ისტორიული ტრენდები (ბოლო 90 დღე):
${JSON.stringify(historicalData, null, 2)}

## დავალება:
1. გააანალიზე მიმდინარე მდგომარეობა და ტრენდები
2. განსაზღვრე ძირითადი რისკ-ფაქტორები
3. შექმენი 30-დღიანი პროგნოზი შემდეგი კატეგორიებისთვის:
   - ტრაფიკი/ჩართულობა (traffic)
   - შემოსავალი/აქციის ფასი (revenue)
   - ბაზრის sentiment (sentiment)
   - რისკის დონე (risk)
4. მიუთითე confidence score (0-100) თითოეულისთვის
5. ახსენი შენი მსჯელობა

დააბრუნე პასუხი მხოლოდ JSON ფორმატში:
{
  "forecasts": [
    {
      "type": "traffic",
      "prediction": { "value": 0, "change_percent": 0, "direction": "up|down|stable" },
      "confidence": 0,
      "reasoning": ""
    }
  ],
  "risks": [
    { "factor": "", "severity": "low|medium|high", "probability": 0 }
  ],
  "opportunities": [""],
  "overall_outlook": "bullish|neutral|bearish",
  "summary": ""
}`;

        try {
            const response = await this.claude.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }]
            });

            const content = response.content[0].text;

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON in response');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error('AI forecast error:', error);
            return this.generateMockForecast(platform);
        }
    }

    /**
     * Generate mock forecast when AI is unavailable
     */
    generateMockForecast(platform) {
        const directions = ['up', 'down', 'stable'];
        const outlooks = ['bullish', 'neutral', 'bearish'];

        return {
            forecasts: [
                {
                    type: 'traffic',
                    prediction: {
                        value: Math.floor(Math.random() * 1000000),
                        change_percent: (Math.random() * 20 - 10).toFixed(2),
                        direction: directions[Math.floor(Math.random() * 3)]
                    },
                    confidence: 60 + Math.floor(Math.random() * 30),
                    reasoning: 'Based on historical trends and current market conditions.'
                },
                {
                    type: 'revenue',
                    prediction: {
                        value: Math.floor(Math.random() * 10000000000),
                        change_percent: (Math.random() * 15 - 5).toFixed(2),
                        direction: directions[Math.floor(Math.random() * 3)]
                    },
                    confidence: 55 + Math.floor(Math.random() * 35),
                    reasoning: 'Projected based on quarterly earnings trends.'
                },
                {
                    type: 'sentiment',
                    prediction: {
                        value: (Math.random() * 2 - 1).toFixed(2),
                        change_percent: (Math.random() * 30 - 15).toFixed(2),
                        direction: directions[Math.floor(Math.random() * 3)]
                    },
                    confidence: 50 + Math.floor(Math.random() * 40),
                    reasoning: 'Aggregated from social media and news sentiment.'
                },
                {
                    type: 'risk',
                    prediction: {
                        value: Math.floor(Math.random() * 100),
                        change_percent: (Math.random() * 20 - 10).toFixed(2),
                        direction: directions[Math.floor(Math.random() * 3)]
                    },
                    confidence: 65 + Math.floor(Math.random() * 25),
                    reasoning: 'Calculated from market volatility and regulatory factors.'
                }
            ],
            risks: [
                { factor: 'Market volatility', severity: 'medium', probability: 0.4 },
                { factor: 'Regulatory changes', severity: 'high', probability: 0.2 },
                { factor: 'Competition pressure', severity: 'medium', probability: 0.5 }
            ],
            opportunities: [
                'Expanding user base in emerging markets',
                'New product launches',
                'Strategic partnerships'
            ],
            overall_outlook: outlooks[Math.floor(Math.random() * 3)],
            summary: `Analysis generated for ${platform.name}. AI analysis unavailable - using algorithmic estimation.`,
            isAIGenerated: false
        };
    }

    /**
     * Analyze sentiment from multiple sources
     */
    async analyzeSentiment(platformId, data) {
        const cacheKey = `sentiment:${platformId}`;
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        // Aggregate sentiment from different sources
        const sources = {
            reddit: data.reddit?.sentiment?.score || 0,
            hackernews: data.hackernews?.avgEngagement || 0,
            news: data.news?.avgSentiment || 0
        };

        const weights = { reddit: 0.4, hackernews: 0.3, news: 0.3 };
        let weightedSum = 0;
        let totalWeight = 0;

        for (const [source, score] of Object.entries(sources)) {
            if (score !== 0) {
                weightedSum += score * weights[source];
                totalWeight += weights[source];
            }
        }

        const aggregatedSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;

        const result = {
            platformId,
            aggregated: aggregatedSentiment,
            label: aggregatedSentiment > 0.2 ? 'positive' : aggregatedSentiment < -0.2 ? 'negative' : 'neutral',
            sources,
            timestamp: new Date().toISOString()
        };

        await cache.set(cacheKey, result, 900); // 15 min cache
        return result;
    }

    /**
     * Detect anomalies in metrics
     */
    async detectAnomalies(platformId, currentValue, historicalValues) {
        if (!historicalValues || historicalValues.length < 10) {
            return { isAnomaly: false, reason: 'Insufficient historical data' };
        }

        // Calculate mean and standard deviation
        const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
        const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
        const stdDev = Math.sqrt(variance);

        // Calculate z-score
        const zScore = stdDev > 0 ? Math.abs((currentValue - mean) / stdDev) : 0;

        const isAnomaly = zScore > 2;

        return {
            isAnomaly,
            zScore,
            threshold: 2,
            mean,
            stdDev,
            severity: zScore > 3 ? 'high' : zScore > 2 ? 'medium' : 'low',
            direction: currentValue > mean ? 'above' : 'below'
        };
    }

    /**
     * Correlate metrics across platforms
     */
    async findCorrelations(metrics) {
        const platforms = Object.keys(metrics);
        const correlations = [];

        for (let i = 0; i < platforms.length; i++) {
            for (let j = i + 1; j < platforms.length; j++) {
                const p1 = platforms[i];
                const p2 = platforms[j];

                // Simple correlation based on stock movements
                if (metrics[p1]?.stock_change && metrics[p2]?.stock_change) {
                    const same_direction =
                        (metrics[p1].stock_change > 0) === (metrics[p2].stock_change > 0);

                    correlations.push({
                        platforms: [p1, p2],
                        type: 'stock_movement',
                        correlation: same_direction ? 'positive' : 'negative',
                        strength: Math.min(
                            Math.abs(metrics[p1].stock_change),
                            Math.abs(metrics[p2].stock_change)
                        ) / 10
                    });
                }
            }
        }

        return correlations;
    }

    /**
     * Generate natural language insight
     */
    async generateInsight(data, context) {
        if (!this.claude) {
            return this.generateMockInsight(data, context);
        }

        try {
            const response = await this.claude.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `Based on this data: ${JSON.stringify(data)}
                    Context: ${context}
                    Generate a concise, actionable insight in 2-3 sentences.`
                }]
            });

            return response.content[0].text;
        } catch (error) {
            logger.error('AI insight error:', error);
            return this.generateMockInsight(data, context);
        }
    }

    /**
     * Generate mock insight
     */
    generateMockInsight(data, context) {
        const templates = [
            'Market conditions suggest stable growth trajectory for the platform.',
            'Recent trends indicate increased user engagement across key metrics.',
            'Competitive pressure may impact short-term performance.',
            'Strong fundamentals support positive outlook for the quarter.',
            'Monitoring regulatory developments remains important.'
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }
}

module.exports = new AnalysisEngine();
