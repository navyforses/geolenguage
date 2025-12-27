import React from 'react';
import CompareView from '../components/CompareView';
import { GitCompare } from 'lucide-react';

export default function Compare() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
          <GitCompare className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">პლატფორმების შედარება</h1>
          <p className="text-dark-400 mt-1">4-მდე პლატფორმის გვერდიგვერდ შედარება</p>
        </div>
      </div>

      {/* შედარების ხედი */}
      <CompareView />

      {/* დამატებითი ინფორმაცია */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">შედარების მეტრიკები</h3>
          <ul className="space-y-2 text-dark-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              <span>სენტიმენტის ქულა - სოციალური მედია და სიახლეების სენტიმენტი</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>საბაზრო პროგნოზი - AI-ზე დაფუძნებული პროგნოზი</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>აქციის ფასი - რეალურ დროში საბაზრო მონაცემები</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>ფასის ცვლილება - 24-საათიანი შედეგი</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">მონაცემთა წყაროები</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-dark-400">
            <div>Alpha Vantage</div>
            <div>SEC EDGAR</div>
            <div>Reddit API</div>
            <div>HackerNews</div>
            <div>Google Trends</div>
            <div>YouTube API</div>
            <div>CoinGecko</div>
            <div>World Bank</div>
          </div>
        </div>
      </div>
    </div>
  );
}
