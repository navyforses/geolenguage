import React, { useState, useEffect, useMemo, useCallback } from 'react';

// API Base URL - Vite იყენებს import.meta.env
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function AIScout() {
  // State
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
  const [allAssets, setAllAssets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [error, setError] = useState(null);

  // Portfolio & Watchlist
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('tradeGid_portfolio');
    return saved ? JSON.parse(saved) : { balance: 10000, positions: [] };
  });
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('tradeGid_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState('');
  const [notification, setNotification] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('tradeGid_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('tradeGid_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch real data from API
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/scout/scan`);
      const data = await response.json();

      if (data.success) {
        setAllAssets(data.data);
        setLastScan(new Date(data.timestamp));
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch assets');
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('მონაცემების ჩატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters to fetched data
  const applyFilters = useCallback((assets = allAssets) => {
    setIsScanning(true);

    let filtered = assets.filter(asset => {
      // Search query
      if (searchQuery && !asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Type filter
      if (filters.type !== 'all' && asset.type !== filters.type) return false;
      // RSI filter
      if (asset.rsi > filters.rsiBelow) return false;
      // Score filter
      if (asset.score < filters.minScore) return false;
      // Sentiment filter
      if (asset.sentiment < filters.minSentiment) return false;
      // Recommendation filter
      if (filters.recommendation !== 'all' && asset.recommendation !== filters.recommendation) return false;
      // Volume filter
      if (filters.highVolume && asset.volume < 150) return false;
      return true;
    });

    // Sort by score
    filtered.sort((a, b) => b.score - a.score);
    setResults(filtered);
    setIsScanning(false);
  }, [allAssets, filters, searchQuery]);

  // Search specific symbol
  const searchSymbol = async () => {
    if (!searchQuery.trim()) {
      applyFilters();
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const type = filters.type !== 'all' ? `&type=${filters.type}` : '';
      const response = await fetch(`${API_BASE}/scout/search?q=${searchQuery}${type}`);
      const data = await response.json();

      if (data.success) {
        setResults([data.data]);
      } else {
        // Try applying filters to existing assets
        applyFilters();
      }
    } catch (err) {
      console.error('Search error:', err);
      applyFilters();
    } finally {
      setIsScanning(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      const assets = await fetchAssets();
      if (assets.length > 0) {
        applyFilters(assets);
      }
    };
    loadData();
  }, []);

  // Re-apply filters when they change
  useEffect(() => {
    if (allAssets.length > 0) {
      applyFilters();
    }
  }, [filters, applyFilters]);

  // Manual scan
  const handleScan = async () => {
    setIsScanning(true);
    const assets = await fetchAssets();
    if (assets.length > 0) {
      applyFilters(assets);
    }
    setIsScanning(false);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Buy asset
  const handleBuy = () => {
    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0) {
      showNotification('შეიყვანეთ სწორი რაოდენობა', 'error');
      return;
    }

    const totalCost = amount * selectedAsset.price;
    if (totalCost > portfolio.balance) {
      showNotification('არასაკმარისი ბალანსი', 'error');
      return;
    }

    const existingPosition = portfolio.positions.find(p => p.symbol === selectedAsset.symbol);

    if (existingPosition) {
      const newAvgPrice = ((existingPosition.avgPrice * existingPosition.amount) + totalCost) / (existingPosition.amount + amount);
      setPortfolio(prev => ({
        balance: prev.balance - totalCost,
        positions: prev.positions.map(p =>
          p.symbol === selectedAsset.symbol
            ? { ...p, amount: p.amount + amount, avgPrice: newAvgPrice }
            : p
        )
      }));
    } else {
      setPortfolio(prev => ({
        balance: prev.balance - totalCost,
        positions: [...prev.positions, {
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          type: selectedAsset.type,
          amount: amount,
          avgPrice: selectedAsset.price,
          buyDate: new Date().toISOString()
        }]
      }));
    }

    showNotification(`${amount} ${selectedAsset.symbol} წარმატებით შეიძინეთ!`);
    setShowBuyModal(false);
    setBuyAmount('');
  };

  // Toggle watchlist
  const toggleWatchlist = (asset) => {
    const isInWatchlist = watchlist.some(w => w.symbol === asset.symbol);

    if (isInWatchlist) {
      setWatchlist(prev => prev.filter(w => w.symbol !== asset.symbol));
      showNotification(`${asset.symbol} წაიშალა თვალყურის სიიდან`);
    } else {
      setWatchlist(prev => [...prev, {
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        addedAt: new Date().toISOString(),
        targetPrice: asset.target
      }]);
      showNotification(`${asset.symbol} დაემატა თვალყურის სიაში`);
    }
  };

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

  const isInWatchlist = (symbol) => watchlist.some(w => w.symbol === symbol);

  // Calculate portfolio value
  const portfolioValue = useMemo(() => {
    const positionsValue = portfolio.positions.reduce((sum, pos) => {
      const currentAsset = allAssets.find(a => a.symbol === pos.symbol);
      return sum + (currentAsset ? currentAsset.price * pos.amount : pos.avgPrice * pos.amount);
    }, 0);
    return portfolio.balance + positionsValue;
  }, [portfolio, allAssets]);

  const formatPrice = (price, type) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white font-medium animate-pulse`}>
          {notification.message}
        </div>
      )}

      {/* Header with Portfolio Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI სკაუტი</h1>
          <p className="text-gray-400 mt-1">რეალური ბაზრის მონაცემები - Yahoo Finance & Binance</p>
        </div>

        {/* Mini Portfolio */}
        <div className="flex gap-4 flex-wrap">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-400">პორტფელი</p>
            <p className="text-lg font-bold text-white">${portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-400">ბალანსი</p>
            <p className="text-lg font-bold text-green-400">${portfolio.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-400">თვალყური</p>
            <p className="text-lg font-bold text-blue-400">{watchlist.length}</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={handleScan}
            className="mt-2 text-sm text-red-300 hover:text-white underline"
          >
            თავიდან ცდა
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">ძებნა და ფილტრები</h3>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="მოძებნე სიმბოლო (მაგ: AAPL, BTC, ETH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchSymbol()}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={searchSymbol}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            ძებნა
          </button>
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
          onClick={handleScan}
          disabled={isScanning || isLoading}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isScanning || isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isScanning || isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {isLoading ? 'მონაცემები იტვირთება...' : 'სკანირება მიმდინარეობს...'}
            </span>
          ) : (
            'სკანირების დაწყება'
          )}
        </button>
      </div>

      {/* Results */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-white">
            AI მოხსენება - {results.length} შედეგი
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {lastScan && (
              <span>
                ბოლო სკანირება: {lastScan.toLocaleTimeString('ka-GE')}
              </span>
            )}
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
              LIVE DATA
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-blue-500 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-gray-400">რეალური მონაცემები იტვირთება...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-4">🔍</p>
            <p>ფილტრებით შესაბამისი აქტივი ვერ მოიძებნა</p>
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
                        <span className={`px-2 py-0.5 rounded text-xs ${asset.type === 'crypto' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {asset.type === 'crypto' ? 'კრიპტო' : 'აქცია'}
                        </span>
                        <span className={`text-sm ${parseFloat(asset.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseFloat(asset.change) >= 0 ? '+' : ''}{asset.change}%
                        </span>
                        {isInWatchlist(asset.symbol) && (
                          <span className="text-yellow-400">⭐</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{asset.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">ფასი</p>
                      <p className="text-lg font-semibold text-white">
                        {formatPrice(asset.price, asset.type)}
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

                    {/* Target & Stop Loss */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">სამიზნე ფასი</p>
                        <p className="text-lg font-semibold text-green-400">
                          {formatPrice(asset.target, asset.type)}
                          <span className="text-sm ml-2">
                            (+{((asset.target - asset.price) / asset.price * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Stop-Loss</p>
                        <p className="text-lg font-semibold text-red-400">
                          {formatPrice(asset.stopLoss, asset.type)}
                          <span className="text-sm ml-2">
                            ({((asset.stopLoss - asset.price) / asset.price * 100).toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-400 mb-2">AI-ს ანალიზი:</p>
                      <p className="text-gray-300">
                        {asset.recommendation === 'buy' && (
                          <>
                            <span className="text-green-400 font-medium">{asset.symbol}</span> აჩვენებს ძლიერ ყიდვის სიგნალებს.
                            RSI={asset.rsi} მიუთითებს {asset.rsi < 40 ? 'oversold მდგომარეობაზე' : 'ჯანსაღ დონეზე'},
                            სენტიმენტი {asset.sentiment}% დადებითია. მოცულობა საშუალოზე {asset.volume > 100 ? 'მაღალია' : 'დაბალია'}.
                            <span className="text-green-400"> სამიზნე: {formatPrice(asset.target, asset.type)}</span>,
                            <span className="text-red-400"> Stop-Loss: {formatPrice(asset.stopLoss, asset.type)}</span>.
                          </>
                        )}
                        {asset.recommendation === 'hold' && (
                          <>
                            <span className="text-yellow-400 font-medium">{asset.symbol}</span> ნეიტრალურ ზონაშია.
                            დაელოდეთ უკეთეს შესვლის წერტილს. RSI={asset.rsi}, სენტიმენტი {asset.sentiment}%.
                          </>
                        )}
                        {asset.recommendation === 'sell' && (
                          <>
                            <span className="text-red-400 font-medium">{asset.symbol}</span> აჩვენებს გაყიდვის სიგნალებს.
                            RSI={asset.rsi} მიუთითებს {asset.rsi > 70 ? 'overbought მდგომარეობაზე' : 'დაცემის რისკზე'}.
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBuyModal(true);
                        }}
                        className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                      >
                        ვირტუალური ყიდვა
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(asset);
                        }}
                        className={`flex-1 min-w-[140px] py-2 rounded-lg font-medium transition-colors ${
                          isInWatchlist(asset.symbol)
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {isInWatchlist(asset.symbol) ? '⭐ სიიდან წაშლა' : 'თვალყურის დევნება'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAnalysisModal(true);
                        }}
                        className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                      >
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
          <p className="text-2xl font-bold text-white">{allAssets.length}</p>
          <p className="text-xs text-gray-500">აქტივი</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">გაფილტრული</p>
          <p className="text-2xl font-bold text-blue-400">{results.length}</p>
          <p className="text-xs text-gray-500">პერსპექტიული</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">API</p>
          <p className="text-2xl font-bold text-green-400">LIVE</p>
          <p className="text-xs text-gray-500">Yahoo + Binance</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">პოზიციები</p>
          <p className="text-2xl font-bold text-purple-400">{portfolio.positions.length}</p>
          <p className="text-xs text-gray-500">აქტიური</p>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowBuyModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">
              ვირტუალური ყიდვა - {selectedAsset.symbol}
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">მიმდინარე ფასი:</span>
                <span className="text-white font-medium">{formatPrice(selectedAsset.price, selectedAsset.type)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ხელმისაწვდომი ბალანსი:</span>
                <span className="text-green-400 font-medium">${portfolio.balance.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">რაოდენობა</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder={`მაქს: ${(portfolio.balance / selectedAsset.price).toFixed(4)}`}
                  step="any"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              {buyAmount && (
                <div className="flex justify-between text-sm bg-gray-700/50 p-3 rounded-lg">
                  <span className="text-gray-400">ჯამი:</span>
                  <span className="text-white font-bold">${(parseFloat(buyAmount || 0) * selectedAsset.price).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBuyModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-medium"
                >
                  გაუქმება
                </button>
                <button
                  onClick={handleBuy}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  ყიდვა
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAnalysisModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedAsset.symbol}</h3>
                <p className="text-gray-400">{selectedAsset.name}</p>
              </div>
              <button onClick={() => setShowAnalysisModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-4">
              {/* Price Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">მიმდინარე ფასი</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(selectedAsset.price, selectedAsset.type)}</p>
                  <p className={`text-sm ${parseFloat(selectedAsset.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(selectedAsset.change) >= 0 ? '+' : ''}{selectedAsset.change}%
                  </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">სამიზნე</p>
                  <p className="text-2xl font-bold text-green-400">{formatPrice(selectedAsset.target, selectedAsset.type)}</p>
                  <p className="text-sm text-green-400">
                    +{((selectedAsset.target - selectedAsset.price) / selectedAsset.price * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">Stop-Loss</p>
                  <p className="text-2xl font-bold text-red-400">{formatPrice(selectedAsset.stopLoss, selectedAsset.type)}</p>
                  <p className="text-sm text-red-400">
                    {((selectedAsset.stopLoss - selectedAsset.price) / selectedAsset.price * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">ტექნიკური ანალიზი</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RSI (14):</span>
                    <span className={selectedAsset.rsi < 30 ? 'text-green-400' : selectedAsset.rsi > 70 ? 'text-red-400' : 'text-yellow-400'}>
                      {selectedAsset.rsi} {selectedAsset.rsi < 30 ? '(Oversold)' : selectedAsset.rsi > 70 ? '(Overbought)' : '(ნორმალური)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">მოცულობა:</span>
                    <span className={selectedAsset.volume > 150 ? 'text-green-400' : 'text-gray-300'}>
                      {selectedAsset.volume}% საშუალოსი
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ტრენდი:</span>
                    <span className={parseFloat(selectedAsset.change) > 0 ? 'text-green-400' : 'text-red-400'}>
                      {parseFloat(selectedAsset.change) > 0 ? 'აღმავალი' : 'დაღმავალი'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ტიპი:</span>
                    <span className="text-blue-400">{selectedAsset.type === 'crypto' ? 'კრიპტო' : 'აქცია'}</span>
                  </div>
                </div>
              </div>

              {/* Sentiment */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">სენტიმენტის ანალიზი (Reddit)</h4>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">საერთო სენტიმენტი</span>
                    <span className="text-white">{selectedAsset.sentiment}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${selectedAsset.sentiment > 70 ? 'bg-green-500' : selectedAsset.sentiment > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{width: `${selectedAsset.sentiment}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* AI Score */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">AI შეფასება</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-4xl font-bold ${getScoreColor(selectedAsset.score)}`}>{selectedAsset.score}/10</p>
                    <p className="text-gray-400">საერთო ქულა</p>
                  </div>
                  <div className={`px-6 py-3 rounded-lg text-lg font-bold ${getRecommendationStyle(selectedAsset.recommendation)}`}>
                    {getRecommendationText(selectedAsset.recommendation).toUpperCase()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setShowBuyModal(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
              >
                ვირტუალური ყიდვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
