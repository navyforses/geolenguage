import React, { useState } from 'react';
import { Plus, X, ArrowUpDown } from 'lucide-react';

const platforms = [
  { slug: 'google', name: 'Google' },
  { slug: 'youtube', name: 'YouTube' },
  { slug: 'facebook', name: 'Facebook' },
  { slug: 'instagram', name: 'Instagram' },
  { slug: 'chatgpt', name: 'ChatGPT' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'twitter', name: 'X (Twitter)' },
  { slug: 'tiktok', name: 'TikTok' },
  { slug: 'reddit', name: 'Reddit' },
  { slug: 'linkedin', name: 'LinkedIn' }
];

const mockData = {
  google: { sentiment: 0.65, outlook: 'ზრდადი', price: 175.50, change: 3.2 },
  youtube: { sentiment: 0.45, outlook: 'ნეიტრალური', price: 175.50, change: 3.2 },
  facebook: { sentiment: -0.15, outlook: 'ნეიტრალური', price: 485.20, change: -1.5 },
  instagram: { sentiment: 0.35, outlook: 'ზრდადი', price: 485.20, change: -1.5 },
  chatgpt: { sentiment: 0.78, outlook: 'ზრდადი', price: null, change: null },
  amazon: { sentiment: 0.55, outlook: 'ზრდადი', price: 185.75, change: 2.1 },
  twitter: { sentiment: -0.25, outlook: 'კლებადი', price: null, change: null },
  tiktok: { sentiment: 0.35, outlook: 'ნეიტრალური', price: null, change: null },
  reddit: { sentiment: 0.42, outlook: 'ზრდადი', price: 125.30, change: 5.5 },
  linkedin: { sentiment: 0.38, outlook: 'ნეიტრალური', price: 425.80, change: 0.8 }
};

const getOutlookColor = (outlook) => {
  switch (outlook) {
    case 'ზრდადი': return 'text-green-400';
    case 'კლებადი': return 'text-red-400';
    default: return 'text-yellow-400';
  }
};

export default function CompareView() {
  const [selected, setSelected] = useState(['google', 'chatgpt']);

  const addPlatform = (slug) => {
    if (selected.length < 4 && !selected.includes(slug)) {
      setSelected([...selected, slug]);
    }
  };

  const removePlatform = (slug) => {
    setSelected(selected.filter(s => s !== slug));
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">შეარჩიეთ პლატფორმები შედარებისთვის (მაქს. 4)</h3>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const isSelected = selected.includes(platform.slug);
            return (
              <button
                key={platform.slug}
                onClick={() => isSelected ? removePlatform(platform.slug) : addPlatform(platform.slug)}
                disabled={!isSelected && selected.length >= 4}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : selected.length >= 4
                    ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                {platform.name}
                {isSelected && <X className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {selected.length >= 2 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-dark-400 font-medium">მეტრიკა</th>
                {selected.map((slug) => (
                  <th key={slug} className="text-center py-3 px-4 text-white font-medium">
                    {platforms.find(p => p.slug === slug)?.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark-700">
                <td className="py-3 px-4 text-dark-400">სენტიმენტის ქულა</td>
                {selected.map((slug) => (
                  <td key={slug} className="text-center py-3 px-4">
                    <span className={mockData[slug].sentiment > 0 ? 'text-green-400' : 'text-red-400'}>
                      {mockData[slug].sentiment > 0 ? '+' : ''}{mockData[slug].sentiment.toFixed(2)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-dark-700">
                <td className="py-3 px-4 text-dark-400">საბაზრო პროგნოზი</td>
                {selected.map((slug) => (
                  <td key={slug} className="text-center py-3 px-4">
                    <span className={getOutlookColor(mockData[slug].outlook)}>
                      {mockData[slug].outlook}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-dark-700">
                <td className="py-3 px-4 text-dark-400">აქციის ფასი</td>
                {selected.map((slug) => (
                  <td key={slug} className="text-center py-3 px-4">
                    {mockData[slug].price ? (
                      <span className="text-white">${mockData[slug].price.toFixed(2)}</span>
                    ) : (
                      <span className="text-dark-500">არ არის</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 text-dark-400">ფასის ცვლილება (24 სთ)</td>
                {selected.map((slug) => (
                  <td key={slug} className="text-center py-3 px-4">
                    {mockData[slug].change !== null ? (
                      <span className={mockData[slug].change >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {mockData[slug].change >= 0 ? '+' : ''}{mockData[slug].change.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-dark-500">არ არის</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selected.length < 2 && (
        <div className="card text-center py-12">
          <ArrowUpDown className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-dark-400">შეარჩიეთ მინიმუმ 2 პლატფორმა შედარებისთვის</p>
        </div>
      )}
    </div>
  );
}
