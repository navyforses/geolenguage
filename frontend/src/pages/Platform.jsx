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
    category: 'ძიება',
    parent: 'Alphabet Inc.',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.65,
    outlook: 'bullish',
    founded: 1998,
    hq: 'Mountain View, CA',
    website: 'https://www.google.com',
    description: 'მსოფლიოში უდიდესი საძიებო სისტემა, რომელიც ამუშავებს დღეში 8.5 მილიარდზე მეტ ძიებას.'
  },
  youtube: {
    name: 'YouTube',
    category: 'ვიდეო',
    parent: 'Alphabet Inc.',
    ticker: 'GOOGL',
    price: 175.50,
    change: 3.2,
    sentiment: 0.45,
    outlook: 'neutral',
    founded: 2005,
    hq: 'San Bruno, CA',
    website: 'https://www.youtube.com',
    description: 'მსოფლიოში უდიდესი ვიდეო გაზიარების პლატფორმა 2 მილიარდზე მეტი ყოველთვიური მომხმარებლით.'
  },
  facebook: {
    name: 'Facebook',
    category: 'სოციალური',
    parent: 'Meta Platforms Inc.',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: -0.15,
    outlook: 'neutral',
    founded: 2004,
    hq: 'Menlo Park, CA',
    website: 'https://www.facebook.com',
    description: 'წამყვანი სოციალური ქსელი თითქმის 3 მილიარდი ყოველთვიური აქტიური მომხმარებლით.'
  },
  instagram: {
    name: 'Instagram',
    category: 'სოციალური',
    parent: 'Meta Platforms Inc.',
    ticker: 'META',
    price: 485.20,
    change: -1.5,
    sentiment: 0.35,
    outlook: 'bullish',
    founded: 2010,
    hq: 'Menlo Park, CA',
    website: 'https://www.instagram.com',
    description: 'ფოტო და ვიდეო გაზიარების პლატფორმა 2 მილიარდზე მეტი ყოველთვიური მომხმარებლით.'
  },
  chatgpt: {
    name: 'ChatGPT',
    category: 'AI',
    parent: 'OpenAI',
    ticker: null,
    price: null,
    change: null,
    sentiment: 0.78,
    outlook: 'bullish',
    founded: 2022,
    hq: 'San Francisco, CA',
    website: 'https://chat.openai.com',
    description: 'რევოლუციური AI ჩატბოტი, რომელმაც 100 მილიონ მომხმარებელს მიაღწია 2 თვეში.'
  },
  amazon: {
    name: 'Amazon',
    category: 'ელ-კომერცია',
    parent: 'Amazon.com Inc.',
    ticker: 'AMZN',
    price: 185.75,
    change: 2.1,
    sentiment: 0.55,
    outlook: 'bullish',
    founded: 1994,
    hq: 'Seattle, WA',
    website: 'https://www.amazon.com',
    description: 'მსოფლიოში უდიდესი ელ-კომერციისა და ღრუბლოვანი გამოთვლების კომპანია.'
  },
  twitter: {
    name: 'X (Twitter)',
    category: 'სოციალური',
    parent: 'X Corp.',
    ticker: null,
    price: null,
    change: null,
    sentiment: -0.25,
    outlook: 'bearish',
    founded: 2006,
    hq: 'San Francisco, CA',
    website: 'https://twitter.com',
    description: 'რეალურ დროში სოციალური მედია პლატფორმა სიახლეებისა და საჯარო დისკუსიებისთვის.'
  },
  tiktok: {
    name: 'TikTok',
    category: 'ვიდეო',
    parent: 'ByteDance',
    ticker: null,
    price: null,
    change: null,
    sentiment: 0.35,
    outlook: 'neutral',
    founded: 2016,
    hq: 'Los Angeles, CA',
    website: 'https://www.tiktok.com',
    description: 'მოკლე ვიდეო პლატფორმა 1 მილიარდზე მეტი ყოველთვიური აქტიური მომხმარებლით.'
  },
  reddit: {
    name: 'Reddit',
    category: 'სოციალური',
    parent: 'Reddit Inc.',
    ticker: 'RDDT',
    price: 125.30,
    change: 5.5,
    sentiment: 0.42,
    outlook: 'bullish',
    founded: 2005,
    hq: 'San Francisco, CA',
    website: 'https://www.reddit.com',
    description: 'საზოგადოებაზე დაფუძნებული დისკუსიის პლატფორმა მილიონობით აქტიური საზოგადოებით.'
  },
  linkedin: {
    name: 'LinkedIn',
    category: 'პროფესიონალური',
    parent: 'Microsoft Corp.',
    ticker: 'MSFT',
    price: 425.80,
    change: 0.8,
    sentiment: 0.38,
    outlook: 'neutral',
    founded: 2002,
    hq: 'Sunnyvale, CA',
    website: 'https://www.linkedin.com',
    description: 'პროფესიონალური ქსელის პლატფორმა 900 მილიონზე მეტი წევრით.'
  }
};

const outlookLabels = {
  bullish: 'ზრდადი',
  bearish: 'კლებადი',
  neutral: 'ნეიტრალური'
};

export default function Platform() {
  const { slug } = useParams();
  const platform = platformData[slug];

  if (!platform) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">პლატფორმა ვერ მოიძებნა</h1>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          მთავარ პანელზე დაბრუნება
        </Link>
      </div>
    );
  }

  const getOutlookBadge = () => {
    switch (platform.outlook) {
      case 'bullish':
        return <span className="badge badge-green text-sm">{outlookLabels.bullish}</span>;
      case 'bearish':
        return <span className="badge badge-red text-sm">{outlookLabels.bearish}</span>;
      default:
        return <span className="badge badge-yellow text-sm">{outlookLabels.neutral}</span>;
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
              <p className="text-dark-400 text-sm">სენტიმენტი</p>
              <p className={`text-2xl font-bold mt-1 ${platform.sentiment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {platform.sentiment > 0 ? '+' : ''}{platform.sentiment.toFixed(2)}
              </p>
              <p className="text-xs text-dark-500 mt-1">სოციალური მედიის ქულა</p>
            </div>

            <div className="card">
              <p className="text-dark-400 text-sm">საბაზრო პროგნოზი</p>
              <p className={`text-2xl font-bold mt-1 ${
                platform.outlook === 'bullish' ? 'text-green-400' :
                platform.outlook === 'bearish' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {outlookLabels[platform.outlook]}
              </p>
              <p className="text-xs text-dark-500 mt-1">30-დღიანი პროგნოზი</p>
            </div>

            <div className="card">
              <p className="text-dark-400 text-sm">კატეგორია</p>
              <p className="text-2xl font-bold text-white mt-1">{platform.category}</p>
              <p className="text-xs text-dark-500 mt-1">პლატფორმის ტიპი</p>
            </div>
          </div>

          {/* Charts */}
          <ForecastChart title="ფასის ისტორია და პროგნოზი" type="line" />
          <ForecastChart title="სენტიმენტის ტრენდი" type="area" />

          {/* AI Analysis */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">AI ანალიზი</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-dark-300 mb-2">მიმოხილვა</h4>
                <p className="text-dark-400">{platform.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">ძლიერი მხარეები</h4>
                  <ul className="space-y-1 text-sm text-dark-400">
                    <li>• მყარი საბაზრო პოზიცია</li>
                    <li>• დივერსიფიცირებული შემოსავლის წყაროები</li>
                    <li>• მაღალი მომხმარებელთა ჩართულობა</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">რისკები</h4>
                  <ul className="space-y-1 text-sm text-dark-400">
                    <li>• რეგულატორული გამოწვევები</li>
                    <li>• კონკურენციის ზეწოლა</li>
                    <li>• ბაზრის გაჯერება</li>
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
            <h3 className="text-lg font-semibold text-white mb-4">პლატფორმის ინფორმაცია</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">მშობელი კომპანია</p>
                  <p className="text-white">{platform.parent}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">დაარსდა</p>
                  <p className="text-white">{platform.founded}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">სათაო ოფისი</p>
                  <p className="text-white">{platform.hq}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm text-dark-400">ვებსაიტი</p>
                  <a
                    href={platform.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
                  >
                    გადასვლა <ExternalLink className="w-3 h-3" />
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
