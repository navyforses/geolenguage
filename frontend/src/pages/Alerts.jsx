import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Shield,
  Check,
  Trash2,
  Filter
} from 'lucide-react';

const mockAlerts = [
  {
    id: 1,
    type: 'price_change',
    severity: 'medium',
    platform: 'Google',
    platformSlug: 'google',
    title: 'GOOGL გაიზარდა 3.2%-ით AI განცხადებების გამო',
    description: 'Alphabet-ის აქცია გაიზარდა Google Search-ისა და Cloud სერვისების ახალი AI ფუნქციების გამოცხადების შემდეგ.',
    time: '2 საათის წინ',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false
  },
  {
    id: 2,
    type: 'trend_shift',
    severity: 'high',
    platform: 'ChatGPT',
    platformSlug: 'chatgpt',
    title: 'ChatGPT ტრენდულია გლობალურად',
    description: 'მნიშვნელოვანი ზრდა ძიების ინტერესში და სოციალური მედიის ხსენებებში. Google Trends აჩვენებს 95% ინტერესის ქულას.',
    time: '4 საათის წინ',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: false
  },
  {
    id: 3,
    type: 'risk_warning',
    severity: 'high',
    platform: 'TikTok',
    platformSlug: 'tiktok',
    title: 'TikTok რეგულატორული შეშფოთება',
    description: 'ახალი კანონმდებლობა შემოთავაზებულია რამდენიმე ქვეყანაში, რომელმაც შეიძლება გავლენა მოახდინოს პლატფორმის ოპერაციებსა და მონაცემების დამუშავებაზე.',
    time: '6 საათის წინ',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: 4,
    type: 'news',
    severity: 'low',
    platform: 'X (Twitter)',
    platformSlug: 'twitter',
    title: 'X აცხადებს ახალ ფუნქციებს',
    description: 'პლატფორმის განახლებები მოიცავს გაუმჯობესებულ ვიდეო შესაძლებლობებს და ახალ მონეტიზაციის ვარიანტებს კრეატორებისთვის.',
    time: '8 საათის წინ',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: 5,
    type: 'price_change',
    severity: 'high',
    platform: 'Reddit',
    platformSlug: 'reddit',
    title: 'RDDT გაიზარდა 5.5%-ით შემოსავლების გადამეტებით',
    description: 'Reddit-ის აქცია გაიზარდა მოსალოდნელზე უკეთესი კვარტალური შემოსავლებისა და მომხმარებელთა ზრდის შესახებ მოხსენების შემდეგ.',
    time: '12 საათის წინ',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: true
  },
  {
    id: 6,
    type: 'anomaly',
    severity: 'medium',
    platform: 'YouTube',
    platformSlug: 'youtube',
    title: 'აღმოჩენილია უჩვეულო ტრაფიკის ნიმუში',
    description: 'YouTube-ის ტრენდული გვერდი აჩვენებს 40%-ით მაღალ ჩართულობას ისტორიულ საშუალოსთან შედარებით.',
    time: '1 დღის წინ',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true
  }
];

const alertIcons = {
  price_change: TrendingUp,
  trend_shift: TrendingUp,
  risk_warning: Shield,
  news: Newspaper,
  anomaly: AlertTriangle
};

const severityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  critical: 'bg-red-600/30 text-red-300 border-red-500/50'
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread' && alert.isRead) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAsRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center relative">
            <Bell className="w-6 h-6 text-primary-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">შეტყობინებები</h1>
            <p className="text-dark-400 mt-1">{unreadCount} წაუკითხავი შეტყობინება</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            ყველას წაკითხულად მონიშვნა
          </button>
        )}
      </div>

      {/* ფილტრები */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            ყველა
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            წაუკითხავი
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input bg-dark-700 border-dark-600 text-white"
          >
            <option value="all">ყველა დონე</option>
            <option value="low">დაბალი</option>
            <option value="medium">საშუალო</option>
            <option value="high">მაღალი</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const Icon = alertIcons[alert.type] || AlertTriangle;

          return (
            <div
              key={alert.id}
              className={`card ${severityColors[alert.severity]} ${
                alert.isRead ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>

                  <p className="text-dark-300 mb-3">{alert.description}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="badge badge-gray">{alert.platform}</span>
                    <span className="text-dark-500">{alert.time}</span>
                    <span className="capitalize text-dark-500">{alert.type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!alert.isRead && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="p-2 rounded-lg hover:bg-dark-600 text-dark-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-dark-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-dark-400">თქვენი ფილტრებით შეტყობინებები ვერ მოიძებნა</p>
        </div>
      )}
    </div>
  );
}
