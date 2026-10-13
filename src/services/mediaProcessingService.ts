import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import type {
  ArchiveWorkerIncomingMessage,
  ArchiveWorkerOutgoingMessage,
  ExtractedPage,
} from '../workers/archiveWorker';
import type {
  PdfWorkerIncomingMessage,
  PdfWorkerOutgoingMessage,
  PdfTextChapter,
  PdfRenderedPage,
} from '../workers/pdfWorker';

// Maximum size limits
export const MAX_ARCHIVE_FILE_SIZE = 350 * 1024 * 1024; // 350 MB
export const MAX_PDF_FILE_SIZE = 250 * 1024 * 1024; // 250 MB
export const MAX_PAGES_LIMIT = 400;

export interface ProcessedArchiveResult {
  pages: { blob: Blob; url: string; fileName: string; isCover: boolean }[];
  coverBlob?: Blob;
  coverUrl?: string;
  total: number;
  suggestedTitle: string;
}

export interface ProcessedPdfBookResult {
  chapters: { title: string; text: string }[];
  totalPages: number;
  suggestedTitle: string;
}

export interface ProcessedPdfComicResult {
  pages: { blob: Blob; url: string; pageNumber: number }[];
  coverBlob?: Blob;
  coverUrl?: string;
  totalPages: number;
  suggestedTitle: string;
}

export type ProgressCallback = (status: string, percent?: number) => void;

class MediaProcessingService {
  private activeArchiveWorker: Worker | null = null;
  private activePdfWorker: Worker | null = null;
  private isCancelled = false;

  /**
   * Cancel any active worker task and release resources
   */
  public cancelCurrentTask(): void {
    this.isCancelled = true;

    if (this.activeArchiveWorker) {
      try {
        this.activeArchiveWorker.postMessage({ action: 'cancel' } satisfies ArchiveWorkerIncomingMessage);
        this.activeArchiveWorker.terminate();
      } catch (e) {
        console.warn('Error terminating archive worker:', e);
      }
      this.activeArchiveWorker = null;
    }

    if (this.activePdfWorker) {
      try {
        this.activePdfWorker.postMessage({ action: 'cancel' } satisfies PdfWorkerIncomingMessage);
        this.activePdfWorker.terminate();
      } catch (e) {
        console.warn('Error terminating PDF worker:', e);
      }
      this.activePdfWorker = null;
    }
  }

  /**
   * Process a Manga / Comic ZIP or CBZ archive off the main UI thread
   */
  public async processArchive(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<ProcessedArchiveResult> {
    this.cancelCurrentTask();
    this.isCancelled = false;

    if (file.size > MAX_ARCHIVE_FILE_SIZE) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 350 MB limit.`);
    }

    onProgress?.(`Reading ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 5);
    const buffer = await file.arrayBuffer();

    if (this.isCancelled) {
      throw new Error('Operation cancelled by user');
    }

    // Attempt processing via Web Worker
    try {
      return await this.processArchiveWithWorker(buffer, file.name, onProgress);
    } catch (workerErr: any) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');
      console.warn('Web Worker archive processing failed or unsupported, using chunked fallback:', workerErr);
      return await this.processArchiveChunkedFallback(buffer, file.name, onProgress);
    }
  }

  private processArchiveWithWorker(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedArchiveResult> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/archiveWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.activeArchiveWorker = worker;

        worker.onmessage = (e: MessageEvent<ArchiveWorkerOutgoingMessage>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            onProgress?.(msg.message, msg.percent);
          } else if (msg.type === 'complete') {
            const pages = msg.pages.map((p, idx) => {
              const blob = new Blob([p.data], { type: p.mimeType });
              const url = URL.createObjectURL(blob);
              return {
                blob,
                url,
                fileName: p.name,
                isCover: idx === 0,
              };
            });

            const coverBlob = pages[0]?.blob;
            const coverUrl = pages[0]?.url;

            this.activeArchiveWorker = null;
            worker.terminate();

            resolve({
              pages,
              coverBlob,
              coverUrl,
              total: msg.totalExtracted,
              suggestedTitle: msg.suggestedTitle,
            });
          } else if (msg.type === 'error') {
            this.activeArchiveWorker = null;
            worker.terminate();
            reject(new Error(msg.error));
          }
        };

        worker.onerror = (err) => {
          this.activeArchiveWorker = null;
          worker.terminate();
          reject(new Error(err.message || 'Worker execution error'));
        };

        // Post arraybuffer transfer
        worker.postMessage(
          {
            action: 'processArchive',
            buffer,
            fileName,
          } satisfies ArchiveWorkerIncomingMessage,
          [buffer]
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Cooperative chunked fallback if worker environment is unavailable (e.g. strict sandbox)
   */
  private async processArchiveChunkedFallback(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedArchiveResult> {
    onProgress?.('Inspecting archive files...', 10);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(buffer);

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];
    const entries = Object.keys(loadedZip.files).filter((path) => {
      if (path.includes('..') || path.startsWith('/') || path.startsWith('__MACOSX/')) return false;
      const lower = path.toLowerCase();
      return validExtensions.some((ext) => lower.endsWith(ext));
    });

    if (entries.length === 0) {
      throw new Error('No valid images found in archive.');
    }

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    entries.sort((a, b) => {
      const fileA = a.split('/').pop() || a;
      const fileB = b.split('/').pop() || b;
      return collator.compare(fileA, fileB);
    });

    const pages: { blob: Blob; url: string; fileName: string; isCover: boolean }[] = [];
    const total = entries.length;

    for (let i = 0; i < total; i++) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');

      const percent = Math.round(((i + 1) / total) * 100);
      onProgress?.(`Extracting page ${i + 1} of ${total} (${percent}%)...`, percent);

      const entryPath = entries[i];
      const blob = await loadedZip.files[entryPath].async('blob');
      const url = URL.createObjectURL(blob);
      const fileNameOnly = entryPath.split('/').pop() || `page_${i + 1}.jpg`;

      pages.push({
        blob,
        url,
        fileName: fileNameOnly,
        isCover: i === 0,
      });

      // Cooperative yield to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }

    const suggestedTitle = fileName.replace(/\.(cbz|zip)$/i, '').replace(/[-_]+/g, ' ').trim();

    return {
      pages,
      coverBlob: pages[0]?.blob,
      coverUrl: pages[0]?.url,
      total: pages.length,
      suggestedTitle,
    };
  }

  /**
   * Process a Book / Novel PDF to extract text off the main thread
   */
  public async processPdfBook(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfBookResult> {
    this.cancelCurrentTask();
    this.isCancelled = false;

    if (file.size > MAX_PDF_FILE_SIZE) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 250 MB limit.`);
    }

    onProgress?.(`Loading PDF document (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 5);
    const buffer = await file.arrayBuffer();

    if (this.isCancelled) {
      throw new Error('Operation cancelled by user');
    }

    try {
      return await this.processPdfBookWithWorker(buffer, file.name, onProgress);
    } catch (workerErr: any) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');
      console.warn('PDF Worker text extraction failed or unsupported, using chunked fallback:', workerErr);
      return await this.processPdfBookChunkedFallback(buffer, file.name, onProgress);
    }
  }

  private processPdfBookWithWorker(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfBookResult> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/pdfWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.activePdfWorker = worker;

        worker.onmessage = (e: MessageEvent<PdfWorkerOutgoingMessage>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            onProgress?.(msg.message, msg.percent);
          } else if (msg.type === 'textComplete') {
            this.activePdfWorker = null;
            worker.terminate();
            resolve({
              chapters: msg.chapters,
              totalPages: msg.totalPages,
              suggestedTitle: msg.suggestedTitle,
            });
          } else if (msg.type === 'error') {
            this.activePdfWorker = null;
            worker.terminate();
            reject(new Error(msg.error));
          }
        };

        worker.onerror = (err) => {
          this.activePdfWorker = null;
          worker.terminate();
          reject(new Error(err.message || 'PDF Worker execution error'));
        };

        worker.postMessage(
          {
            action: 'extractText',
            buffer,
            fileName,
          } satisfies PdfWorkerIncomingMessage,
          [buffer]
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  private async processPdfBookChunkedFallback(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfBookResult> {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    let fullText = '';
    for (let i = 1; i <= totalPages; i++) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');

      const percent = Math.round((i / totalPages) * 100);
      onProgress?.(`Extracting text page ${i} of ${totalPages} (${percent}%)...`, percent);

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
      }

      // Yield main thread to allow UI rendering and prevent lockup
      await new Promise((r) => setTimeout(r, 0));
    }

    const suggestedTitle = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
    return {
      chapters: [{ title: 'Full Work', text: fullText.trim() }],
      totalPages,
      suggestedTitle,
    };
  }

  /**
   * Process a Comic / Manga PDF into image pages off the main thread
   */
  public async processPdfComic(
    file: File,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfComicResult> {
    this.cancelCurrentTask();
    this.isCancelled = false;

    if (file.size > MAX_PDF_FILE_SIZE) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds limit.`);
    }

    onProgress?.(`Loading PDF comic (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`, 5);
    const buffer = await file.arrayBuffer();

    if (this.isCancelled) {
      throw new Error('Operation cancelled by user');
    }

    try {
      return await this.processPdfComicWithWorker(buffer, file.name, onProgress);
    } catch (workerErr: any) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');
      console.warn('Worker PDF rendering failed or OffscreenCanvas unsupported, using chunked rendering fallback:', workerErr);
      return await this.processPdfComicChunkedFallback(buffer, file.name, onProgress);
    }
  }

  private processPdfComicWithWorker(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfComicResult> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/pdfWorker.ts', import.meta.url),
          { type: 'module' }
        );
        this.activePdfWorker = worker;

        worker.onmessage = (e: MessageEvent<PdfWorkerOutgoingMessage>) => {
          const msg = e.data;
          if (msg.type === 'progress') {
            onProgress?.(msg.message, msg.percent);
          } else if (msg.type === 'renderComplete') {
            const pages = msg.pages.map((p) => {
              const blob = new Blob([p.data], { type: 'image/jpeg' });
              const url = URL.createObjectURL(blob);
              return {
                blob,
                url,
                pageNumber: p.pageNumber,
              };
            });

            this.activePdfWorker = null;
            worker.terminate();

            resolve({
              pages,
              coverBlob: pages[0]?.blob,
              coverUrl: pages[0]?.url,
              totalPages: msg.totalPages,
              suggestedTitle: msg.suggestedTitle,
            });
          } else if (msg.type === 'error') {
            this.activePdfWorker = null;
            worker.terminate();
            reject(new Error(msg.error));
          }
        };

        worker.onerror = (err) => {
          this.activePdfWorker = null;
          worker.terminate();
          reject(new Error(err.message || 'Worker execution error'));
        };

        worker.postMessage(
          {
            action: 'renderPages',
            buffer,
            fileName,
          } satisfies PdfWorkerIncomingMessage,
          [buffer]
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  private async processPdfComicChunkedFallback(
    buffer: ArrayBuffer,
    fileName: string,
    onProgress?: ProgressCallback
  ): Promise<ProcessedPdfComicResult> {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    const totalPages = Math.min(pdf.numPages, MAX_PAGES_LIMIT);

    const pages: { blob: Blob; url: string; pageNumber: number }[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (this.isCancelled) throw new Error('Operation cancelled by user');

      const percent = Math.round((i / totalPages) * 100);
      onProgress?.(`Rendering page ${i} of ${totalPages} (${percent}%)...`, percent);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      if (context) {
        await (page as any).render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
        );

        if (blob) {
          const url = URL.createObjectURL(blob);
          pages.push({ blob, url, pageNumber: i });
        }
      }

      // Memory cleanup: reset canvas dimensions
      canvas.width = 0;
      canvas.height = 0;

      // Yield event loop
      await new Promise((r) => setTimeout(r, 0));
    }

    const suggestedTitle = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
    return {
      pages,
      coverBlob: pages[0]?.blob,
      coverUrl: pages[0]?.url,
      totalPages: pages.length,
      suggestedTitle,
    };
  }
}

export const mediaProcessingService = new MediaProcessingService();
