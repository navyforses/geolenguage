import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Platform from './pages/Platform';
import Compare from './pages/Compare';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import RiskManagement from './components/RiskManagement';

function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/platform/:slug" element={<Platform />} />
          <Route path="/risk" element={<RiskManagement />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
