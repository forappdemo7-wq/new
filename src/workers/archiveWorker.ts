import JSZip from 'jszip';

// Message types
export interface ArchiveProcessOptions {
  maxEntries?: number;
  maxTotalBytes?: number;
  maxEntryBytes?: number;
  maxCompressionRatio?: number;
}

export interface ExtractedPage {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
  isCoverCandidate?: boolean;
}

export type ArchiveWorkerIncomingMessage =
  | {
      action: 'processArchive';
      buffer: ArrayBuffer;
      fileName: string;
      options?: ArchiveProcessOptions;
    }
  | {
      action: 'cancel';
    };

export type ArchiveWorkerOutgoingMessage =
  | {
      type: 'progress';
      phase: 'inspecting' | 'extracting';
      current: number;
      total: number;
      percent: number;
      message: string;
    }
  | {
      type: 'complete';
      pages: ExtractedPage[];
      coverPage?: ExtractedPage;
      totalExtracted: number;
      suggestedTitle: string;
    }
  | {
      type: 'error';
      error: string;
    };

// Default safety limits
const DEFAULT_MAX_ENTRIES = 400; // Manga volumes rarely exceed 300 pages
const DEFAULT_MAX_TOTAL_BYTES = 400 * 1024 * 1024; // 400 MB uncompressed limit
const DEFAULT_MAX_ENTRY_BYTES = 50 * 1024 * 1024; // 50 MB per single page
const DEFAULT_MAX_COMPRESSION_RATIO = 100; // Reject zip-bombs (>100x ratio)

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

let isCancelled = false;

self.onmessage = async (e: MessageEvent<ArchiveWorkerIncomingMessage>) => {
  const message = e.data;

  if (message.action === 'cancel') {
    isCancelled = true;
    return;
  }

  if (message.action === 'processArchive') {
    isCancelled = false;
    const { buffer, fileName, options = {} } = message;

    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    const maxTotalBytes = options.maxTotalBytes ?? DEFAULT_MAX_TOTAL_BYTES;
    const maxEntryBytes = options.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES;
    const maxRatio = options.maxCompressionRatio ?? DEFAULT_MAX_COMPRESSION_RATIO;

    try {
      self.postMessage({
        type: 'progress',
        phase: 'inspecting',
        current: 0,
        total: 100,
        percent: 5,
        message: 'Inspecting archive structure...',
      } satisfies ArchiveWorkerOutgoingMessage);

      // 1. Load archive
      const zip = new JSZip();
      let loadedZip: JSZip;
      try {
        loadedZip = await zip.loadAsync(buffer);
      } catch (err: any) {
        throw new Error(`Invalid or corrupt archive file: ${err.message || 'Cannot read ZIP/CBZ structure'}`);
      }

      if (isCancelled) return;

      // 2. Security audit & filter entries
      const allFiles = Object.keys(loadedZip.files);
      if (allFiles.length === 0) {
        throw new Error('Archive is empty.');
      }

      if (allFiles.length > maxEntries * 3) {
        throw new Error(`Archive contains too many files (${allFiles.length}). Maximum allowed is ${maxEntries}.`);
      }

      const validImageFiles: string[] = [];
      let estimatedTotalSize = 0;

      for (const entryPath of allFiles) {
        // Path traversal / security check
        if (entryPath.includes('..') || entryPath.startsWith('/') || entryPath.startsWith('\\')) {
          throw new Error(`Malicious path detected in archive: "${entryPath}"`);
        }

        const zipObj = loadedZip.files[entryPath];
        if (zipObj.dir) continue;

        // Skip macOS metadata and OS junk files
        if (
          entryPath.startsWith('__MACOSX/') ||
          entryPath.includes('/.DS_Store') ||
          entryPath.endsWith('.DS_Store') ||
          entryPath.toLowerCase().endsWith('thumbs.db')
        ) {
          continue;
        }

        const lowerPath = entryPath.toLowerCase();
        const isImage = VALID_IMAGE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
        if (!isImage) continue;

        // Check entry size against max entry limits if metadata is available
        const uncompressedSize = (zipObj as any)._data?.uncompressedSize ?? 0;
        if (uncompressedSize > maxEntryBytes) {
          throw new Error(`Image entry "${entryPath}" exceeds maximum size limit of ${Math.round(maxEntryBytes / 1024 / 1024)}MB.`);
        }
        estimatedTotalSize += uncompressedSize;

        validImageFiles.push(entryPath);
      }

      if (validImageFiles.length === 0) {
        throw new Error('No supported comic/manga images found in this archive (.jpg, .png, .webp, .avif).');
      }

      if (validImageFiles.length > maxEntries) {
        throw new Error(`Archive has ${validImageFiles.length} pages, exceeding the maximum limit of ${maxEntries} pages.`);
      }

      if (estimatedTotalSize > maxTotalBytes) {
        throw new Error(`Decompressed archive size exceeds safety threshold (${Math.round(maxTotalBytes / 1024 / 1024)}MB).`);
      }

      // Check compression ratio if buffer size is known
      if (buffer.byteLength > 0 && estimatedTotalSize > 0) {
        const ratio = estimatedTotalSize / buffer.byteLength;
        if (ratio > maxRatio) {
          throw new Error('Unusually high compression ratio detected (potential decompression bomb). Upload rejected.');
        }
      }

      // 3. Natural Sort files so pages are in correct chronological / reading order
      // E.g. page_1.jpg, page_2.jpg, page_10.jpg instead of alphabetical page_1, page_10, page_2
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      validImageFiles.sort((a, b) => {
        const fileA = a.split('/').pop() || a;
        const fileB = b.split('/').pop() || b;
        return collator.compare(fileA, fileB);
      });

      // 4. Incremental page decompression
      const extractedPages: ExtractedPage[] = [];
      const totalPages = validImageFiles.length;

      for (let i = 0; i < totalPages; i++) {
        if (isCancelled) {
          return;
        }

        const entryPath = validImageFiles[i];
        const percent = Math.round(((i + 1) / totalPages) * 100);

        self.postMessage({
          type: 'progress',
          phase: 'extracting',
          current: i + 1,
          total: totalPages,
          percent,
          message: `Decompressing page ${i + 1} of ${totalPages} (${percent}%)...`,
        } satisfies ArchiveWorkerOutgoingMessage);

        const zipObj = loadedZip.files[entryPath];
        const pageBuffer = await zipObj.async('arraybuffer');

        // Check single uncompressed size
        if (pageBuffer.byteLength > maxEntryBytes) {
          throw new Error(`Page ${i + 1} exceeds size limit (${Math.round(pageBuffer.byteLength / 1024 / 1024)}MB).`);
        }

        const fileNameOnly = entryPath.split('/').pop() || `page_${i + 1}.jpg`;
        const mimeType = getMimeType(fileNameOnly);

        const pageItem: ExtractedPage = {
          name: fileNameOnly,
          mimeType,
          data: pageBuffer,
          isCoverCandidate: i === 0,
        };

        extractedPages.push(pageItem);
      }

      const suggestedTitle = fileName.replace(/\.(cbz|zip)$/i, '').replace(/[-_]+/g, ' ').trim();

      // Collect transferable buffers
      const transferList = extractedPages.map((p) => p.data);

      self.postMessage(
        {
          type: 'complete',
          pages: extractedPages,
          coverPage: extractedPages[0],
          totalExtracted: extractedPages.length,
          suggestedTitle,
        } satisfies ArchiveWorkerOutgoingMessage,
        { transfer: transferList }
      );
    } catch (err: any) {
      self.postMessage({
        type: 'error',
        error: err.message || 'Failed to process archive',
      } satisfies ArchiveWorkerOutgoingMessage);
    }
  }
};
