# Digital Oligopoly Forecast

Real-time analysis and forecasting system for 10 major digital platforms using 18 free API data sources.

## Overview

Digital Oligopoly Forecast tracks and analyzes the world's largest digital platforms:
- **Google Search** - World's largest search engine
- **YouTube** - Largest video sharing platform
- **Facebook** - Leading social network
- **Instagram** - Photo and video sharing
- **ChatGPT** - Revolutionary AI chatbot
- **Amazon** - E-commerce and cloud giant
- **X (Twitter)** - Real-time social platform
- **TikTok** - Short-form video platform
- **Reddit** - Community-driven discussions
- **LinkedIn** - Professional networking

## Features

- **Real-time Dashboard** - Monitor all 10 platforms at a glance
- **AI-Powered Forecasts** - Claude AI generates 30-day predictions
- **Multi-source Data** - 18 free APIs for comprehensive analysis
- **Sentiment Analysis** - Reddit, HackerNews, and news sentiment
- **Stock Tracking** - Real-time prices for public companies
- **Alerts System** - Get notified of significant events
- **Compare Tool** - Side-by-side platform comparison
- **Weekly Reports** - Automated analysis reports

## Data Sources (All Free)

### Financial
- SEC EDGAR - Company filings
- Alpha Vantage - Stock prices (500/day free)
- FRED API - Economic indicators
- World Bank - Global economics
- IMF Data - World Economic Outlook

### Platform-Specific
- YouTube Data API v3 (10,000 units/day)
- Reddit API (60 requests/min)
- Google Trends (via pytrends)
- Hacker News API (unlimited)

### Crypto
- CoinGecko (30 calls/min)
- CoinMarketCap (free tier)

### Geo/Weather
- Open-Meteo (unlimited)
- OpenWeatherMap (1,000/day)
- Nominatim (1/sec)

### Knowledge
- Wikipedia/MediaWiki API
- Wikidata SPARQL

### Developer
- GitHub API (5,000/hour)
- GH Archive

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL database
- Redis cache (optional)
- WebSocket for real-time updates
- Claude AI for analysis

### Frontend
- React 18
- Tailwind CSS
- Recharts for visualizations
- React Router

## Project Structure

```
digital-oligopoly-forecast/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilities
│   └── package.json
├── backend/                  # Express backend
│   ├── src/
│   │   ├── api/routes/      # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── integrations/    # 18 API integrations
│   │   └── utils/           # Utilities
│   └── package.json
├── database/                 # SQL schema
│   ├── schema.sql
│   └── seed.sql
└── package.json             # Workspace root
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (optional for full functionality)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd digital-oligopoly-forecast

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure API keys in .env
# CLAUDE_API_KEY=sk-ant-xxx
# ALPHA_VANTAGE_KEY=xxx
# YOUTUBE_API_KEY=xxx
# GITHUB_TOKEN=ghp_xxx
# FRED_API_KEY=xxx

# Run development server
npm run dev
```

### Replit Deployment

1. Fork this repository to Replit
2. Add Secrets (environment variables)
3. Click "Run"
4. Access at your Replit URL

## API Endpoints

### Platforms
- `GET /api/platforms` - List all platforms
- `GET /api/platforms/:slug` - Get platform details
- `GET /api/platforms/:slug/metrics` - Get platform metrics
- `POST /api/platforms/compare` - Compare platforms

### Forecasts
- `GET /api/forecasts` - List forecasts
- `GET /api/forecasts/platform/:slug` - Platform forecasts
- `POST /api/forecasts/generate` - Generate new forecast

### Alerts
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts/:id/read` - Mark as read
- `GET /api/alerts/unread/count` - Unread count

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/data/dashboard` - Dashboard data

### Metrics
- `GET /api/metrics/realtime` - Real-time metrics
- `GET /api/metrics/stocks` - Stock prices
- `GET /api/metrics/sentiment` - Sentiment data
- `GET /api/metrics/trends` - Google Trends

## Cost Structure

### MVP Phase (Free)
- All 18 APIs: $0
- Replit Hacker: $7/month
- **Total: $7/month**

### Production
- News APIs: ~$449/month
- Premium data: ~$299/month
- Hosting: ~$20/month
- **Total: ~$770/month**

## License

MIT

---

*Digital Oligopoly Forecast v2.0*
*Built with Claude AI*
