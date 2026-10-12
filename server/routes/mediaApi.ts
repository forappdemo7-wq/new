import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import JSZip from 'jszip';
import { uploadMediaFile } from '../services/storageService';

export const mediaApiRouter = Router();

// Base uploads directory
const UPLOADS_ROOT = path.resolve(process.cwd(), 'data', 'uploads');
const TEMP_UPLOADS = path.resolve(UPLOADS_ROOT, 'temp');

// Ensure directories exist
fs.mkdirSync(TEMP_UPLOADS, { recursive: true });

// Configure disk storage for Multer to stream directly to disk without bloating RAM
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_UPLOADS);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, unique);
  },
});

// Allow up to 350 MB uploads for heavy manga volumes, CBZ archives, and books
const upload = multer({
  storage,
  limits: {
    fileSize: 350 * 1024 * 1024, // 350 MB per file
  },
});

/**
 * Natural sort helper for manga pages (e.g., page 2 before page 10)
 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * GET /api/media/files/:subpath(*)
 * Serves optimized media with immutable HTTP caching
 */
mediaApiRouter.get('/files/*', (req: Request, res: Response) => {
  const relPath = req.params[0];
  if (!relPath || relPath.includes('..')) {
    return res.status(400).send('Invalid file path');
  }

  const fullPath = path.resolve(UPLOADS_ROOT, relPath);
  if (!fullPath.startsWith(UPLOADS_ROOT) || !fs.existsSync(fullPath)) {
    return res.status(404).send('Media file not found');
  }

  // Set aggressive caching for high-scale reader performance
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(fullPath);
});

/**
 * POST /api/media/upload-cover
 * Uploads and optimizes a book or manga cover image to WebP under 250KB
 */
mediaApiRouter.post('/upload-cover', upload.single('cover'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No cover file provided' });
  }

  const tempFilePath = req.file.path;
  try {
    const outFileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

    const webpBuffer = await sharp(tempFilePath)
      .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Clean up temp upload
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}

    const uploadRes = await uploadMediaFile(webpBuffer, `covers/${outFileName}`, 'image/webp');
    return res.json({ success: true, coverUrl: uploadRes.url, provider: uploadRes.provider });
  } catch (err: any) {
    console.error('Error optimizing cover image:', err);
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
    return res.status(500).json({ success: false, error: 'Failed to process cover image' });
  }
});

/**
 * POST /api/media/upload-pages
 * Uploads a batch of manga/comic page images, optimizes each to WebP
 */
mediaApiRouter.post('/upload-pages', upload.array('pages', 200), async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({ success: false, error: 'No page files provided' });
  }

  const workSlug = (req.body.workSlug || `work-${Date.now()}`).replace(/[^a-z0-9_-]/gi, '');
  const workDir = path.resolve(UPLOADS_ROOT, 'works', workSlug);
  fs.mkdirSync(workDir, { recursive: true });

  const pageUrls: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pageIndex = (i + 1).toString().padStart(3, '0');
      const outFileName = `page_${pageIndex}_${Math.random().toString(36).substring(2, 6)}.webp`;

      const webpBuffer = await sharp(file.path)
        .resize({ width: 1800, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 85, effort: 3 })
        .toBuffer();

      try {
        fs.unlinkSync(file.path);
      } catch {}

      const uploadRes = await uploadMediaFile(webpBuffer, `works/${workSlug}/${outFileName}`, 'image/webp');
      pageUrls.push(uploadRes.url);
    }

    return res.json({ success: true, pageUrls, total: pageUrls.length });
  } catch (err: any) {
    console.error('Error optimizing manga pages:', err);
    // Cleanup remaining temp files
    files.forEach((f) => {
      try {
        fs.unlinkSync(f.path);
      } catch {}
    });
    return res.status(500).json({ success: false, error: 'Failed to process manga pages' });
  }
});

/**
 * POST /api/media/upload-archive
 * Accepts a full CBZ or ZIP manga volume (up to 350 MB), unzips and converts all pages to WebP
 */
mediaApiRouter.post('/upload-archive', upload.single('archive'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No archive file provided (.cbz, .zip)' });
  }

  const tempFilePath = req.file.path;
  const workSlug = (req.body.workSlug || `manga-${Date.now()}`).replace(/[^a-z0-9_-]/gi, '');
  const workDir = path.resolve(UPLOADS_ROOT, 'works', workSlug);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    const archiveBuffer = fs.readFileSync(tempFilePath);
    const zip = await JSZip.loadAsync(archiveBuffer);

    // Find all image files in the archive
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif'];
    const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const ext = path.extname(relativePath).toLowerCase();
        // Ignore hidden macOS / system files
        if (imageExtensions.includes(ext) && !relativePath.includes('__MACOSX') && !path.basename(relativePath).startsWith('.')) {
          imageEntries.push({ name: relativePath, file: zipEntry });
        }
      }
    });

    if (imageEntries.length === 0) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}
      return res.status(400).json({
        success: false,
        error: 'No image pages found inside the CBZ / ZIP archive.',
      });
    }

    // Natural sort so pages appear in proper reading order
    imageEntries.sort((a, b) => naturalSort(a.name, b.name));

    const pageUrls: string[] = [];
    for (let i = 0; i < imageEntries.length; i++) {
      const entry = imageEntries[i];
      const buffer = await entry.file.async('nodebuffer');
      const pageIndex = (i + 1).toString().padStart(3, '0');
      const outFileName = `page_${pageIndex}.webp`;

      const webpBuffer = await sharp(buffer)
        .resize({ width: 1800, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 85, effort: 3 })
        .toBuffer();

      const uploadRes = await uploadMediaFile(webpBuffer, `works/${workSlug}/${outFileName}`, 'image/webp');
      pageUrls.push(uploadRes.url);
    }

    // Clean up uploaded archive
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}

    return res.json({
      success: true,
      pages: pageUrls,
      total: pageUrls.length,
      volumeName: req.file.originalname.replace(/\.(cbz|zip)$/i, ''),
    });
  } catch (err: any) {
    console.error('Error processing manga archive:', err);
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
    return res.status(500).json({
      success: false,
      error: 'Failed to process CBZ/ZIP volume archive: ' + (err?.message || 'Unknown error'),
    });
  }
});
