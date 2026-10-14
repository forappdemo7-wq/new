import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Types
export type UploadSource = Buffer | string | Readable | NodeJS.ReadableStream;

export interface UploadResult {
  url: string;
  provider: 'firebase' | 'backblaze' | 'local';
  storagePath: string;
}

// 1. Firebase Client Storage (Lazy or Config-based)
let firebaseStorage: ReturnType<typeof getStorage> | null = null;
let firebaseBucketName: string | null = null;
let firebaseStorageAvailable = true;

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (firebaseConfig.storageBucket) {
      firebaseStorage = getStorage(app);
      firebaseBucketName = firebaseConfig.storageBucket;
    }
  }
} catch {
  firebaseStorageAvailable = false;
}

// 2. Firebase Admin Storage for direct server-side streaming
let adminStorageBucket: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (firebaseConfig.storageBucket && firebaseConfig.projectId) {
      const adminApp = getAdminApps().length > 0
        ? getAdminApps()[0]
        : initAdminApp({ projectId: firebaseConfig.projectId, storageBucket: firebaseConfig.storageBucket });
      adminStorageBucket = getAdminStorage(adminApp).bucket(firebaseConfig.storageBucket);
    }
  }
} catch {
  adminStorageBucket = null;
}

// 3. Backblaze B2 S3 Client Initialization (lazy-loaded)
let b2Client: S3Client | null = null;
let b2Available = true;

function getB2Client(): { client: S3Client; bucket: string; endpoint: string; region: string } | null {
  if (!b2Available) return null;

  const keyId = (process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID || '').trim();
  const applicationKey = (process.env.B2_APPLICATION_KEY || '').trim();
  const bucketName = (process.env.B2_BUCKET_NAME || '').trim();

  if (!keyId || !applicationKey || !bucketName) {
    return null;
  }

  // Validate S3 bucket name: no spaces, valid DNS chars, not placeholder/label text
  const isValidBucket = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/i.test(bucketName) && !bucketName.toLowerCase().includes('application key');
  // Backblaze S3 credentials require valid application key (not truncated/master key)
  const isValidKey = keyId.length >= 16 && applicationKey.length >= 20;

  if (!isValidBucket || !isValidKey) {
    b2Available = false;
    return null;
  }

  const region = process.env.B2_REGION || 'us-west-004';
  const rawEndpoint = process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;
  const endpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;

  if (!b2Client) {
    try {
      b2Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: keyId,
          secretAccessKey: applicationKey,
        },
      });
    } catch {
      b2Available = false;
      return null;
    }
  }

  return { client: b2Client, bucket: bucketName, endpoint, region };
}

function isBucketNotFoundError(err: any): boolean {
  const msg = (err?.message || String(err)).toLowerCase();
  return (
    msg.includes('bucket does not exist') ||
    msg.includes('storage/unknown') ||
    msg.includes('not found') ||
    msg.includes('not initialized') ||
    msg.includes('no such bucket')
  );
}

/**
 * Creates a readable stream from a source (file path, buffer, or existing stream)
 */
function createReadableStream(source: UploadSource): Readable {
  if (typeof source === 'string') {
    return fs.createReadStream(source);
  }
  if (Buffer.isBuffer(source)) {
    return Readable.from(source);
  }
  if (source instanceof Readable) {
    return source;
  }
  return Readable.from(source as any);
}

/**
 * Reads the source into a Uint8Array if a buffer is strictly needed by legacy SDKs
 */
async function toUint8Array(source: UploadSource): Promise<Uint8Array> {
  if (Buffer.isBuffer(source)) {
    return new Uint8Array(source);
  }
  if (typeof source === 'string') {
    const fileBuf = await fs.promises.readFile(source);
    return new Uint8Array(fileBuf);
  }
  // If it's a stream, collect chunks into buffer
  const chunks: Buffer[] = [];
  for await (const chunk of source as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}

/**
 * Uploads to Firebase Storage (Primary) using server streaming or client SDK
 */
async function uploadToFirebase(
  source: UploadSource,
  storagePath: string,
  contentType: string
): Promise<string> {
  if (!firebaseStorageAvailable) {
    throw new Error('Firebase Storage is not available');
  }

  // First attempt: Firebase Admin stream write if available
  if (adminStorageBucket) {
    try {
      const file = adminStorageBucket.file(storagePath);
      const writeStream = file.createWriteStream({
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
        resumable: false,
      });

      const readStream = createReadableStream(source);
      await pipeline(readStream, writeStream);

      // Make public or get download URL
      try {
        await file.makePublic();
        return `https://storage.googleapis.com/${adminStorageBucket.name}/${storagePath}`;
      } catch {
        // Return public GCS / Firebase path format
        return `https://firebasestorage.googleapis.com/v0/b/${adminStorageBucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      }
    } catch (adminErr: any) {
      if (isBucketNotFoundError(adminErr)) {
        firebaseStorageAvailable = false;
        throw adminErr;
      }
    }
  }

  // Second attempt: Firebase Client SDK
  if (!firebaseStorage || !firebaseStorageAvailable) {
    throw new Error('Firebase Storage is not available');
  }

  try {
    const fileRef = ref(firebaseStorage, storagePath);
    const data = await toUint8Array(source);
    const snapshot = await uploadBytes(fileRef, data, {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    });

    return await getDownloadURL(snapshot.ref);
  } catch (clientErr: any) {
    if (isBucketNotFoundError(clientErr)) {
      firebaseStorageAvailable = false;
    }
    throw clientErr;
  }
}

/**
 * Uploads to Backblaze B2 (Fallback) using streaming multipart uploads via @aws-sdk/lib-storage
 */
async function uploadToBackblaze(
  source: UploadSource,
  storagePath: string,
  contentType: string
): Promise<string> {
  const b2Config = getB2Client();
  if (!b2Config) {
    throw new Error('Backblaze B2 is not configured');
  }

  const { client, bucket, endpoint } = b2Config;
  const bodyStream = createReadableStream(source);

  // Use streaming multipart upload (avoids keeping full file in heap memory)
  const parallelUpload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: storagePath,
      Body: bodyStream,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    },
    partSize: 5 * 1024 * 1024, // 5MB parts
    queueSize: 4,              // 4 concurrent part uploads
    leavePartsOnError: false,
  });

  await parallelUpload.done();

  // Determine public download URL
  const customDomain = process.env.B2_CUSTOM_DOMAIN;
  if (customDomain) {
    const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${cleanDomain}/${storagePath}`;
  }

  const host = endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${bucket}.${host}/${storagePath}`;
}

/**
 * Streams to local disk (Offline / Development Fallback)
 */
async function uploadToLocal(source: UploadSource, storagePath: string): Promise<string> {
  const uploadsRoot = path.resolve(process.cwd(), 'data', 'uploads');
  const fullPath = path.resolve(uploadsRoot, storagePath);
  const dir = path.dirname(fullPath);

  await fs.promises.mkdir(dir, { recursive: true });

  if (typeof source === 'string') {
    // Zero-allocation copy if source is already on disk
    await fs.promises.copyFile(source, fullPath);
  } else if (Buffer.isBuffer(source)) {
    await fs.promises.writeFile(fullPath, source);
  } else {
    // Stream directly to destination file
    const destStream = fs.createWriteStream(fullPath);
    await pipeline(source, destStream);
  }

  return `/api/media/files/${storagePath}`;
}

/**
 * Multi-Tiered Unified Storage Upload with Stream Support:
 * 1. Primary: Firebase Storage (Streaming via Admin SDK or Client SDK)
 * 2. Fallback: Backblaze B2 Cloud Storage (Streaming multipart upload via @aws-sdk/lib-storage)
 * 3. Offline Fallback: Local Server Disk Storage (Streaming pipeline copy)
 *
 * Accepts a file path on disk (preferred for zero-heap usage), a Readable stream, or a Buffer.
 */
export async function uploadMediaFile(
  source: UploadSource,
  storagePath: string,
  contentType: string = 'image/webp'
): Promise<UploadResult> {
  const normalizedPath = storagePath.replace(/^\/+/, '');

  // 1. Try Firebase Storage (Primary) if bucket is available
  if (firebaseStorageAvailable && (adminStorageBucket || firebaseStorage)) {
    try {
      const url = await uploadToFirebase(source, normalizedPath, contentType);
      return { url, provider: 'firebase', storagePath: normalizedPath };
    } catch (firebaseErr: any) {
      if (isBucketNotFoundError(firebaseErr)) {
        firebaseStorageAvailable = false;
      }
    }
  }

  // 2. Try Backblaze B2 (Fallback) if configured and active
  if (b2Available && getB2Client()) {
    try {
      const url = await uploadToBackblaze(source, normalizedPath, contentType);
      return { url, provider: 'backblaze', storagePath: normalizedPath };
    } catch (b2Err: any) {
      const msg = (b2Err?.message || String(b2Err)).toLowerCase();
      if (msg.includes('malformed') || msg.includes('invalidaccesskey') || msg.includes('not configured')) {
        b2Available = false;
      }
    }
  }

  // 3. Fallback to Local Disk (Immediate, robust, and zero-dependency)
  const localUrl = await uploadToLocal(source, normalizedPath);
  return { url: localUrl, provider: 'local', storagePath: normalizedPath };
}

/**
 * Returns storage system status overview for health checks
 */
export function getStorageOverview() {
  const b2 = getB2Client();
  return {
    primary: {
      provider: 'firebase',
      enabled: Boolean(firebaseStorage || adminStorageBucket),
      bucket: firebaseBucketName,
    },
    fallback: {
      provider: 'backblaze',
      enabled: Boolean(b2),
      bucket: b2?.bucket || null,
      region: b2?.region || null,
    },
    offline: {
      provider: 'local',
      enabled: true,
    },
  };
}
