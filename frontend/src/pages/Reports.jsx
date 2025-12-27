import React, { useState } from 'react';
import { FileText, Download, Calendar, Clock, ChevronRight } from 'lucide-react';

const mockReports = [
  {
    id: 1,
    title: 'ყოველკვირეული ციფრული ოლიგოპოლიის ანგარიში',
    type: 'weekly',
    typeLabel: 'ყოველკვირეული',
    date: '2025-01-06',
    platforms: 10,
    highlights: [
      'ChatGPT აჩვენებს ყველაზე ძლიერ იმპულსს',
      'Google ინარჩუნებს ბაზრის ლიდერობას',
      'TikTok რეგულატორული გამოწვევების წინაშეა'
    ]
  },
  {
    id: 2,
    title: 'ყოველკვირეული ციფრული ოლიგოპოლიის ანგარიში',
    type: 'weekly',
    typeLabel: 'ყოველკვირეული',
    date: '2024-12-30',
    platforms: 10,
    highlights: [
      'სადღესასწაულო სეზონი აძლიერებს ელ-კომერციის პლატფორმებს',
      'სოციალური მედიის ჩართულობა პიკზეა',
      'AI პლატფორმებზე რეკორდული ტრაფიკი'
    ]
  },
  {
    id: 3,
    title: 'ყოველთვიური ანალიზის ანგარიში',
    type: 'monthly',
    typeLabel: 'ყოველთვიური',
    date: '2024-12-01',
    platforms: 10,
    highlights: [
      'Q4 შედეგების მიმოხილვა',
      'წლიური ტენდენციების ანალიზი',
      '2025 წლის პროგნოზები'
    ]
  }
];

const typeLabels = {
  all: 'ყველა',
  weekly: 'ყოველკვირეული',
  monthly: 'ყოველთვიური'
};

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
            <h1 className="text-3xl font-bold text-white">ანგარიშები</h1>
            <p className="text-dark-400 mt-1">ყოველკვირეული და ყოველთვიური ანალიზის ანგარიშები</p>
          </div>
        </div>

        <button className="btn btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          ანგარიშის გენერირება
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'weekly', 'monthly'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedType === type
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {typeLabels[type]}
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
                    {report.typeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(report.date).toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{report.platforms} გაანალიზებული პლატფორმა</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-dark-400 mb-2">მთავარი მომენტები:</p>
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
                ნახვა
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <p className="text-dark-400">ანგარიშები ვერ მოიძებნა</p>
        </div>
      )}

      {/* Report Preview Card */}
      <div className="card bg-gradient-to-br from-primary-900/50 to-purple-900/50 border-primary-500/30">
        <h3 className="text-lg font-semibold text-white mb-2">უახლესი ინსაიტები</h3>
        <p className="text-dark-300 mb-4">
          ჩვენი AI-ზე დაფუძნებული ანალიზი აკვირდება 10 მსხვილ ციფრულ პლატფორმას
          მრავალი მონაცემთა წყაროდან, რომ მოგაწოდოთ ქმედითი ინსაიტები და პროგნოზები.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">10</p>
            <p className="text-sm text-dark-400">პლატფორმა</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">18</p>
            <p className="text-sm text-dark-400">მონაცემთა წყარო</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="text-sm text-dark-400">მონიტორინგი</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">AI</p>
            <p className="text-sm text-dark-400">ანალიზი</p>
          </div>
        </div>
      </div>
    </div>
  );
}
