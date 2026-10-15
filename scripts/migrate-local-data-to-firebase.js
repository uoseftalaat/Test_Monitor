#!/usr/bin/env node
/**
 * Seed & Migrate Local JSON Data to Firebase Firestore
 *
 * Usage:
 *   node scripts/migrate-local-data-to-firebase.js [--credentials path/to/service-account.json]
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

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = val;
      if (val !== true) i++;
    }
  }
  return params;
}

const args = parseArgs();
const credPath = args.credentials || process.env.FIREBASE_SERVICE_ACCOUNT;

function initFirebaseAdmin() {
  if (getApps().length > 0) return getApp();

  let serviceAccount = null;

  if (credPath) {
    if (fs.existsSync(credPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    } else {
      try {
        serviceAccount = JSON.parse(credPath);
      } catch (e) {
        try {
          const decoded = Buffer.from(credPath, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        } catch (_) {}
      }
    }
  }

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount)
    });
  }

  try {
    return initializeApp();
  } catch (err) {
    console.error('❌ Could not initialize Firebase Admin. Please provide FIREBASE_SERVICE_ACCOUNT secret or pass --credentials.');
    process.exit(1);
  }
}

const app = initFirebaseAdmin();
const db = getFirestore(app);

async function migrate() {
  console.log('🚀 Starting migration from public/data/ to Firebase Firestore...');

  // 1. Migrate Global Summary
  const summaryFile = path.join(DATA_DIR, 'projects-summary.json');
  if (fs.existsSync(summaryFile)) {
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    await db.doc('projects-summary/overview').set(summaryData);
    console.log('✅ Migrated projects-summary.json -> Firestore [projects-summary/overview]');
  }

  // 2. Migrate Projects
  if (fs.existsSync(PROJECTS_DIR)) {
    const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const projectId of projectDirs) {
      const dirPath = path.join(PROJECTS_DIR, projectId);

      // Manifest
      const manifestFile = path.join(dirPath, 'manifest.json');
      if (fs.existsSync(manifestFile)) {
        const manifestData = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        await db.doc(`projects/${projectId}`).set(manifestData, { merge: true });
        console.log(`✅ Migrated manifest -> Firestore [projects/${projectId}]`);
      }

      // Layers (web, api, mobile, etc.)
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file === 'manifest.json' || !file.endsWith('.json')) continue;
        const layer = path.basename(file, '.json');
        const layerFilePath = path.join(dirPath, file);
        try {
          const layerData = JSON.parse(fs.readFileSync(layerFilePath, 'utf8'));
          await db.doc(`projects/${projectId}/layers/${layer}`).set(layerData, { merge: true });
          console.log(`   ↳ Migrated layer [${layer}] (${layerData.tests?.length || 0} tests) -> Firestore [projects/${projectId}/layers/${layer}]`);
        } catch (err) {
          console.warn(`   ⚠️ Error reading layer file ${layerFilePath}:`, err.message);
        }
      }
    }
  }

  console.log('🎉 Migration completed successfully! Your Firestore database is fully populated.');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
