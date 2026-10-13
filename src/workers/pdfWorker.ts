import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfTextChapter {
  title: string;
  text: string;
}

export interface PdfRenderedPage {
  pageNumber: number;
  data: ArrayBuffer;
  width: number;
  height: number;
}

export type PdfWorkerIncomingMessage =
  | {
      action: 'extractText';
      buffer: ArrayBuffer;
      fileName: string;
      maxPages?: number;
    }
  | {
      action: 'renderPages';
      buffer: ArrayBuffer;
      fileName: string;
      maxPages?: number;
      scale?: number;
    }
  | {
      action: 'cancel';
    };

export type PdfWorkerOutgoingMessage =
  | {
      type: 'progress';
      phase: 'reading' | 'extracting_text' | 'rendering_pages';
      current: number;
      total: number;
      percent: number;
      message: string;
    }
  | {
      type: 'textComplete';
      chapters: PdfTextChapter[];
      totalPages: number;
      suggestedTitle: string;
    }
  | {
      type: 'renderComplete';
      pages: PdfRenderedPage[];
      totalPages: number;
      suggestedTitle: string;
    }
  | {
      type: 'error';
      error: string;
    };

let isCancelled = false;

self.onmessage = async (e: MessageEvent<PdfWorkerIncomingMessage>) => {
  const msg = e.data;

  if (msg.action === 'cancel') {
    isCancelled = true;
    return;
  }

  isCancelled = false;

  try {
    if (msg.action === 'extractText') {
      const { buffer, fileName, maxPages = 600 } = msg;

      self.postMessage({
        type: 'progress',
        phase: 'reading',
        current: 0,
        total: 100,
        percent: 5,
        message: 'Loading PDF document...',
      } satisfies PdfWorkerOutgoingMessage);

      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      const totalPages = Math.min(pdf.numPages, maxPages);

      let fullText = '';
      const chapters: PdfTextChapter[] = [];

      for (let i = 1; i <= totalPages; i++) {
        if (isCancelled) return;

        const percent = Math.round((i / totalPages) * 100);
        self.postMessage({
          type: 'progress',
          phase: 'extracting_text',
          current: i,
          total: totalPages,
          percent,
          message: `Extracting text page ${i} of ${totalPages} (${percent}%)...`,
        } satisfies PdfWorkerOutgoingMessage);

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
      }

      const suggestedTitle = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();

      chapters.push({
        title: 'Full Work',
        text: fullText.trim(),
      });

      self.postMessage({
        type: 'textComplete',
        chapters,
        totalPages,
        suggestedTitle,
      } satisfies PdfWorkerOutgoingMessage);
      return;
    }

    if (msg.action === 'renderPages') {
      const { buffer, fileName, maxPages = 100, scale = 1.4 } = msg;

      self.postMessage({
        type: 'progress',
        phase: 'reading',
        current: 0,
        total: 100,
        percent: 5,
        message: 'Parsing PDF comic structure...',
      } satisfies PdfWorkerOutgoingMessage);

      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      const totalPages = Math.min(pdf.numPages, maxPages);

      // Check if OffscreenCanvas is available in this worker environment
      if (typeof OffscreenCanvas === 'undefined') {
        throw new Error('OFFSCREEN_CANVAS_UNSUPPORTED');
      }

      const renderedPages: PdfRenderedPage[] = [];

      for (let i = 1; i <= totalPages; i++) {
        if (isCancelled) return;

        const percent = Math.round((i / totalPages) * 100);
        self.postMessage({
          type: 'progress',
          phase: 'rendering_pages',
          current: i,
          total: totalPages,
          percent,
          message: `Rendering page ${i} of ${totalPages} (${percent}%)...`,
        } satisfies PdfWorkerOutgoingMessage);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const offscreen = new OffscreenCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
        const context = offscreen.getContext('2d');

        if (!context) {
          throw new Error('Failed to create 2d rendering context in Web Worker');
        }

        await (page as any).render({
          canvasContext: context,
          viewport,
        }).promise;

        // Convert OffscreenCanvas to Blob or ArrayBuffer
        const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
        const arrayBuffer = await blob.arrayBuffer();

        renderedPages.push({
          pageNumber: i,
          data: arrayBuffer,
          width: offscreen.width,
          height: offscreen.height,
        });
      }

      const suggestedTitle = fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ').trim();
      const transferList = renderedPages.map((p) => p.data);

      self.postMessage(
        {
          type: 'renderComplete',
          pages: renderedPages,
          totalPages,
          suggestedTitle,
        } satisfies PdfWorkerOutgoingMessage,
        { transfer: transferList }
      );
    }
  } catch (err: any) {
    self.postMessage({
      type: 'error',
      error: err.message || 'PDF processing failed',
    } satisfies PdfWorkerOutgoingMessage);
  }
};
