import { Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import yauzl from 'yauzl';
import { fileTypeFromFile } from 'file-type';
import { uploadMediaFile } from '../services/storageService';
import { verifyFirebaseToken, uploadRateLimiter, chunkUploadRateLimiter, AuthenticatedRequest } from '../middleware/auth';

export const mediaApiRouter = Router();

const UPLOADS_ROOT = path.resolve(process.cwd(), 'data', 'uploads');
const TEMP_UPLOADS = path.resolve(UPLOADS_ROOT, 'temp');
const CHUNKS_ROOT = path.resolve(TEMP_UPLOADS, 'chunks');

fs.mkdirSync(TEMP_UPLOADS, { recursive: true });
fs.mkdirSync(CHUNKS_ROOT, { recursive: true });

// Strict multer configuration with limits streaming directly to disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_UPLOADS);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 350 * 1024 * 1024, // 350 MB max per file
    files: 200,
    fieldSize: 10 * 1024 * 1024,
  },
});

// Resilient chunk storage configuration for large resumable multi-part uploads
const chunkStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const rawId = ((req.body && req.body.uploadId) || 'default').replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.resolve(CHUNKS_ROOT, rawId || 'default');
    fs.mkdirSync(chunkDir, { recursive: true });
    cb(null, chunkDir);
  },
  filename: (req, _file, cb) => {
    const index = parseInt((req.body && req.body.chunkIndex) || '0', 10);
    cb(null, `chunk-${isNaN(index) ? 0 : index}.bin`);
  },
});

const chunkUpload = multer({
  storage: chunkStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per chunk
    fieldSize: 5 * 1024 * 1024,
  },
});

/**
 * Helper to validate magic bytes using file-type
 */
async function validateImageMagicBytes(filePath: string): Promise<boolean> {
  try {
    const ft = await fileTypeFromFile(filePath);
    if (!ft) return false;
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
    return allowedMimeTypes.includes(ft.mime);
  } catch {
    return false;
  }
}

/**
 * GET /api/media/files/:subpath(*)
 */
mediaApiRouter.get('/files/*', (req, res) => {
  const relPath = (req.params as any)[0];
  if (!relPath || relPath.includes('..')) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  const fullPath = path.resolve(UPLOADS_ROOT, relPath);
  if (!fullPath.startsWith(UPLOADS_ROOT) || !fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(fullPath);
});

/**
 * POST /api/media/upload-cover
 * Hardened cover upload with auth, rate-limit, magic bytes validation,
 * stream-based sharp transformation, and zero in-memory buffer retention.
 */
mediaApiRouter.post(
  '/upload-cover',
  verifyFirebaseToken as any,
  uploadRateLimiter as any,
  upload.single('cover') as any,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No cover file provided' });
    }

    const tempFilePath = req.file.path;
    const cleanupFiles = new Set<string>([tempFilePath]);
    const userId = req.user?.uid || 'anonymous';
    const randomWorkId = crypto.randomUUID();

    try {
      // Validate magic bytes
      const isValidImage = await validateImageMagicBytes(tempFilePath);
      if (!isValidImage) {
        return res.status(400).json({ error: 'Invalid file type. File does not match allowed image formats.' });
      }

      const outFileName = `cover-${crypto.randomBytes(6).toString('hex')}.webp`;
      const storagePath = `users/${userId}/${randomWorkId}/${outFileName}`;
      const optimizedTempPath = path.resolve(TEMP_UPLOADS, `opt-cover-${crypto.randomBytes(6).toString('hex')}.webp`);
      cleanupFiles.add(optimizedTempPath);

      // Stream directly from disk through Sharp to temporary WebP file
      const sharpTransformer = sharp()
        .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 85, effort: 4 });

      await pipeline(
        fs.createReadStream(tempFilePath),
        sharpTransformer,
        fs.createWriteStream(optimizedTempPath)
      );

      // Upload file directly using streaming disk pipeline
      const uploadRes = await uploadMediaFile(optimizedTempPath, storagePath, 'image/webp');
      return res.json({ success: true, coverUrl: uploadRes.url, provider: uploadRes.provider });
    } catch (err: any) {
      console.error('Error optimizing cover image:', err);
      return res.status(500).json({ error: 'Failed to process cover image: ' + (err?.message || 'Internal error') });
    } finally {
      // Guaranteed cleanup of all temp files
      for (const p of cleanupFiles) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {}
      }
    }
  }
);

/**
 * POST /api/media/upload-pages
 * Hardened batch page upload with server-side namespacing, magic bytes validation,
 * sequential stream processing to prevent memory spikes, and guaranteed cleanup.
 */
mediaApiRouter.post(
  '/upload-pages',
  verifyFirebaseToken as any,
  uploadRateLimiter as any,
  upload.array('pages', 200) as any,
  async (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No page files provided' });
    }

    const cleanupFiles = new Set<string>();
    files.forEach((f) => cleanupFiles.add(f.path));

    const userId = req.user?.uid || 'anonymous';
    const randomWorkId = crypto.randomUUID();
    const pageUrls: string[] = [];

    try {
      // 1. Validate magic bytes across all uploaded page files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isValid = await validateImageMagicBytes(file.path);
        if (!isValid) {
          return res.status(400).json({ error: `File at index ${i} is not a valid image format.` });
        }
      }

      // 2. Stream-process each page sequentially through Sharp to avoid heap exhaustion
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pageIndex = (i + 1).toString().padStart(3, '0');
        const outFileName = `page_${pageIndex}_${crypto.randomBytes(4).toString('hex')}.webp`;
        const storagePath = `users/${userId}/${randomWorkId}/${outFileName}`;
        const optimizedTempPath = path.resolve(TEMP_UPLOADS, `opt-page-${crypto.randomBytes(6).toString('hex')}.webp`);
        cleanupFiles.add(optimizedTempPath);

        const sharpTransformer = sharp()
          .resize({ width: 1800, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 85, effort: 3 });

        await pipeline(
          fs.createReadStream(file.path),
          sharpTransformer,
          fs.createWriteStream(optimizedTempPath)
        );

        const uploadRes = await uploadMediaFile(optimizedTempPath, storagePath, 'image/webp');
        pageUrls.push(uploadRes.url);

        // Cleanup temporary files immediately after page is uploaded
        try {
          if (fs.existsSync(optimizedTempPath)) fs.unlinkSync(optimizedTempPath);
          cleanupFiles.delete(optimizedTempPath);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          cleanupFiles.delete(file.path);
        } catch {}
      }

      return res.json({ success: true, pages: pageUrls, pageUrls, total: pageUrls.length });
    } catch (err: any) {
      console.error('Error optimizing manga pages:', err);
      return res.status(500).json({ error: 'Failed to process manga pages: ' + (err?.message || 'Internal error') });
    } finally {
      // Guaranteed cleanup of any leftover temp files
      for (const p of cleanupFiles) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {}
      }
    }
  }
);

/**
 * Shared helper to extract, validate, resize, and upload pages from a CBZ/ZIP archive on disk
 */
async function processMangaArchiveDiskFile(
  tempFilePath: string,
  userId: string,
  randomWorkId: string,
  volumeName: string,
  cleanupFiles: Set<string>
): Promise<{ pages: string[]; total: number; volumeName: string }> {
  let zipfile: yauzl.ZipFile | null = null;
  try {
    zipfile = await yauzl.openPromise(tempFilePath, { lazyEntries: true, autoClose: false });

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif'];
    const imageEntries: yauzl.Entry[] = [];
    let totalUncompressedSize = 0;
    const MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024; // 500 MB limit
    const MAX_ENTRY_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100 MB per page

    // Pass 1: Collect and validate all entries from the central directory
    await new Promise<void>((resolve, reject) => {
      if (!zipfile) return reject(new Error('Zip file not opened'));
      zipfile.readEntry();
      zipfile.on('entry', (entry: yauzl.Entry) => {
        const fileName = entry.fileName;

        // Reject path traversal attacks (../ or absolute paths)
        if (fileName.includes('..') || path.isAbsolute(fileName)) {
          zipfile?.readEntry();
          return;
        }

        // Check if not directory or hidden / macOS metadata
        if (!/\/$/.test(fileName) && !fileName.includes('__MACOSX') && !path.basename(fileName).startsWith('.')) {
          const ext = path.extname(fileName).toLowerCase();
          if (imageExtensions.includes(ext)) {
            // Zip bomb defense: check compression ratio and entry sizes
            if (entry.uncompressedSize > MAX_ENTRY_UNCOMPRESSED_SIZE) {
              return reject(new Error(`Archive entry ${fileName} exceeds maximum uncompressed size (100 MB).`));
            }

            if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > 60) {
              return reject(new Error(`Potential zip bomb detected in entry ${fileName}. Ratio exceeds safe limit.`));
            }

            totalUncompressedSize += entry.uncompressedSize;
            if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
              return reject(new Error('Archive total uncompressed size exceeds safety limit (500 MB).'));
            }

            imageEntries.push(entry);
          }
        }

        zipfile?.readEntry();
      });

      zipfile.on('end', () => resolve());
      zipfile.on('error', (err) => reject(err));
    });

    if (imageEntries.length === 0) {
      throw new Error('No valid image pages found inside the CBZ / ZIP archive.');
    }

    // Max 400 pages limit
    if (imageEntries.length > 400) {
      throw new Error('Archive contains too many pages (maximum 400 pages allowed).');
    }

    // Natural sort by entry filename
    imageEntries.sort((a, b) =>
      a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
    );

    // Pass 2: Stream each image page directly from zip -> sharp -> disk -> storage
    const pageUrls: string[] = [];
    for (let i = 0; i < imageEntries.length; i++) {
      const entry = imageEntries[i];
      const entryStream = await zipfile.openReadStreamPromise(entry);
      const optimizedTempPath = path.resolve(
        TEMP_UPLOADS,
        `archive-opt-${crypto.randomBytes(6).toString('hex')}.webp`
      );
      cleanupFiles.add(optimizedTempPath);

      const sharpTransformer = sharp()
        .resize({ width: 1800, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 85, effort: 3 });

      await pipeline(entryStream, sharpTransformer, fs.createWriteStream(optimizedTempPath));

      const pageIndex = (i + 1).toString().padStart(3, '0');
      const outFileName = `page_${pageIndex}.webp`;
      const storagePath = `users/${userId}/${randomWorkId}/${outFileName}`;

      const uploadRes = await uploadMediaFile(optimizedTempPath, storagePath, 'image/webp');
      pageUrls.push(uploadRes.url);

      // Immediate cleanup of temporary page file
      try {
        if (fs.existsSync(optimizedTempPath)) fs.unlinkSync(optimizedTempPath);
        cleanupFiles.delete(optimizedTempPath);
      } catch {}
    }

    return {
      pages: pageUrls,
      total: pageUrls.length,
      volumeName,
    };
  } finally {
    try {
      zipfile?.close();
    } catch {}
  }
}

/**
 * POST /api/media/upload-archive
 * Stream-based CBZ/ZIP archive extraction using yauzl (zero-heap archive loading),
 * zip-bomb detection, path-traversal prevention, streaming sharp re-encoding, and strict cleanup.
 */
mediaApiRouter.post(
  '/upload-archive',
  verifyFirebaseToken as any,
  uploadRateLimiter as any,
  upload.single('archive') as any,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No archive file provided (.cbz, .zip)' });
    }

    const tempFilePath = req.file.path;
    const cleanupFiles = new Set<string>([tempFilePath]);
    const userId = req.user?.uid || 'anonymous';
    const randomWorkId = crypto.randomUUID();

    try {
      const result = await processMangaArchiveDiskFile(
        tempFilePath,
        userId,
        randomWorkId,
        req.file.originalname.replace(/\.(cbz|zip)$/i, ''),
        cleanupFiles
      );

      return res.json({
        success: true,
        pages: result.pages,
        total: result.total,
        volumeName: result.volumeName,
      });
    } catch (err: any) {
      console.error('Error processing manga archive:', err);
      return res.status(500).json({ error: 'Failed to process CBZ/ZIP archive: ' + (err?.message || 'Internal error') });
    } finally {
      for (const p of cleanupFiles) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {}
      }
    }
  }
);

/**
 * GET /api/media/chunk-status/:uploadId
 * Check existing received chunks for resuming interrupted uploads
 */
mediaApiRouter.get(
  '/chunk-status/:uploadId',
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const rawId = (req.params.uploadId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!rawId) {
      return res.status(400).json({ error: 'Invalid uploadId parameter' });
    }

    const chunkDir = path.resolve(CHUNKS_ROOT, rawId);
    if (!fs.existsSync(chunkDir)) {
      return res.json({
        success: true,
        uploadId: rawId,
        receivedChunks: [],
        count: 0,
      });
    }

    try {
      const files = fs.readdirSync(chunkDir);
      const receivedChunks: number[] = [];
      for (const file of files) {
        const match = file.match(/^chunk-(\d+)\.bin$/);
        if (match) {
          receivedChunks.push(parseInt(match[1], 10));
        }
      }
      receivedChunks.sort((a, b) => a - b);
      return res.json({
        success: true,
        uploadId: rawId,
        receivedChunks,
        count: receivedChunks.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to inspect chunk status: ' + err?.message });
    }
  }
);

/**
 * POST /api/media/upload-chunk
 * Ingest an individual chunk for large files with dedicated high-throughput rate limiter
 */
mediaApiRouter.post(
  '/upload-chunk',
  verifyFirebaseToken as any,
  chunkUploadRateLimiter as any,
  chunkUpload.single('chunk') as any,
  async (req: AuthenticatedRequest, res: Response) => {
    const { uploadId, chunkIndex, totalChunks } = req.body;
    if (!uploadId || chunkIndex === undefined || totalChunks === undefined) {
      return res.status(400).json({ error: 'Missing chunk metadata (uploadId, chunkIndex, totalChunks)' });
    }

    const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cIndex = parseInt(chunkIndex, 10);
    const tChunks = parseInt(totalChunks, 10);

    const chunkDir = path.resolve(CHUNKS_ROOT, safeUploadId);
    let receivedCount = 0;
    if (fs.existsSync(chunkDir)) {
      const files = fs.readdirSync(chunkDir);
      receivedCount = files.filter((f) => /^chunk-\d+\.bin$/.test(f)).length;
    }

    return res.json({
      success: true,
      uploadId: safeUploadId,
      chunkIndex: cIndex,
      totalChunks: tChunks,
      receivedCount,
      allReceived: receivedCount >= tChunks,
    });
  }
);

/**
 * POST /api/media/complete-chunk-upload
 * Stitch chunks together on disk using streams, perform file validation,
 * and dispatch to archive/cover/media storage without memory spikes.
 */
mediaApiRouter.post(
  '/complete-chunk-upload',
  verifyFirebaseToken,
  uploadRateLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    const { uploadId, fileName, fileType, workSlug } = req.body;
    if (!uploadId || !fileName) {
      return res.status(400).json({ error: 'Missing uploadId or fileName' });
    }

    const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkDir = path.resolve(CHUNKS_ROOT, safeUploadId);

    if (!fs.existsSync(chunkDir)) {
      return res.status(404).json({ error: 'Upload chunk session not found or expired' });
    }

    const files = fs.readdirSync(chunkDir).filter((f) => /^chunk-\d+\.bin$/.test(f));
    if (files.length === 0) {
      return res.status(400).json({ error: 'No chunks found for this upload' });
    }

    // Sort files strictly by numeric chunk index
    files.sort((a, b) => {
      const idxA = parseInt(a.replace(/chunk-|\.bin/g, ''), 10);
      const idxB = parseInt(b.replace(/chunk-|\.bin/g, ''), 10);
      return idxA - idxB;
    });

    const ext = path.extname(fileName).toLowerCase() || '.bin';
    const assembledPath = path.resolve(
      TEMP_UPLOADS,
      `assembled-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    );
    const cleanupFiles = new Set<string>([assembledPath]);
    const userId = req.user?.uid || 'anonymous';
    const randomWorkId = crypto.randomUUID();

    try {
      // Assemble chunks sequentially on disk using streams
      const writeStream = fs.createWriteStream(assembledPath);
      for (const chunkFile of files) {
        const chunkPath = path.resolve(chunkDir, chunkFile);
        const chunkStream = fs.createReadStream(chunkPath);
        await new Promise<void>((resolve, reject) => {
          chunkStream.pipe(writeStream, { end: false });
          chunkStream.on('end', () => resolve());
          chunkStream.on('error', (err) => reject(err));
        });
      }
      writeStream.end();

      // Ensure write stream has flushed to disk
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      // Cleanup chunk directory immediately after assembly
      try {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      } catch {}

      // Route assembled file by format
      const isArchive = fileType === 'archive' || /\.(cbz|zip)$/i.test(fileName);
      const isCover = fileType === 'cover' || /\.(jpe?g|png|webp|avif)$/i.test(fileName);

      if (isArchive) {
        const result = await processMangaArchiveDiskFile(
          assembledPath,
          userId,
          randomWorkId,
          fileName.replace(/\.(cbz|zip)$/i, ''),
          cleanupFiles
        );
        return res.json({
          success: true,
          pages: result.pages,
          total: result.total,
          volumeName: result.volumeName,
        });
      }

      if (isCover) {
        const isValid = await validateImageMagicBytes(assembledPath);
        if (!isValid) {
          return res.status(400).json({ error: 'Uploaded file is not a valid image format.' });
        }
        const outFileName = `cover-${crypto.randomBytes(6).toString('hex')}.webp`;
        const storagePath = `users/${userId}/${randomWorkId}/${outFileName}`;
        const optimizedTempPath = path.resolve(TEMP_UPLOADS, `opt-cover-${crypto.randomBytes(6).toString('hex')}.webp`);
        cleanupFiles.add(optimizedTempPath);

        const sharpTransformer = sharp()
          .resize({ width: 1200, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 85, effort: 4 });

        await pipeline(fs.createReadStream(assembledPath), sharpTransformer, fs.createWriteStream(optimizedTempPath));
        const uploadRes = await uploadMediaFile(optimizedTempPath, storagePath, 'image/webp');
        return res.json({ success: true, coverUrl: uploadRes.url, provider: uploadRes.provider });
      }

      // Generic document upload
      const outFileName = `file-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const storagePath = `users/${userId}/${randomWorkId}/${outFileName}`;
      const uploadRes = await uploadMediaFile(assembledPath, storagePath, 'application/octet-stream');
      return res.json({ success: true, fileUrl: uploadRes.url });
    } catch (err: any) {
      console.error('Error in complete-chunk-upload:', err);
      return res.status(500).json({ error: 'Failed to finalize chunked upload: ' + (err?.message || 'Internal error') });
    } finally {
      for (const p of cleanupFiles) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch {}
      }
      try {
        if (fs.existsSync(chunkDir)) {
          fs.rmSync(chunkDir, { recursive: true, force: true });
        }
      } catch {}
    }
  }
);
