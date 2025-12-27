import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from 'lucide-react';
import PlatformCard from './PlatformCard';

const mockPlatforms = [
  {
    id: 1,
    name: 'Google Search',
    slug: 'google',
    category: 'search',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.65,
    outlook: 'bullish'
  },
  {
    id: 2,
    name: 'YouTube',
    slug: 'youtube',
    category: 'video',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.45,
    outlook: 'neutral'
  },
  {
    id: 3,
    name: 'Facebook',
    slug: 'facebook',
    category: 'social',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: -0.15,
    outlook: 'neutral'
  },
  {
    id: 4,
    name: 'Instagram',
    slug: 'instagram',
    category: 'social',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: 0.35,
    outlook: 'bullish'
  },
  {
    id: 5,
    name: 'ChatGPT',
    slug: 'chatgpt',
    category: 'ai',
    ticker: null,
    sentiment: 0.78,
    outlook: 'bullish'
  },
  {
    id: 6,
    name: 'Amazon',
    slug: 'amazon',
    category: 'ecommerce',
    ticker: 'AMZN',
    price: 185.75,
    change: 2.1,
    sentiment: 0.55,
    outlook: 'bullish'
  },
  {
    id: 7,
    name: 'X (Twitter)',
    slug: 'twitter',
    category: 'social',
    ticker: null,
    sentiment: -0.25,
    outlook: 'bearish'
  },
  {
    id: 8,
    name: 'TikTok',
    slug: 'tiktok',
    category: 'video',
    ticker: null,
    sentiment: 0.35,
    outlook: 'neutral'
  },
  {
    id: 9,
    name: 'Reddit',
    slug: 'reddit',
    category: 'social',
    ticker: 'RDDT',
    price: 125.30,
    change: 5.5,
    sentiment: 0.42,
    outlook: 'bullish'
  },
  {
    id: 10,
    name: 'LinkedIn',
    slug: 'linkedin',
    category: 'professional',
    ticker: 'MSFT',
    price: 425.80,
    change: 0.8,
    sentiment: 0.38,
    outlook: 'neutral'
  }
];

export default function Dashboard() {
  const bullishCount = mockPlatforms.filter(p => p.outlook === 'bullish').length;
  const bearishCount = mockPlatforms.filter(p => p.outlook === 'bearish').length;
  const neutralCount = mockPlatforms.filter(p => p.outlook === 'neutral').length;

  return (
    <div className="space-y-8">
      {/* სათაური */}
      <div>
        <h1 className="text-3xl font-bold text-white">მთავარი პანელი</h1>
        <p className="text-dark-400 mt-1">10 წამყვანი ციფრული პლატფორმის რეალურ დროში ანალიზი</p>
      </div>

      {/* შემაჯამებელი ბარათები */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-400 text-sm">პლატფორმები</p>
              <p className="text-2xl font-bold text-white mt-1">{mockPlatforms.length}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockPlatforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>
    </div>
  );
}
