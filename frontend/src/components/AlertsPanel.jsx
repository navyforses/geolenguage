import React from 'react';
import { AlertTriangle, TrendingUp, Newspaper, Shield, X } from 'lucide-react';

const mockAlerts = [
  {
    id: 1,
    type: 'price_change',
    severity: 'medium',
    platform: 'Google',
    title: 'GOOGL up 3.2% on AI announcements',
    description: 'Alphabet stock rose following announcements of new AI features',
    time: '2 hours ago',
    isRead: false
  },
  {
    id: 2,
    type: 'trend_shift',
    severity: 'high',
    platform: 'ChatGPT',
    title: 'ChatGPT trending globally',
    description: 'Significant increase in search interest and social media mentions',
    time: '4 hours ago',
    isRead: false
  },
  {
    id: 3,
    type: 'risk_warning',
    severity: 'high',
    platform: 'TikTok',
    title: 'TikTok regulatory concerns',
    description: 'New legislation proposed that may affect platform operations',
    time: '6 hours ago',
    isRead: true
  },
  {
    id: 4,
    type: 'news',
    severity: 'low',
    platform: 'Twitter',
    title: 'X announces new features',
    description: 'Platform updates include enhanced video capabilities',
    time: '8 hours ago',
    isRead: true
  }
];

const alertIcons = {
  price_change: TrendingUp,
  trend_shift: TrendingUp,
  risk_warning: Shield,
  news: Newspaper
};

const severityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  critical: 'bg-red-600/30 text-red-300 border-red-500/50'
};

export default function AlertsPanel({ limit = 5, showTitle = true }) {
  const alerts = mockAlerts.slice(0, limit);

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
          <span className="badge badge-red">{mockAlerts.filter(a => !a.isRead).length} new</span>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type] || AlertTriangle;

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${severityColors[alert.severity]} ${
                alert.isRead ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-white truncate">{alert.title}</h4>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-dark-300 mt-1">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-dark-400">{alert.platform}</span>
                    <span className="text-dark-600">•</span>
                    <span className="text-xs text-dark-400">{alert.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8 text-dark-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No alerts at this time</p>
        </div>
      )}
    </div>
  );
}
