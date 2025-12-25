import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

const categoryColors = {
  search: 'bg-blue-500',
  video: 'bg-red-500',
  social: 'bg-purple-500',
  ecommerce: 'bg-orange-500',
  ai: 'bg-green-500',
  professional: 'bg-cyan-500'
};

const categoryLabels = {
  search: 'Search',
  video: 'Video',
  social: 'Social',
  ecommerce: 'E-Commerce',
  ai: 'AI',
  professional: 'Professional'
};

export default function PlatformCard({ platform }) {
  const {
    name,
    slug,
    category,
    ticker,
    price,
    change,
    sentiment,
    outlook
  } = platform;

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-dark-400" />;
  };

  const getOutlookBadge = () => {
    switch (outlook) {
      case 'bullish':
        return <span className="badge badge-green">Bullish</span>;
      case 'bearish':
        return <span className="badge badge-red">Bearish</span>;
      default:
        return <span className="badge badge-yellow">Neutral</span>;
    }
  };

  const getSentimentColor = () => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <Link
      to={`/platform/${slug}`}
      className="card hover:border-primary-500 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${categoryColors[category]} flex items-center justify-center text-white font-bold`}>
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
              {name}
            </h3>
            <span className="text-xs text-dark-400">{categoryLabels[category]}</span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
      </div>

      {/* Stock Price */}
      {ticker && price && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-dark-700">
          <div>
            <span className="text-xs text-dark-400">{ticker}</span>
            <p className="text-lg font-semibold text-white">${price.toFixed(2)}</p>
          </div>
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Sentiment</span>
          <span className={`text-sm font-medium ${getSentimentColor()}`}>
            {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Outlook</span>
          {getOutlookBadge()}
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              sentiment > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(sentiment) * 100}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
