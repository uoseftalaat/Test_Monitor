import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>TestMonitor — QA Intelligence & Regression Tracking</span>
        <span>Web • API • Mobile • Powered by Firebase • Real-time Monitoring</span>
      </div>
    </footer>
  );
}
