import { apiUrl } from './apiConfig';
import { auth } from '../firebase';

export interface ResilientProgressState {
  stage: 'checking' | 'chunking' | 'uploading' | 'finalizing' | 'completed' | 'error';
  percent: number;
  message: string;
  isRetrying?: boolean;
  retryAttempt?: number;
  maxRetries?: number;
  currentChunk?: number;
  totalChunks?: number;
  canResume?: boolean;
  uploadId?: string;
}

export type ResilientProgressCallback = (state: ResilientProgressState) => void;

export class ResumableUploadError extends Error {
  public canResume: boolean;
  public uploadId: string;
  public completedChunks: number[];
  public totalChunks: number;

  constructor(message: string, uploadId: string, completedChunks: number[], totalChunks: number) {
    super(message);
    this.name = 'ResumableUploadError';
    this.canResume = true;
    this.uploadId = uploadId;
    this.completedChunks = completedChunks;
    this.totalChunks = totalChunks;
  }
}

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB chunk size
const MAX_CHUNK_RETRIES = 3;

/**
 * Helper to get fresh Firebase Auth token or active reader session token
 */
export async function getAuthToken(user?: { uid?: string | null; email?: string | null; displayName?: string | null } | null): Promise<string | null> {
  try {
    const fbToken = await auth.currentUser?.getIdToken();
    if (fbToken) return fbToken;
  } catch {}

  // Fallback to active reader session
  try {
    let u = user;
    if (!u) {
      const stored = localStorage.getItem('getnow_active_user_profile_v3');
      if (stored) {
        u = JSON.parse(stored);
      }
    }
    if (u?.uid) {
      const payload = {
        uid: u.uid,
        email: u.email || `${u.uid}@getnow.local`,
        name: u.displayName || 'Reader',
        time: Date.now(),
      };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      return `gn_sess_${b64}`;
    }
  } catch {}

  return null;
}

/**
 * Helper to generate a stable, URL-safe session upload ID for a file
 */
export function generateUploadSessionId(file: File | Blob, prefix = 'upl'): string {
  const name = 'name' in file ? file.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) : 'data';
  const size = file.size;
  const lastMod = 'lastModified' in file ? file.lastModified : 0;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${name}-${size}-${lastMod}-${rand}`.slice(0, 60);
}

/**
 * Resiliently upload a large file (archive, cover, etc.) in chunks with automatic retry and resumption
 */
export async function uploadFileWithResilientChunks<T = any>(
  file: File,
  fileType: 'archive' | 'cover' | 'file',
  options: {
    uploadId?: string;
    onProgress?: ResilientProgressCallback;
    workSlug?: string;
  } = {}
): Promise<T> {
  const uploadId = options.uploadId || generateUploadSessionId(file, fileType);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const onProgress = options.onProgress;

  onProgress?.({
    stage: 'checking',
    percent: 5,
    message: `Checking upload session for ${file.name}...`,
    uploadId,
    totalChunks,
  });

  const token = await getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. Check for existing chunks on the server (Resumption check)
  let receivedChunks = new Set<number>();
  try {
    const statusRes = await fetch(apiUrl(`/api/media/chunk-status/${uploadId}`), {
      headers: authHeaders,
    });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (Array.isArray(statusData.receivedChunks)) {
        statusData.receivedChunks.forEach((idx: number) => receivedChunks.add(idx));
      }
    }
  } catch (err) {
    console.warn('Could not inspect prior chunk status, starting fresh:', err);
  }

  // 2. Upload remaining chunks sequentially with retry
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (receivedChunks.has(chunkIndex)) {
      const pct = Math.round(((chunkIndex + 1) / totalChunks) * 85);
      onProgress?.({
        stage: 'uploading',
        percent: pct,
        message: `Restored chunk ${chunkIndex + 1} of ${totalChunks} from session (${pct}%)`,
        currentChunk: chunkIndex + 1,
        totalChunks,
        uploadId,
      });
      continue;
    }

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    let uploaded = false;
    let attempt = 0;

    while (!uploaded && attempt <= MAX_CHUNK_RETRIES) {
      try {
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
          onProgress?.({
            stage: 'uploading',
            percent: Math.round((chunkIndex / totalChunks) * 85),
            message: `Connection unstable. Retrying chunk ${chunkIndex + 1}/${totalChunks} in ${Math.round(waitTime / 1000)}s (Attempt ${attempt}/${MAX_CHUNK_RETRIES})...`,
            isRetrying: true,
            retryAttempt: attempt,
            maxRetries: MAX_CHUNK_RETRIES,
            currentChunk: chunkIndex + 1,
            totalChunks,
            uploadId,
          });
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        const currentPct = Math.round(((chunkIndex + 0.5) / totalChunks) * 85);
        onProgress?.({
          stage: 'uploading',
          percent: currentPct,
          message: `Uploading chunk ${chunkIndex + 1} of ${totalChunks} (${currentPct}%)...`,
          isRetrying: false,
          currentChunk: chunkIndex + 1,
          totalChunks,
          uploadId,
        });

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);
        formData.append('chunk', chunkBlob, `chunk-${chunkIndex}.bin`);

        const res = await fetch(apiUrl('/api/media/upload-chunk'), {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          throw new Error(errorJson.error || `Server responded with status ${res.status}`);
        }

        receivedChunks.add(chunkIndex);
        uploaded = true;
      } catch (chunkErr: any) {
        attempt++;
        if (attempt > MAX_CHUNK_RETRIES) {
          const completedArr = Array.from(receivedChunks);
          onProgress?.({
            stage: 'error',
            percent: Math.round((chunkIndex / totalChunks) * 85),
            message: `Upload paused: Network disconnected at chunk ${chunkIndex + 1}. You can resume anytime.`,
            canResume: true,
            uploadId,
          });
          throw new ResumableUploadError(
            `Network error at chunk ${chunkIndex + 1}/${totalChunks}: ${chunkErr?.message || 'Connection lost'}`,
            uploadId,
            completedArr,
            totalChunks
          );
        }
      }
    }
  }

  // 3. Finalize and stitch chunks on server
  onProgress?.({
    stage: 'finalizing',
    percent: 88,
    message: `All chunks received. Server is validating and processing ${file.name}...`,
    uploadId,
  });

  let finalizeAttempt = 0;
  while (finalizeAttempt <= 2) {
    try {
      const completeRes = await fetch(apiUrl('/api/media/complete-chunk-upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileType,
          workSlug: options.workSlug,
        }),
      });

      if (!completeRes.ok) {
        const errJson = await completeRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server failed to finalize upload (${completeRes.status})`);
      }

      const result = await completeRes.json();
      onProgress?.({
        stage: 'completed',
        percent: 100,
        message: 'Upload completed and verified successfully!',
        uploadId,
      });

      return result as T;
    } catch (finalErr: any) {
      finalizeAttempt++;
      if (finalizeAttempt > 2) {
        throw finalErr;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Failed to finalize upload after server processing attempts.');
}

/**
 * Resilient multi-page upload with batching, exponential retry, and detailed progress
 */
export async function uploadPagesResiliently(
  pages: { blob: Blob; fileName?: string }[],
  options: {
    workSlug: string;
    batchSize?: number;
    onProgress?: (progress: {
      percent: number;
      message: string;
      completedPages: number;
      totalPages: number;
      isRetrying?: boolean;
    }) => void;
  }
): Promise<string[]> {
  const batchSize = options.batchSize || 10;
  const total = pages.length;
  if (total === 0) {
    return [];
  }
  const token = await getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const allPageUrls: string[] = [];

  for (let i = 0; i < total; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const startIdx = i + 1;
    const endIdx = Math.min(i + batchSize, total);

    let success = false;
    let attempt = 0;

    while (!success && attempt <= MAX_CHUNK_RETRIES) {
      try {
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          options.onProgress?.({
            percent: Math.round((i / total) * 100),
            message: `Network retry: sync batch pages ${startIdx}-${endIdx} of ${total} (Attempt ${attempt}/${MAX_CHUNK_RETRIES})...`,
            completedPages: allPageUrls.length,
            totalPages: total,
            isRetrying: true,
          });
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        const pct = Math.round(((i + batch.length * 0.5) / total) * 100);
        options.onProgress?.({
          percent: pct,
          message: `Uploading pages ${startIdx} to ${endIdx} of ${total} (${pct}%)...`,
          completedPages: allPageUrls.length,
          totalPages: total,
          isRetrying: false,
        });

        const formData = new FormData();
        formData.append('workSlug', options.workSlug || `pages-${Date.now()}`);
        batch.forEach((p, bIdx) => {
          const fName = p.fileName || `page_${i + bIdx + 1}.jpg`;
          formData.append('pages', p.blob, fName);
        });

        const res = await fetch(apiUrl('/api/media/upload-pages'), {
          method: 'POST',
          headers: authHeaders,
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.pageUrls)) {
            allPageUrls.push(...data.pageUrls);
            success = true;
          } else {
            throw new Error('Server returned unexpected response structure');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
      } catch (err: any) {
        attempt++;
        if (attempt > MAX_CHUNK_RETRIES) {
          throw new Error(
            `Failed to upload pages ${startIdx}-${endIdx} after ${MAX_CHUNK_RETRIES} network retry attempts: ${err?.message || 'Connection lost'}`
          );
        }
      }
    }
  }

  options.onProgress?.({
    percent: 100,
    message: `All ${total} pages uploaded successfully!`,
    completedPages: total,
    totalPages: total,
  });

  return allPageUrls;
}
