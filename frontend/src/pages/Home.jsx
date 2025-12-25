import React from 'react';
import Dashboard from '../components/Dashboard';
import LiveFeed from '../components/LiveFeed';
import AlertsPanel from '../components/AlertsPanel';

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <Dashboard />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <LiveFeed />
        <div className="card">
          <AlertsPanel limit={4} showTitle={true} />
        </div>
      </div>
    </div>
  );
}
