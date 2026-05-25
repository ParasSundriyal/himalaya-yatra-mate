import express from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Maps
 *     description: Offline maps and tile management
 */

const ASSETS_DIR = path.resolve(process.cwd(), 'assets');
const MBTILES_FILE = path.join(ASSETS_DIR, 'uttarakhand_chardham.mbtiles');
const TILES_ZIP = path.join(ASSETS_DIR, 'tiles_extracted.zip');

async function statFile(filePath) {
  return fs.promises.stat(filePath);
}

function streamFile(req, res, filePath, contentType) {
  return statFile(filePath).then((stat) => {
    const total = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', contentType);

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(startStr, 10);
      const end = endStr ? Number.parseInt(endStr, 10) : total - 1;
      const chunk = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', chunk);
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.setHeader('Content-Length', total);
    fs.createReadStream(filePath).pipe(res);
  });
}

router.get('/info', authenticate, async (_req, res) => {
  const base = {
    region: 'Uttarakhand — all 4 Char Dham regions',
    zoomLevels: '8 to 16',
  };

  try {
    const stat = await statFile(MBTILES_FILE);
    return res.json({
      ...base,
      packageType: 'mbtiles',
      fileName: 'uttarakhand_chardham.mbtiles',
      fileSizeMB: Math.round((stat.size / 1024 / 1024) * 10) / 10,
      fileSizeBytes: stat.size,
      format: 'MBTiles (raster PNG)',
      lastUpdated: stat.mtime.toISOString(),
    });
  } catch {
    // fall through
  }

  try {
    const stat = await statFile(TILES_ZIP);
    return res.json({
      ...base,
      packageType: 'zip',
      fileName: 'tiles_extracted.zip',
      fileSizeMB: Math.round((stat.size / 1024 / 1024) * 10) / 10,
      fileSizeBytes: stat.size,
      format: 'PNG tiles (zip)',
      lastUpdated: stat.mtime.toISOString(),
    });
  } catch {
    return res.status(404).json({
      error: 'Map file not found. Add uttarakhand_chardham.mbtiles or tiles_extracted.zip to backend/assets/.',
    });
  }
});

router.get('/mbtiles', authenticate, async (req, res) => {
  try {
    await streamFile(req, res, MBTILES_FILE, 'application/octet-stream');
  } catch {
    res.status(404).json({ error: 'MBTiles file not found on server.' });
  }
});

/** @deprecated Legacy PNG tile zip — use /mbtiles instead */
router.get('/tiles.zip', authenticate, async (req, res) => {
  try {
    await streamFile(req, res, TILES_ZIP, 'application/zip');
  } catch {
    res.status(404).json({ error: 'Map file not found.' });
  }
});

export default router;
