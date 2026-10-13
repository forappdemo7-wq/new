import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Load Firebase Config if available
let firebaseStorage: ReturnType<typeof getStorage> | null = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (firebaseConfig.storageBucket) {
      firebaseStorage = getStorage(app);
      console.log(`[Storage] Firebase Storage initialized with bucket: ${firebaseConfig.storageBucket}`);
    }
  }
} catch (err: any) {
  console.warn('[Storage] Failed to initialize Firebase Storage:', err?.message);
}

// Backblaze B2 S3 Client Initialization (lazy-loaded)
let b2Client: S3Client | null = null;
function getB2Client(): { client: S3Client; bucket: string; endpoint: string; region: string } | null {
  const keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;

  if (!keyId || !applicationKey || !bucketName) {
    return null;
  }

  const region = process.env.B2_REGION || 'us-west-004';
  const rawEndpoint = process.env.B2_ENDPOINT || `https://s3.${region}.backblazeb2.com`;
  const endpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;

  if (!b2Client) {
    b2Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey,
      },
    });
    console.log(`[Storage] Backblaze B2 S3 client initialized for bucket "${bucketName}" at ${endpoint}`);
  }

  return { client: b2Client, bucket: bucketName, endpoint, region };
}

/**
 * Result of a file upload operation
 */
export interface UploadResult {
  url: string;
  provider: 'firebase' | 'backblaze' | 'local';
  storagePath: string;
}

/**
 * Uploads a buffer to Firebase Storage (Primary)
 */
async function uploadToFirebase(buffer: Buffer, storagePath: string, contentType: string): Promise<string> {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not initialized');
  }

  const fileRef = ref(firebaseStorage, storagePath);
  const uint8Array = new Uint8Array(buffer);
  const snapshot = await uploadBytes(fileRef, uint8Array, {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}

/**
 * Uploads a buffer to Backblaze B2 (Fallback)
 */
async function uploadToBackblaze(buffer: Buffer, storagePath: string, contentType: string): Promise<string> {
  const b2Config = getB2Client();
  if (!b2Config) {
    throw new Error('Backblaze B2 credentials (B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME) are not configured');
  }

  const { client, bucket, endpoint, region } = b2Config;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storagePath,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  await client.send(command);

  // Determine public download URL
  const customDomain = process.env.B2_CUSTOM_DOMAIN;
  if (customDomain) {
    const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${cleanDomain}/${storagePath}`;
  }

  // Backblaze S3 public URL format
  // e.g. https://<bucket>.s3.<region>.backblazeb2.com/<storagePath>
  const host = endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${bucket}.${host}/${storagePath}`;
}

/**
 * Uploads a buffer to local disk (Offline / Development Fallback)
 */
function uploadToLocal(buffer: Buffer, storagePath: string): string {
  const uploadsRoot = path.resolve(process.cwd(), 'data', 'uploads');
  const fullPath = path.resolve(uploadsRoot, storagePath);
  const dir = path.dirname(fullPath);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, buffer);

  return `/api/media/files/${storagePath}`;
}

/**
 * Multi-Tiered Unified Storage Upload:
 * 1. Primary: Firebase Storage
 * 2. Fallback: Backblaze B2 Cloud Storage (if Firebase quota exceeded, rate limited, or fails)
 * 3. Offline Fallback: Local Server Disk Storage
 */
export async function uploadMediaFile(
  buffer: Buffer,
  storagePath: string,
  contentType: string = 'image/webp'
): Promise<UploadResult> {
  // Normalize path (no leading slash)
  const normalizedPath = storagePath.replace(/^\/+/, '');

  // 1. Try Firebase Storage (Primary)
  try {
    const url = await uploadToFirebase(buffer, normalizedPath, contentType);
    return { url, provider: 'firebase', storagePath: normalizedPath };
  } catch (firebaseErr: any) {
    console.warn(`[Storage] Firebase upload failed for "${normalizedPath}": ${firebaseErr?.message || firebaseErr}`);
    console.warn('[Storage] Triggering fallback to Backblaze B2...');
  }

  // 2. Try Backblaze B2 (Fallback)
  try {
    const url = await uploadToBackblaze(buffer, normalizedPath, contentType);
    console.log(`[Storage] Successfully uploaded "${normalizedPath}" to Backblaze B2!`);
    return { url, provider: 'backblaze', storagePath: normalizedPath };
  } catch (b2Err: any) {
    console.warn(`[Storage] Backblaze B2 upload failed for "${normalizedPath}": ${b2Err?.message || b2Err}`);
    console.warn('[Storage] Triggering fallback to local server disk...');
  }

  // 3. Fallback to Local Disk
  const localUrl = uploadToLocal(buffer, normalizedPath);
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
      enabled: Boolean(firebaseStorage),
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
