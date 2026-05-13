import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Backend root (folder that contains server.js), even if cwd is wrong */
const BACKEND_ROOT = path.join(__dirname, '..');

let initialized = false;
let initFailed = false;

function tryLoadCredentials() {
  let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson && rawJson.trim()) {
    rawJson = rawJson.trim();
    // .env sometimes wraps JSON in single quotes
    if (rawJson.startsWith("'") && rawJson.endsWith("'")) {
      rawJson = rawJson.slice(1, -1).replace(/\\'/g, "'");
    }
    try {
      return JSON.parse(rawJson);
    } catch (e) {
      console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', e.message);
      console.warn('[Firebase] Tip: multiline JSON breaks .env — use FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_BASE64.');
    }
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim()) {
    try {
      const decoded = Buffer.from(b64.trim(), 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_BASE64 decode/parse failed:', e.message);
    }
  }

  const relPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (relPath) {
    const normalized = relPath.replace(/^\.\/+/, '');
    const candidates = path.isAbsolute(relPath)
      ? [relPath]
      : [
          path.join(process.cwd(), relPath),
          path.join(process.cwd(), normalized),
          path.join(BACKEND_ROOT, relPath),
          path.join(BACKEND_ROOT, normalized),
        ];
    const tried = [];
    for (const abs of candidates) {
      tried.push(abs);
      if (fs.existsSync(abs)) {
        try {
          return JSON.parse(fs.readFileSync(abs, 'utf8'));
        } catch (e) {
          console.warn('[Firebase] Failed to parse service account file:', abs, e.message);
          return null;
        }
      }
    }
    console.warn('[Firebase] FIREBASE_SERVICE_ACCOUNT_PATH file not found. Tried:\n  - ' + tried.join('\n  - '));
  }

  return null;
}

/**
 * Initialize Firebase Admin once. Safe to call multiple times.
 * @returns {import('firebase-admin').app.App | null}
 */
export function getFirebaseApp() {
  if (initFailed) {
    return null;
  }
  if (initialized) {
    return admin.apps.length ? admin.app() : null;
  }

  try {
    if (admin.apps.length) {
      initialized = true;
      return admin.app();
    }

    const credJson = tryLoadCredentials();
    if (credJson) {
      admin.initializeApp({
        credential: admin.credential.cert(credJson),
      });
      initialized = true;
      console.log('✅ Firebase Admin initialized (service account)');
      return admin.app();
    }

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      initialized = true;
      console.log('✅ Firebase Admin initialized (application default credentials)');
      return admin.app();
    }

    initFailed = true;
    console.warn(
      '⚠️  Firebase Admin not configured — set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT_PATH, or GOOGLE_APPLICATION_CREDENTIALS. Firestore pilgrim sync is disabled.',
    );
    return null;
  } catch (e) {
    initFailed = true;
    console.error('[Firebase] Admin init failed:', e.message);
    return null;
  }
}

export function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  return admin.firestore();
}

export function isFirestoreAvailable() {
  return !!getFirestoreDb();
}

/** Call once at server startup so Firebase status appears in logs (not only on first registration). */
export function bootstrapFirebaseAdmin() {
  try {
    getFirebaseApp();
  } catch (e) {
    console.error('[Firebase] bootstrap error:', e.message);
  }
}
