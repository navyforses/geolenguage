import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import PlatformCard from './PlatformCard';
import api from '../services/api';

// Fallback mock data for when API is unavailable
const fallbackPlatforms = [
  { id: 1, name: 'Google Search', slug: 'google', category: 'search', ticker: 'GOOGL', price: 175.50, change: 3.2, sentiment: 0.65, outlook: 'bullish' },
  { id: 2, name: 'YouTube', slug: 'youtube', category: 'video', ticker: 'GOOGL', price: 175.50, change: 3.2, sentiment: 0.45, outlook: 'neutral' },
  { id: 3, name: 'Facebook', slug: 'facebook', category: 'social', ticker: 'META', price: 485.20, change: -1.5, sentiment: -0.15, outlook: 'neutral' },
  { id: 4, name: 'Instagram', slug: 'instagram', category: 'social', ticker: 'META', price: 485.20, change: -1.5, sentiment: 0.35, outlook: 'bullish' },
  { id: 5, name: 'ChatGPT', slug: 'chatgpt', category: 'ai', ticker: null, sentiment: 0.78, outlook: 'bullish' },
  { id: 6, name: 'Amazon', slug: 'amazon', category: 'ecommerce', ticker: 'AMZN', price: 185.75, change: 2.1, sentiment: 0.55, outlook: 'bullish' },
  { id: 7, name: 'X (Twitter)', slug: 'twitter', category: 'social', ticker: null, sentiment: -0.25, outlook: 'bearish' },
  { id: 8, name: 'TikTok', slug: 'tiktok', category: 'video', ticker: null, sentiment: 0.35, outlook: 'neutral' },
  { id: 9, name: 'Reddit', slug: 'reddit', category: 'social', ticker: 'RDDT', price: 125.30, change: 5.5, sentiment: 0.42, outlook: 'bullish' },
  { id: 10, name: 'LinkedIn', slug: 'linkedin', category: 'professional', ticker: 'MSFT', price: 425.80, change: 0.8, sentiment: 0.38, outlook: 'neutral' }
];

export default function Dashboard() {
  const [platforms, setPlatforms] = useState(fallbackPlatforms);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Fetch live data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getDashboard();

      if (response.success && response.data) {
        // Transform API data to platform format
        const liveData = response.data.map((item, index) => ({
          id: index + 1,
          name: item.name,
          slug: item.slug,
          category: getCategoryFromSlug(item.slug),
          ticker: getTickerFromSlug(item.slug),
          price: item.stock?.price || null,
          change: item.stock?.changePercent || 0,
          sentiment: item.sentiment?.score || 0,
          outlook: getOutlookFromSentiment(item.sentiment?.score || 0)
        }));

        setPlatforms(liveData);
        setIsLive(true);
        setLastUpdate(new Date().toLocaleTimeString('ka-GE'));
      }
    } catch (err) {
      console.warn('API unavailable, using fallback data:', err.message);
      setError('API მიუწვდომელია - ნაჩვენებია დემო მონაცემები');
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCategoryFromSlug = (slug) => {
    const categories = {
      google: 'search', youtube: 'video', facebook: 'social', instagram: 'social',
      chatgpt: 'ai', amazon: 'ecommerce', twitter: 'social', tiktok: 'video',
      reddit: 'social', linkedin: 'professional'
    };
    return categories[slug] || 'other';
  };

  const getTickerFromSlug = (slug) => {
    const tickers = {
      google: 'GOOGL', youtube: 'GOOGL', facebook: 'META', instagram: 'META',
      amazon: 'AMZN', linkedin: 'MSFT', reddit: 'RDDT'
    };
    return tickers[slug] || null;
  };

  const getOutlookFromSentiment = (score) => {
    if (score >= 0.2) return 'bullish';
    if (score <= -0.2) return 'bearish';
    return 'neutral';
  };

  // Load data on mount
  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const bullishCount = platforms.filter(p => p.outlook === 'bullish').length;
  const bearishCount = platforms.filter(p => p.outlook === 'bearish').length;
  const neutralCount = platforms.filter(p => p.outlook === 'neutral').length;

  return (
    <div className="space-y-8">
      {/* სათაური */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">მთავარი პანელი</h1>
          <p className="text-dark-400 mt-1">10 წამყვანი ციფრული პლატფორმის რეალურ დროში ანალიზი</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Live status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isLive ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            {isLive ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Demo</span>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            განახლება
          </button>
        </div>
      </div>

      {/* Error/Status message */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm">
          {error}
        </div>
      )}

      {/* Last update time */}
      {lastUpdate && isLive && (
        <p className="text-dark-500 text-sm">ბოლო განახლება: {lastUpdate}</p>
      )}

      {/* შემაჯამებელი ბარათები */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">პლატფორმები</p>
              <p className="text-2xl font-bold text-white mt-1">{platforms.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">ზრდადი პროგნოზი</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{bullishCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">კლებადი პროგნოზი</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{bearishCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">ნეიტრალური</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{neutralCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Minus className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* პლატფორმების ბადე */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">პლატფორმები</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-dark-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-dark-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-dark-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
