/**
 * Image Optimizer Utility for Client-side Compression
 *
 * Resizes and compresses image Files, Blobs, or data URLs using an HTML Canvas.
 * Converts raw multi-megabyte user uploads (3-10 MB) into crisp, optimized WebP/JPEG thumbnails (30-60 KB)
 * preventing Firestore 1MB document size limits and localStorage QuotaExceededError.
 */

export async function compressImageToDataUrl(
  source: File | Blob | string,
  maxWidth: number = 480,
  maxHeight: number = 720,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let objectUrl: string | null = null;

      if (typeof source === 'string') {
        img.src = source;
      } else {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
      }

      img.onload = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(typeof source === 'string' ? source : '');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP for optimal compression, fallback to JPEG
          try {
            const webpUrl = canvas.toDataURL('image/webp', quality);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              resolve(webpUrl);
              return;
            }
          } catch {}

          const jpegUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegUrl);
        } catch {
          resolve(typeof source === 'string' ? source : '');
        }
      };

      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        resolve(typeof source === 'string' ? source : '');
      };
    } catch {
      resolve(typeof source === 'string' ? source : '');
    }
  });
}
