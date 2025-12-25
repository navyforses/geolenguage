import React, { useState } from 'react';
import { FileText, Download, Calendar, Clock, ChevronRight } from 'lucide-react';

const mockReports = [
  {
    id: 1,
    title: 'Weekly Digital Oligopoly Report',
    type: 'weekly',
    date: '2025-01-06',
    platforms: 10,
    highlights: [
      'ChatGPT shows strongest momentum',
      'Google maintains market leadership',
      'TikTok faces regulatory headwinds'
    ]
  },
  {
    id: 2,
    title: 'Weekly Digital Oligopoly Report',
    type: 'weekly',
    date: '2024-12-30',
    platforms: 10,
    highlights: [
      'Holiday season boosts e-commerce platforms',
      'Social media engagement peaks',
      'AI platforms see record traffic'
    ]
  },
  {
    id: 3,
    title: 'Monthly Analysis Report',
    type: 'monthly',
    date: '2024-12-01',
    platforms: 10,
    highlights: [
      'Q4 performance review',
      'Annual trends analysis',
      '2025 outlook predictions'
    ]
  }
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState('all');

  const filteredReports = selectedType === 'all'
    ? mockReports
    : mockReports.filter(r => r.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-dark-400 mt-1">Weekly and monthly analysis reports</p>
          </div>
        </div>

        <button className="btn btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'weekly', 'monthly'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              selectedType === type
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="card hover:border-primary-500 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                  <span className={`badge ${
                    report.type === 'weekly' ? 'badge-blue' : 'badge-green'
                  }`}>
                    {report.type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{report.platforms} platforms analyzed</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-dark-400 mb-2">Key Highlights:</p>
                  <ul className="space-y-1">
                    {report.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-dark-300">
                        <ChevronRight className="w-4 h-4 text-primary-400" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button className="btn btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-dark-400">No reports found</p>
        </div>
      )}

      {/* Report Preview Card */}
      <div className="card bg-gradient-to-br from-primary-900/50 to-purple-900/50 border-primary-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">Latest Insights</h3>
        <p className="text-dark-300 mb-4">
          Our AI-powered analysis tracks 10 major digital platforms across multiple data sources
          to provide actionable insights and forecasts.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">10</p>
            <p className="text-sm text-dark-400">Platforms</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">18</p>
            <p className="text-sm text-dark-400">Data Sources</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="text-sm text-dark-400">Monitoring</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">AI</p>
            <p className="text-sm text-dark-400">Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
}
