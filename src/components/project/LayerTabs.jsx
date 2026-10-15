import React from 'react';
import { Layers, Globe, Zap, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function LayerTabs({
  selectedLayer,
  onSelectLayer,
  layers = {},
  totalTests = 0
}) {
  const layerTabs = [
    { id: 'all', name: 'All Layers', icon: Layers, count: totalTests },
    { id: 'web', name: 'Web', icon: Globe, count: layers.web?.total || 0, passRate: layers.web?.passRate, failed: layers.web?.failed },
    { id: 'api', name: 'API', icon: Zap, count: layers.api?.total || 0, passRate: layers.api?.passRate, failed: layers.api?.failed },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, count: layers.mobile?.total || 0, passRate: layers.mobile?.passRate, failed: layers.mobile?.failed },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-5 border-t border-slate-800/80 scrollbar-none">
      {layerTabs.map(tab => {
        const Icon = tab.icon;
        const isSelected = selectedLayer === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectLayer(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap',
              isSelected
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.name}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full',
                isSelected ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
              )}
            >
              {tab.count}
            </span>
            {tab.failed > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
