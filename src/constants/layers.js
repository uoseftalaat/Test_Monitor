import { Globe, Zap, Smartphone, Layers } from 'lucide-react';

export const LAYER_KEYS = ['web', 'api', 'mobile'];

export const LAYERS_CONFIG = {
  all: {
    id: 'all',
    name: 'All Layers',
    shortName: 'All',
    icon: Layers,
    color: 'blue'
  },
  web: {
    id: 'web',
    name: 'Web (Playwright)',
    shortName: 'Web',
    icon: Globe,
    color: 'blue'
  },
  api: {
    id: 'api',
    name: 'API (Playwright)',
    shortName: 'API',
    icon: Zap,
    color: 'amber'
  },
  mobile: {
    id: 'mobile',
    name: 'Mobile (Appium / E2E)',
    shortName: 'Mobile',
    icon: Smartphone,
    color: 'purple'
  }
};

export const DEFAULT_LAYER_SUMMARY = {
  total: 0,
  passed: 0,
  failed: 0,
  flaky: 0,
  skipped: 0,
  passRate: 100
};
