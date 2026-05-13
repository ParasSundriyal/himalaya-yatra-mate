import express from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
const TILES_ZIP = path.resolve(process.cwd(), 'assets', 'tiles_extracted.zip');

router.get('/info', authenticate, async (_req, res) => {
  try {
    const stat = await fs.promises.stat(TILES_ZIP);
    return res.json({
      fileName: 'tiles_extracted.zip',
      fileSizeMB: Math.round((stat.size / 1024 / 1024) * 10) / 10,
      fileSizeBytes: stat.size,
      region: 'Uttarakhand — all 4 Char Dham regions',
      zoomLevels: '8 to 16',
      format: 'raster PNG tiles',
      lastUpdated: stat.mtime.toISOString(),
    });
  } catch {
    return res.status(404).json({ error: 'Map file not found on server.' });
  }
});

router.get('/tiles.zip', authenticate, async (req, res) => {
  try {
    const stat = await fs.promises.stat(TILES_ZIP);
    const total = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', 'application/zip');

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(startStr, 10);
      const end = endStr ? Number.parseInt(endStr, 10) : total - 1;
      const chunk = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', chunk);
      fs.createReadStream(TILES_ZIP, { start, end }).pipe(res);
      return;
    }

    res.setHeader('Content-Length', total);
    fs.createReadStream(TILES_ZIP).pipe(res);
  } catch {
    res.status(404).json({ error: 'Map file not found.' });
  }
});

export default router;

