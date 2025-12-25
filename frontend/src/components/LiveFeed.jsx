import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, MessageSquare, Zap } from 'lucide-react';

const generateFeedItems = () => [
  {
    id: 1,
    type: 'stock',
    platform: 'Google',
    ticker: 'GOOGL',
    value: 175.50,
    change: 1.2,
    time: 'Just now'
  },
  {
    id: 2,
    type: 'sentiment',
    platform: 'ChatGPT',
    source: 'Reddit',
    sentiment: 0.85,
    time: '1 min ago'
  },
  {
    id: 3,
    type: 'mention',
    platform: 'TikTok',
    source: 'HackerNews',
    count: 15,
    time: '2 min ago'
  },
  {
    id: 4,
    type: 'stock',
    platform: 'Meta',
    ticker: 'META',
    value: 485.20,
    change: -0.8,
    time: '3 min ago'
  },
  {
    id: 5,
    type: 'trend',
    platform: 'YouTube',
    topic: 'AI Content',
    interest: 95,
    time: '5 min ago'
  }
];

const feedIcons = {
  stock: Activity,
  sentiment: MessageSquare,
  mention: Zap,
  trend: TrendingUp
};

export default function LiveFeed() {
  const [items, setItems] = useState(generateFeedItems());
  const [isLive, setIsLive] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Add a new item occasionally
      if (Math.random() > 0.7) {
        const newItem = {
          id: Date.now(),
          type: ['stock', 'sentiment', 'mention', 'trend'][Math.floor(Math.random() * 4)],
          platform: ['Google', 'ChatGPT', 'Amazon', 'TikTok', 'Meta'][Math.floor(Math.random() * 5)],
          time: 'Just now',
          ...(Math.random() > 0.5 ? { ticker: 'GOOGL', value: 175 + Math.random() * 5, change: (Math.random() - 0.5) * 3 } : {}),
          sentiment: Math.random(),
          count: Math.floor(Math.random() * 20),
          interest: Math.floor(Math.random() * 100)
        };

        setItems(prev => [newItem, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Live Feed</h3>
          {isLive && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`btn btn-ghost text-sm ${isLive ? 'text-green-400' : 'text-dark-400'}`}
        >
          {isLive ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = feedIcons[item.type] || Activity;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 ${
                index === 0 && isLive ? 'animate-pulse-slow' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center">
                <Icon className="w-4 h-4 text-dark-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{item.platform}</span>
                  {item.ticker && (
                    <span className="text-xs text-dark-400">{item.ticker}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {item.value && (
                    <span className="text-dark-300">${item.value.toFixed(2)}</span>
                  )}
                  {item.change !== undefined && (
                    <span className={item.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  )}
                  {item.sentiment !== undefined && (
                    <span className={item.sentiment > 0.5 ? 'text-green-400' : 'text-red-400'}>
                      Sentiment: {(item.sentiment * 100).toFixed(0)}%
                    </span>
                  )}
                  {item.count !== undefined && (
                    <span className="text-dark-300">{item.count} mentions</span>
                  )}
                  {item.interest !== undefined && (
                    <span className="text-dark-300">Interest: {item.interest}%</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-dark-500">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
