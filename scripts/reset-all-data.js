#!/usr/bin/env node
/**
 * Reset All Test Data to Clean Zeros (Local & Firestore)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../public/data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

const cleanSummary = { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: 100 };

const projectsConfig = [
  {
    id: 'arm',
    name: 'ARM',
    description: 'Asset & Resource Management Platform',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/arm_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'cadaa',
    name: 'Cadaa',
    description: 'Compliance & Digital Auditing Automation',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/cadaa_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'kuiper',
    name: 'Kuiper',
    description: 'High-Throughput Analytics & Telemetry Engine',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/kuiper_test',
    layers: ['web', 'api', 'mobile']
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Enterprise Geolocation & Fleet Tracking',
    repoUrl: 'https://github.com/Areeb-Innovative-Technologies/atlas_test',
    layers: ['web', 'api', 'mobile']
  }
];

// 1. Reset public/data/projects-summary.json
const globalSummaryPayload = {
  lastUpdated: null,
  totalProjects: projectsConfig.length,
  overallSummary: {
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalFlaky: 0,
    totalSkipped: 0,
    passRate: 100
  },
  projects: projectsConfig.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: null,
    summary: { ...cleanSummary },
    layers: { web: 100, api: 100, mobile: 100 }
  }))
};

fs.writeFileSync(
  path.join(DATA_DIR, 'projects-summary.json'),
  JSON.stringify(globalSummaryPayload, null, 2)
);
console.log('✅ Reset public/data/projects-summary.json to zeros');

// 2. Reset each project directory
projectsConfig.forEach(p => {
  const dirPath = path.join(PROJECTS_DIR, p.id);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Manifest
  const manifestPayload = {
    projectId: p.id,
    projectName: p.name,
    description: p.description,
    repoUrl: p.repoUrl,
    lastUpdated: null,
    retentionDays: 30,
    summary: { ...cleanSummary },
    layers: {
      web: { name: 'Web', ...cleanSummary },
      api: { name: 'API', ...cleanSummary },
      mobile: { name: 'Mobile', ...cleanSummary, notConfigured: p.id === 'arm' }
    }
  };

  fs.writeFileSync(
    path.join(dirPath, 'manifest.json'),
    JSON.stringify(manifestPayload, null, 2)
  );

  // Layer files
  ['web', 'api', 'mobile'].forEach(layer => {
    const layerPayload = {
      projectId: p.id,
      projectName: p.name,
      layer,
      layerName: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : 'Mobile',
      lastUpdated: null,
      summary: { ...cleanSummary },
      playwrightZip: null,
      playwrightZipUrl: null,
      tests: [],
      runsHistory: []
    };

    fs.writeFileSync(
      path.join(dirPath, `${layer}.json`),
      JSON.stringify(layerPayload, null, 2)
    );
  });

  console.log(`✅ Reset project [${p.id}] manifest and layers to zeros`);
});

// 3. Sync to Firestore if service-account.json is available
const credPath = path.join(__dirname, '../service-account.json');
if (fs.existsSync(credPath)) {
  console.log('🚀 Syncing clean zero state to Firestore...');
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const app = getApps().length > 0 ? getApp() : initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore(app);

    async function syncToFirestore() {
      // Set summary
      await db.doc('projects-summary/overview').set(globalSummaryPayload);
      console.log('✅ Reset Firestore [projects-summary/overview] to zeros');

      for (const p of projectsConfig) {
        const manifestPayload = {
          projectId: p.id,
          projectName: p.name,
          description: p.description,
          repoUrl: p.repoUrl,
          lastUpdated: null,
          retentionDays: 30,
          summary: { ...cleanSummary },
          layers: {
            web: { name: 'Web', ...cleanSummary },
            api: { name: 'API', ...cleanSummary },
            mobile: { name: 'Mobile', ...cleanSummary, notConfigured: p.id === 'arm' }
          }
        };
        await db.doc(`projects/${p.id}`).set(manifestPayload);

        for (const layer of ['web', 'api', 'mobile']) {
          const layerPayload = {
            projectId: p.id,
            projectName: p.name,
            layer,
            layerName: layer === 'web' ? 'Web' : layer === 'api' ? 'API' : 'Mobile',
            lastUpdated: null,
            summary: { ...cleanSummary },
            playwrightZip: null,
            playwrightZipUrl: null,
            tests: [],
            runsHistory: []
          };
          await db.doc(`projects/${p.id}/layers/${layer}`).set(layerPayload);
        }
        console.log(`✅ Reset Firestore [projects/${p.id}] to zeros`);
      }

      console.log('🎉 Successfully cleared all test data across local files AND Firestore!');
    }

    await syncToFirestore();
  } catch (err) {
    console.error('⚠️ Could not sync to Firestore:', err.message);
  }
} else {
  console.log('ℹ️ service-account.json not found, local files reset only.');
}
