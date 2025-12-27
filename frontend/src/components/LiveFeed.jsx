import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, MessageSquare, Zap, Newspaper, RefreshCw } from 'lucide-react';
import api from '../services/api';

// Fallback feed items when API is unavailable
const fallbackItems = [
  { id: 1, type: 'stock', platform: 'google', platformName: 'Google', title: 'Google აქცია: $175.50', description: '+1.2% ცვლილება', sentiment: 'positive', timestamp: new Date().toISOString() },
  { id: 2, type: 'social', platform: 'chatgpt', platformName: 'ChatGPT', title: 'Reddit: AI ტრენდები...', description: '245 upvotes • 34 კომენტარი', timestamp: new Date().toISOString() },
  { id: 3, type: 'stock', platform: 'amazon', platformName: 'Amazon', title: 'Amazon აქცია: $185.75', description: '+2.1% ცვლილება', sentiment: 'positive', timestamp: new Date().toISOString() },
  { id: 4, type: 'news', platform: 'meta', platformName: 'Meta', title: 'Meta-ს ახალი AI პროდუქტი...', description: 'TechCrunch', timestamp: new Date().toISOString() },
  { id: 5, type: 'stock', platform: 'reddit', platformName: 'Reddit', title: 'Reddit აქცია: $125.30', description: '+5.5% ცვლილება', sentiment: 'positive', timestamp: new Date().toISOString() }
];

const feedIcons = {
  stock: Activity,
  social: MessageSquare,
  news: Newspaper,
  sentiment: TrendingUp
};

export default function LiveFeed() {
  const [items, setItems] = useState(fallbackItems);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch live feed from API
  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await api.getLiveFeed(10);
      if (response.success && response.feed) {
        const formattedItems = response.feed.map((item, index) => ({
          id: index + 1,
          ...item
        }));
        setItems(formattedItems);
        setIsConnected(true);
      }
    } catch (error) {
      console.warn('Live feed API unavailable:', error.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchFeed();

    if (!isLive) return;

    // Refresh every 30 seconds
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Format timestamp to Georgian
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'ახლახან';
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    return date.toLocaleDateString('ka-GE');
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'text-green-400';
    if (sentiment === 'negative') return 'text-red-400';
    return 'text-dark-300';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">პირდაპირი არხი</h3>
          {isLive && isConnected && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">ცოცხალი</span>
            </span>
          )}
          {!isConnected && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-yellow-400">დემო</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="btn btn-ghost p-1"
            title="განახლება"
          >
            <RefreshCw className={`w-4 h-4 text-dark-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`btn btn-ghost text-sm ${isLive ? 'text-green-400' : 'text-dark-400'}`}
          >
            {isLive ? 'პაუზა' : 'გაგრძელება'}
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = feedIcons[item.type] || Activity;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors cursor-pointer ${
                index === 0 && isLive ? 'animate-pulse-slow' : ''
              }`}
              onClick={() => item.url && window.open(item.url, '_blank')}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                item.type === 'stock' ? 'bg-primary-500/20' :
                item.type === 'news' ? 'bg-blue-500/20' :
                item.type === 'social' ? 'bg-purple-500/20' :
                'bg-dark-600'
              }`}>
                <Icon className={`w-4 h-4 ${
                  item.type === 'stock' ? 'text-primary-400' :
                  item.type === 'news' ? 'text-blue-400' :
                  item.type === 'social' ? 'text-purple-400' :
                  'text-dark-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{item.title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={getSentimentColor(item.sentiment)}>
                    {item.description}
                  </span>
                  {item.source && (
                    <span className="text-dark-500">• {item.source}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-dark-500 whitespace-nowrap">
                {formatTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
