import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Globe
} from 'lucide-react';
import ForecastChart from '../components/ForecastChart';
import AlertsPanel from '../components/AlertsPanel';

const platformData = {
  google: {
    name: 'Google Search',
    category: 'search',
    parent: 'Alphabet Inc.',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.65,
    outlook: 'bullish',
    founded: 1998,
    hq: 'Mountain View, CA',
    website: 'https://www.google.com',
    description: 'World\'s largest search engine, handling over 8.5 billion searches per day.'
  },
  youtube: {
    name: 'YouTube',
    category: 'video',
    parent: 'Alphabet Inc.',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.45,
    outlook: 'neutral',
    founded: 2005,
    hq: 'San Bruno, CA',
    website: 'https://www.youtube.com',
    description: 'World\'s largest video sharing platform with over 2 billion monthly users.'
  },
  facebook: {
    name: 'Facebook',
    category: 'social',
    parent: 'Meta Platforms Inc.',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: -0.15,
    outlook: 'neutral',
    founded: 2004,
    hq: 'Menlo Park, CA',
    website: 'https://www.facebook.com',
    description: 'Leading social network with nearly 3 billion monthly active users.'
  },
  instagram: {
    name: 'Instagram',
    category: 'social',
    parent: 'Meta Platforms Inc.',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: 0.35,
    outlook: 'bullish',
    founded: 2010,
    hq: 'Menlo Park, CA',
    website: 'https://www.instagram.com',
    description: 'Photo and video sharing platform with over 2 billion monthly users.'
  },
  chatgpt: {
    name: 'ChatGPT',
    category: 'ai',
    parent: 'OpenAI',
    ticker: null,
    price: null,
    change: null,
    sentiment: 0.78,
    outlook: 'bullish',
    founded: 2022,
    hq: 'San Francisco, CA',
    website: 'https://chat.openai.com',
    description: 'Revolutionary AI chatbot that reached 100 million users in 2 months.'
  },
  amazon: {
    name: 'Amazon',
    category: 'ecommerce',
    parent: 'Amazon.com Inc.',
    ticker: 'AMZN',
    price: 185.75,
    change: 2.1,
    sentiment: 0.55,
    outlook: 'bullish',
    founded: 1994,
    hq: 'Seattle, WA',
    website: 'https://www.amazon.com',
    description: 'World\'s largest e-commerce and cloud computing company.'
  },
  twitter: {
    name: 'X (Twitter)',
    category: 'social',
    parent: 'X Corp.',
    ticker: null,
    price: null,
    change: null,
    sentiment: -0.25,
    outlook: 'bearish',
    founded: 2006,
    hq: 'San Francisco, CA',
    website: 'https://twitter.com',
    description: 'Real-time social media platform for news and public discourse.'
  },
  tiktok: {
    name: 'TikTok',
    category: 'video',
    parent: 'ByteDance',
    ticker: null,
    price: null,
    change: null,
    sentiment: 0.35,
    outlook: 'neutral',
    founded: 2016,
    hq: 'Los Angeles, CA',
    website: 'https://www.tiktok.com',
    description: 'Short-form video platform with over 1 billion monthly active users.'
  },
  reddit: {
    name: 'Reddit',
    category: 'social',
    parent: 'Reddit Inc.',
    ticker: 'RDDT',
    price: 125.30,
    change: 5.5,
    sentiment: 0.42,
    outlook: 'bullish',
    founded: 2005,
    hq: 'San Francisco, CA',
    website: 'https://www.reddit.com',
    description: 'Community-driven discussion platform with millions of active communities.'
  },
  linkedin: {
    name: 'LinkedIn',
    category: 'professional',
    parent: 'Microsoft Corp.',
    ticker: 'MSFT',
    price: 425.80,
    change: 0.8,
    sentiment: 0.38,
    outlook: 'neutral',
    founded: 2002,
    hq: 'Sunnyvale, CA',
    website: 'https://www.linkedin.com',
    description: 'Professional networking platform with over 900 million members.'
  }
};

export default function Platform() {
  const { slug } = useParams();
  const platform = platformData[slug];

  if (!platform) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Platform not found</h1>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getOutlookBadge = () => {
    switch (platform.outlook) {
      case 'bullish':
        return <span className="badge badge-green text-sm">Bullish</span>;
      case 'bearish':
        return <span className="badge badge-red text-sm">Bearish</span>;
      default:
        return <span className="badge badge-yellow text-sm">Neutral</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="btn btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{platform.name}</h1>
            {getOutlookBadge()}
          </div>
          <p className="text-dark-400 mt-1">{platform.parent}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platform.ticker && (
              <>
                <div className="card">
                  <p className="text-dark-400 text-sm">{platform.ticker}</p>
                  <p className="text-2xl font-bold text-white mt-1">${platform.price.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {platform.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={platform.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {platform.change >= 0 ? '+' : ''}{platform.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="card">
              <p className="text-dark-400 text-sm">Sentiment</p>
              <p className={`text-2xl font-bold mt-1 ${platform.sentiment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {platform.sentiment > 0 ? '+' : ''}{platform.sentiment.toFixed(2)}
              </p>
              <p className="text-xs text-dark-500 mt-1">Social Media Score</p>
            </div>

            <div className="card">
              <p className="text-dark-400 text-sm">Market Outlook</p>
              <p className={`text-2xl font-bold mt-1 capitalize ${
                platform.outlook === 'bullish' ? 'text-green-400' :
                platform.outlook === 'bearish' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {platform.outlook}
              </p>
              <p className="text-xs text-dark-500 mt-1">30-Day Forecast</p>
            </div>

            <div className="card">
              <p className="text-dark-400 text-sm">Category</p>
              <p className="text-2xl font-bold text-white mt-1 capitalize">{platform.category}</p>
              <p className="text-xs text-dark-500 mt-1">Platform Type</p>
            </div>
          </div>

          {/* Charts */}
          <ForecastChart title="Price History & Forecast" type="line" />
          <ForecastChart title="Sentiment Trend" type="area" />

          {/* AI Analysis */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">AI Analysis</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-dark-300 mb-2">Summary</h4>
                <p className="text-dark-400">{platform.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">Strengths</h4>
                  <ul className="space-y-1 text-sm text-dark-400">
                    <li>• Strong market position</li>
                    <li>• Diversified revenue streams</li>
                    <li>• High user engagement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">Risks</h4>
                  <ul className="space-y-1 text-sm text-dark-400">
                    <li>• Regulatory challenges</li>
                    <li>• Competition pressure</li>
                    <li>• Market saturation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Platform Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">Parent Company</p>
                  <p className="text-white">{platform.parent}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">Founded</p>
                  <p className="text-white">{platform.founded}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">Headquarters</p>
                  <p className="text-white">{platform.hq}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">Website</p>
                  <a
                    href={platform.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <AlertsPanel limit={3} showTitle={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
