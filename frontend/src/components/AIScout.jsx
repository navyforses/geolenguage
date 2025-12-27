import React, { useState, useEffect } from 'react';

// Mock data - რეალურ ვერსიაში API-დან მოვა
const mockAssets = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 485.20, change: 3.2, score: 9.2, type: 'stock', sector: 'ტექნოლოგია', rsi: 35, volume: 280, sentiment: 82, recommendation: 'buy' },
  { symbol: 'ETH', name: 'Ethereum', price: 2450, change: 1.8, score: 8.8, type: 'crypto', sector: 'კრიპტო', rsi: 38, volume: 195, sentiment: 78, recommendation: 'buy' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.50, change: 0.9, score: 8.5, type: 'stock', sector: 'ტექნოლოგია', rsi: 52, volume: 120, sentiment: 71, recommendation: 'buy' },
  { symbol: 'BTC', name: 'Bitcoin', price: 43500, change: -0.5, score: 7.9, type: 'crypto', sector: 'კრიპტო', rsi: 48, volume: 145, sentiment: 65, recommendation: 'hold' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.1, score: 8.1, type: 'stock', sector: 'ტექნოლოგია', rsi: 42, volume: 110, sentiment: 69, recommendation: 'buy' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -1.2, score: 7.2, type: 'stock', sector: 'ავტომობილები', rsi: 58, volume: 185, sentiment: 55, recommendation: 'hold' },
  { symbol: 'SOL', name: 'Solana', price: 98.50, change: 4.5, score: 8.4, type: 'crypto', sector: 'კრიპტო', rsi: 41, volume: 220, sentiment: 75, recommendation: 'buy' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0875, change: 0.3, score: 6.8, type: 'forex', sector: 'ვალუტა', rsi: 55, volume: 100, sentiment: 52, recommendation: 'hold' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 152.30, change: 1.5, score: 7.8, type: 'stock', sector: 'ტექნოლოგია', rsi: 45, volume: 135, sentiment: 68, recommendation: 'buy' },
  { symbol: 'XRP', name: 'Ripple', price: 0.52, change: 2.8, score: 7.5, type: 'crypto', sector: 'კრიპტო', rsi: 39, volume: 175, sentiment: 62, recommendation: 'buy' },
];

export default function AIScout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    rsiBelow: 50,
    minScore: 7,
    minSentiment: 50,
    recommendation: 'all',
    highVolume: false
  });
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const applyFilters = () => {
    setIsScanning(true);

    setTimeout(() => {
      let filtered = mockAssets.filter(asset => {
        if (searchQuery && !asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filters.type !== 'all' && asset.type !== filters.type) return false;
        if (asset.rsi > filters.rsiBelow) return false;
        if (asset.score < filters.minScore) return false;
        if (asset.sentiment < filters.minSentiment) return false;
        if (filters.recommendation !== 'all' && asset.recommendation !== filters.recommendation) return false;
        if (filters.highVolume && asset.volume < 150) return false;
        return true;
      });

      filtered.sort((a, b) => b.score - a.score);
      setResults(filtered);
      setIsScanning(false);
      setLastScan(new Date());
    }, 1500);
  };

  useEffect(() => {
    applyFilters();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 8.5) return 'text-green-400';
    if (score >= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationStyle = (rec) => {
    switch(rec) {
      case 'buy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'sell': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getRecommendationText = (rec) => {
    switch(rec) {
      case 'buy': return 'იყიდე';
      case 'sell': return 'გაყიდე';
      default: return 'დაელოდე';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            AI სკაუტი
          </h1>
          <p className="text-gray-400 mt-1">ავტონომიური საინვესტიციო რადარი - 24/7 ბაზრის სკანირება</p>
        </div>
        {lastScan && (
          <div className="text-sm text-gray-500">
            ბოლო სკანირება: {lastScan.toLocaleTimeString('ka-GE')}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ძებნა და ფილტრები</h3>

        <div className="mb-4">
          <input
            type="text"
            placeholder="მოძებნე სიმბოლო ან სახელი (მაგ: AAPL, Bitcoin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">აქტივის ტიპი</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">ყველა</option>
              <option value="stock">აქციები</option>
              <option value="crypto">კრიპტო</option>
              <option value="forex">Forex</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">RSI &lt; {filters.rsiBelow}</label>
            <input
              type="range"
              min="20"
              max="80"
              value={filters.rsiBelow}
              onChange={(e) => setFilters({...filters, rsiBelow: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">მინ. ქულა: {filters.minScore}</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={filters.minScore}
              onChange={(e) => setFilters({...filters, minScore: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">სენტიმენტი &gt; {filters.minSentiment}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minSentiment}
              onChange={(e) => setFilters({...filters, minSentiment: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">რეკომენდაცია</label>
            <select
              value={filters.recommendation}
              onChange={(e) => setFilters({...filters, recommendation: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">ყველა</option>
              <option value="buy">იყიდე</option>
              <option value="hold">დაელოდე</option>
              <option value="sell">გაყიდე</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.highVolume}
                onChange={(e) => setFilters({...filters, highVolume: e.target.checked})}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600"
              />
              <span className="text-sm text-gray-300">მაღალი მოცულობა</span>
            </label>
          </div>
        </div>

        <button
          onClick={applyFilters}
          disabled={isScanning}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isScanning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isScanning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              სკანირება მიმდინარეობს...
            </span>
          ) : (
            'სკანირების დაწყება'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            AI მოხსენება - TOP {results.length} შედეგი
          </h3>
          <span className="text-sm text-gray-400">
            სკანირებული: 10,000+ აქტივი
          </span>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-4">🔍</p>
            <p>ფილტრებით შესაბამისი აქტივი ვერ მოიძებნა</p>
            <p className="text-sm mt-2">სცადეთ ფილტრების შემსუბუქება</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((asset, index) => (
              <div
                key={asset.symbol}
                className={`bg-gray-700/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-gray-700 ${
                  selectedAsset?.symbol === asset.symbol ? 'border-blue-500' : 'border-gray-600'
                }`}
                onClick={() => setSelectedAsset(selectedAsset?.symbol === asset.symbol ? null : asset)}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-500">#{index + 1}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white">{asset.symbol}</span>
                        <span className={`text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{asset.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">ფასი</p>
                      <p className="text-lg font-semibold text-white">
                        {asset.type === 'forex' ? asset.price.toFixed(4) : `$${asset.price.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">AI ქულა</p>
                      <p className={`text-2xl font-bold ${getScoreColor(asset.score)}`}>
                        {asset.score}/10
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${getRecommendationStyle(asset.recommendation)}`}>
                      {getRecommendationText(asset.recommendation)}
                    </div>
                  </div>
                </div>

                {selectedAsset?.symbol === asset.symbol && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400">RSI (14)</p>
                        <p className={`text-lg font-semibold ${asset.rsi < 30 ? 'text-green-400' : asset.rsi > 70 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {asset.rsi} {asset.rsi < 30 ? '(Oversold)' : asset.rsi > 70 ? '(Overbought)' : ''}
                        </p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400">მოცულობა</p>
                        <p className={`text-lg font-semibold ${asset.volume > 150 ? 'text-green-400' : 'text-gray-300'}`}>
                          {asset.volume}% საშუალოსი
                        </p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400">სენტიმენტი</p>
                        <p className={`text-lg font-semibold ${asset.sentiment > 70 ? 'text-green-400' : asset.sentiment > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {asset.sentiment}% დადებითი
                        </p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-xs text-gray-400">სექტორი</p>
                        <p className="text-lg font-semibold text-gray-300">{asset.sector}</p>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-2">AI-ს ანალიზი:</p>
                      <p className="text-gray-300">
                        {asset.recommendation === 'buy' && (
                          <>
                            <span className="text-green-400 font-medium">{asset.symbol}</span> აჩვენებს ძლიერ ყიდვის სიგნალებს.
                            RSI={asset.rsi} მიუთითებს {asset.rsi < 40 ? 'oversold მდგომარეობაზე' : 'ჯანსაღ დონეზე'},
                            სენტიმენტი {asset.sentiment}% დადებითია. მოცულობა საშუალოზე {asset.volume > 100 ? 'მაღალია' : 'დაბალია'}.
                          </>
                        )}
                        {asset.recommendation === 'hold' && (
                          <>
                            <span className="text-yellow-400 font-medium">{asset.symbol}</span> ნეიტრალურ ზონაშია.
                            დაელოდეთ უკეთეს შესვლის წერტილს ან დამატებით კონფირმაციას.
                          </>
                        )}
                        {asset.recommendation === 'sell' && (
                          <>
                            <span className="text-red-400 font-medium">{asset.symbol}</span> აჩვენებს გაყიდვის სიგნალებს.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-4 flex-wrap">
                      <button className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">
                        ვირტუალური ყიდვა
                      </button>
                      <button className="flex-1 min-w-[140px] bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-medium transition-colors">
                        თვალყურის დევნება
                      </button>
                      <button className="flex-1 min-w-[140px] bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-medium transition-colors">
                        სრული ანალიზი
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">სკანირებული</p>
          <p className="text-2xl font-bold text-white">10,847</p>
          <p className="text-xs text-gray-500">აქტივი</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">გაფილტრული</p>
          <p className="text-2xl font-bold text-blue-400">{results.length}</p>
          <p className="text-xs text-gray-500">პერსპექტიული</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">AI სიზუსტე</p>
          <p className="text-2xl font-bold text-green-400">73%</p>
          <p className="text-xs text-gray-500">ბოლო 30 დღე</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">შემდეგი სკანი</p>
          <p className="text-2xl font-bold text-yellow-400">ავტო</p>
          <p className="text-xs text-gray-500">ყოველ საათში</p>
        </div>
      </div>
    </div>
  );
}
