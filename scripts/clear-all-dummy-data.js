import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../public/data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

// Remove any legacy root-level project files
['arm.json', 'atlas.json', 'cadaa.json', 'kuiper.json'].forEach(f => {
  const p = path.join(PROJECTS_DIR, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// 1. Clean ARM API: Remove the 5 dummy tests from earlier seed, keep only the real pipeline test cases!
const armApiPath = path.join(PROJECTS_DIR, 'arm/api.json');
let armApiSummary = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 };
let armLastUpdated = null;

if (fs.existsSync(armApiPath)) {
  try {
    const rawContent = fs.readFileSync(armApiPath, 'utf8').trim();
    if (rawContent.length > 0) {
      const armApi = JSON.parse(rawContent);
      armLastUpdated = armApi.lastUpdated;
      
      // Filter out only the initial 5 mock tests
      const realTests = (armApi.tests || []).filter(t =>
        !t.id.startsWith('arm-api-encryption') &&
        !t.id.startsWith('arm-api-project') &&
        !t.id.startsWith('arm-api-estimation') &&
        !t.id.startsWith('arm-api-filtered') &&
        !t.id.startsWith('arm-api-assigned')
      );

      const total = realTests.length;
      const passed = realTests.filter(t => t.currentStatus === 'passed').length;
      const failed = realTests.filter(t => t.currentStatus === 'failed').length;
      const flaky = realTests.filter(t => t.currentStatus === 'flaky').length;
      const skipped = realTests.filter(t => t.currentStatus === 'skipped').length;
      const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;

      armApi.tests = realTests;
      armApi.summary = { total, passed, failed, flaky, skipped, passRate };
      armApiSummary = armApi.summary;

      fs.writeFileSync(armApiPath, JSON.stringify(armApi, null, 2));
      console.log(`Cleaned ARM API (removed dummy tests). Real tests remaining: ${total}`);
    }
  } catch (err) {
    console.warn('Could not parse ARM API file:', err.message);
  }
}

// 2. Clean ARM Web: Keep real pipeline tests from arm/web.json
const armWebPath = path.join(PROJECTS_DIR, 'arm/web.json');
let armWebSummary = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 };
let armWebLastUpdated = null;

if (fs.existsSync(armWebPath)) {
  try {
    const rawContent = fs.readFileSync(armWebPath, 'utf8').trim();
    if (rawContent.length > 0) {
      const armWeb = JSON.parse(rawContent);
      armWebLastUpdated = armWeb.lastUpdated;
      
      const realTests = (armWeb.tests || []).filter(t =>
        !t.id.startsWith('arm-web-dummy') &&
        !t.id.startsWith('arm-web-mock')
      );

      const total = realTests.length;
      const passed = realTests.filter(t => t.currentStatus === 'passed').length;
      const failed = realTests.filter(t => t.currentStatus === 'failed').length;
      const flaky = realTests.filter(t => t.currentStatus === 'flaky').length;
      const skipped = realTests.filter(t => t.currentStatus === 'skipped').length;
      const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;

      armWeb.tests = realTests;
      armWeb.summary = { total, passed, failed, flaky, skipped, passRate };
      armWebSummary = armWeb.summary;

      fs.writeFileSync(armWebPath, JSON.stringify(armWeb, null, 2));
      console.log(`Preserved real ARM Web tests: ${total} (Passed: ${passed}, Failed: ${failed}, Flaky: ${flaky})`);
    }
  } catch (err) {
    console.warn('Could not parse ARM Web file:', err.message);
  }
}

// 3. Remove ARM Mobile (ARM has no mobile surface)
const armMobilePath = path.join(PROJECTS_DIR, 'arm/mobile.json');
if (fs.existsSync(armMobilePath)) fs.unlinkSync(armMobilePath);

// Combined ARM Summary
const armCombinedTotal = armApiSummary.total + armWebSummary.total;
const armCombinedPassed = armApiSummary.passed + armWebSummary.passed;
const armCombinedFailed = armApiSummary.failed + armWebSummary.failed;
const armCombinedFlaky = armApiSummary.flaky + armWebSummary.flaky;
const armCombinedSkipped = armApiSummary.skipped + armWebSummary.skipped;
const armCombinedPassRate = armCombinedTotal > 0 ? Number(((armCombinedPassed / armCombinedTotal) * 100).toFixed(1)) : 100;

const armOverallSummary = {
  total: armCombinedTotal,
  passed: armCombinedPassed,
  failed: armCombinedFailed,
  flaky: armCombinedFlaky,
  skipped: armCombinedSkipped,
  passRate: armCombinedPassRate
};

// 4. Update ARM manifest
const armManifestPath = path.join(PROJECTS_DIR, 'arm/manifest.json');
const armManifest = {
  projectId: 'arm',
  projectName: 'ARM',
  description: 'Asset & Resource Management Platform',
  repoUrl: 'https://github.com/Areeb-Innovative-Technologies/arm_test',
  lastUpdated: armWebLastUpdated || armLastUpdated,
  retentionDays: 30,
  summary: armOverallSummary,
  layers: {
    web: armWebSummary,
    api: armApiSummary,
    mobile: { name: 'Mobile', total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100, notConfigured: true }
  }
};
fs.writeFileSync(armManifestPath, JSON.stringify(armManifest, null, 2));

// 5. Clean other projects: Cadaa, Kuiper, Atlas
const otherProjects = [
  { id: 'cadaa', name: 'Cadaa', desc: 'Compliance & Digital Auditing Automation', repo: 'https://github.com/Areeb-Innovative-Technologies/cadaa_test', layers: ['web', 'api', 'mobile'] },
  { id: 'kuiper', name: 'Kuiper', desc: 'High-Throughput Analytics & Telemetry Engine', repo: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test', layers: ['web', 'api'] },
  { id: 'atlas', name: 'Atlas', desc: 'Enterprise Geolocation & Fleet Tracking', repo: 'https://github.com/Areeb-Innovative-Technologies/atlas_test', layers: ['web', 'api', 'mobile'] }
];

for (const p of otherProjects) {
  const pDir = path.join(PROJECTS_DIR, p.id);
  if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

  const allLayers = ['web', 'api', 'mobile'];
  const layersMeta = {};

  allLayers.forEach(layer => {
    const lPath = path.join(pDir, `${layer}.json`);
    const isConfigured = p.layers.includes(layer);
    const layerName = layer === 'web' ? 'Web' : layer === 'api' ? 'API' : 'Mobile';

    if (isConfigured) {
      const payload = {
        projectId: p.id,
        projectName: p.name,
        layer,
        layerName,
        lastUpdated: null,
        summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
        tests: [],
        runsHistory: []
      };
      fs.writeFileSync(lPath, JSON.stringify(payload, null, 2));
      layersMeta[layer] = { name: layerName, total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 };
    } else {
      if (fs.existsSync(lPath)) fs.unlinkSync(lPath);
      layersMeta[layer] = { name: layerName, total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100, notConfigured: true };
    }
  });

  const manifest = {
    projectId: p.id,
    projectName: p.name,
    description: p.desc,
    repoUrl: p.repo,
    lastUpdated: null,
    retentionDays: 30,
    summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
    layers: layersMeta
  };
  fs.writeFileSync(path.join(pDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Cleaned project ${p.name}: reset all dummy data to 0.`);
}

// 6. Update global summary file: public/data/projects-summary.json
const globalSummary = {
  lastUpdated: armWebLastUpdated || armLastUpdated,
  totalProjects: 4,
  overallSummary: {
    totalTests: armCombinedTotal,
    totalPassed: armCombinedPassed,
    totalFailed: armCombinedFailed,
    totalFlaky: armCombinedFlaky,
    totalSkipped: armCombinedSkipped,
    passRate: armCombinedPassRate
  },
  projects: [
    {
      id: 'arm',
      name: 'ARM',
      description: 'Asset & Resource Management Platform',
      repoUrl: 'https://github.com/Areeb-Innovative-Technologies/arm_test',
      lastUpdated: armWebLastUpdated || armLastUpdated,
      summary: armOverallSummary,
      layers: { web: armWebSummary.passRate, api: armApiSummary.passRate, mobile: 100 }
    },
    {
      id: 'cadaa',
      name: 'Cadaa',
      description: 'Compliance & Digital Auditing Automation',
      repoUrl: 'https://github.com/Areeb-Innovative-Technologies/cadaa_test',
      lastUpdated: null,
      summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
      layers: { web: 100, api: 100, mobile: 100 }
    },
    {
      id: 'kuiper',
      name: 'Kuiper',
      description: 'High-Throughput Analytics & Telemetry Engine',
      repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
      lastUpdated: null,
      summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
      layers: { web: 100, api: 100, mobile: 100 }
    },
    {
      id: 'atlas',
      name: 'Atlas',
      description: 'Enterprise Geolocation & Fleet Tracking',
      repoUrl: 'https://github.com/Areeb-Innovative-Technologies/atlas_test',
      lastUpdated: null,
      summary: { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 },
      layers: { web: 100, api: 100, mobile: 100 }
    }
  ]
};

fs.writeFileSync(path.join(DATA_DIR, 'projects-summary.json'), JSON.stringify(globalSummary, null, 2));
console.log('✅ Successfully removed all dummy data for all projects.');
