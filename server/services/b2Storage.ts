import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface StorageConfig {
  configured: boolean;
  provider: 'backblaze_b2' | 'local_disk';
  bucket: string;
  region: string;
  endpoint: string;
  publicCdnUrl?: string;
  keyIdMasked?: string;
}

let s3ClientInstance: S3Client | null = null;
let cachedConfig: {
  keyId: string;
  appKey: string;
  bucket: string;
  endpoint: string;
  region: string;
  cdnUrl: string;
} | null = null;

/**
 * Normalizes endpoint URL to include https:// protocol if missing
 */
function normalizeEndpoint(endpointStr: string): string {
  if (!endpointStr) return '';
  const trimmed = endpointStr.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Extracts B2 region from endpoint (e.g. s3.us-west-004.backblazeb2.com -> us-west-004)
 */
function extractRegion(endpoint: string, fallbackRegion?: string): string {
  if (fallbackRegion && fallbackRegion.trim()) {
    return fallbackRegion.trim();
  }
  const match = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  if (match && match[1]) {
    return match[1];
  }
  return 'us-west-004';
}

/**
 * Reads B2 credentials from process.env
 */
function getB2Env() {
  const keyId =
    process.env.B2_KEY_ID ||
    process.env.B2_APPLICATION_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    '';
  const appKey =
    process.env.B2_APPLICATION_KEY ||
    process.env.B2_APP_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    '';
  const bucket =
    process.env.B2_BUCKET_NAME ||
    process.env.B2_BUCKET ||
    '';
  const rawEndpoint =
    process.env.B2_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL ||
    'https://s3.us-west-004.backblazeb2.com';
  const endpoint = normalizeEndpoint(rawEndpoint);
  const region = extractRegion(endpoint, process.env.B2_REGION || process.env.AWS_REGION);
  const cdnUrl = (process.env.B2_PUBLIC_URL || process.env.B2_CDN_URL || '').replace(/\/+$/, '');

  return {
    keyId: keyId.trim(),
    appKey: appKey.trim(),
    bucket: bucket.trim(),
    endpoint,
    region,
    cdnUrl,
  };
}

/**
 * Check whether Backblaze B2 is configured with necessary credentials
 */
export function isB2Configured(): boolean {
  const env = getB2Env();
  return Boolean(env.keyId && env.appKey && env.bucket);
}

/**
 * Get or initialize S3 client configured for Backblaze B2
 */
export function getB2Client(): S3Client | null {
  if (!isB2Configured()) {
    return null;
  }

  const env = getB2Env();

  // Re-instantiate if config changed
  if (
    !s3ClientInstance ||
    !cachedConfig ||
    cachedConfig.keyId !== env.keyId ||
    cachedConfig.appKey !== env.appKey ||
    cachedConfig.endpoint !== env.endpoint
  ) {
    cachedConfig = env;
    s3ClientInstance = new S3Client({
      endpoint: env.endpoint,
      region: env.region,
      credentials: {
        accessKeyId: env.keyId,
        secretAccessKey: env.appKey,
      },
      forcePathStyle: true, // Recommended for Backblaze B2 S3 API
    });
  }

  return s3ClientInstance;
}

/**
 * Returns safe overview of current storage configuration
 */
export function getStorageOverview(): StorageConfig {
  const env = getB2Env();
  const configured = isB2Configured();

  return {
    configured,
    provider: configured ? 'backblaze_b2' : 'local_disk',
    bucket: env.bucket || '',
    region: env.region || 'us-west-004',
    endpoint: env.endpoint,
    publicCdnUrl: env.cdnUrl || undefined,
    keyIdMasked: env.keyId
      ? `${env.keyId.slice(0, 4)}...${env.keyId.slice(-4)}`
      : undefined,
  };
}

/**
 * Test connectivity with Backblaze B2 bucket
 */
export async function testB2Connection(): Promise<{
  success: boolean;
  message: string;
  bucket?: string;
  endpoint?: string;
  latencyMs?: number;
}> {
  if (!isB2Configured()) {
    return {
      success: false,
      message: 'Backblaze B2 is not configured. Missing B2_KEY_ID, B2_APPLICATION_KEY, or B2_BUCKET_NAME.',
    };
  }

  const client = getB2Client();
  const env = getB2Env();
  if (!client) {
    return { success: false, message: 'Failed to initialize B2 client.' };
  }

  const start = Date.now();
  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: env.bucket,
      })
    );
    const latencyMs = Date.now() - start;
    return {
      success: true,
      message: `Successfully connected to Backblaze B2 bucket "${env.bucket}" (${latencyMs}ms).`,
      bucket: env.bucket,
      endpoint: env.endpoint,
      latencyMs,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Backblaze B2: ${err?.message || 'Unknown error'}`,
      bucket: env.bucket,
      endpoint: env.endpoint,
    };
  }
}

/**
 * Uploads a buffer directly to Backblaze B2
 */
export async function uploadToB2(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{
  success: boolean;
  key: string;
  url: string;
  directCdnUrl?: string;
}> {
  const client = getB2Client();
  const env = getB2Env();

  if (!client || !isB2Configured()) {
    throw new Error('Backblaze B2 is not configured');
  }

  // Clean key (prevent leading slash)
  const cleanKey = params.key.replace(/^\/+/, '');

  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: cleanKey,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: params.metadata,
    })
  );

  // If a public CDN or Cloudflare domain is configured, provide direct CDN link
  let directCdnUrl: string | undefined;
  if (env.cdnUrl) {
    directCdnUrl = `${env.cdnUrl}/${cleanKey}`;
  }

  // The application fallback proxy path
  const proxyUrl = `/api/media/files/${cleanKey}`;

  return {
    success: true,
    key: cleanKey,
    url: directCdnUrl || proxyUrl,
    directCdnUrl,
  };
}

/**
 * Retrieves a file stream from Backblaze B2
 */
export async function getFromB2(key: string): Promise<{
  stream: Readable;
  contentType?: string;
  contentLength?: number;
  etag?: string;
} | null> {
  const client = getB2Client();
  const env = getB2Env();

  if (!client || !isB2Configured()) {
    return null;
  }

  const cleanKey = key.replace(/^\/+/, '');

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.bucket,
        Key: cleanKey,
      })
    );

    if (!response.Body) {
      return null;
    }

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength,
      etag: response.ETag,
    };
  } catch (err: any) {
    if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    console.error(`B2 getObject error for key "${cleanKey}":`, err?.message || err);
    return null;
  }
}

/**
 * Deletes a file from Backblaze B2
 */
export async function deleteFromB2(key: string): Promise<boolean> {
  const client = getB2Client();
  const env = getB2Env();

  if (!client || !isB2Configured()) {
    return false;
  }

  const cleanKey = key.replace(/^\/+/, '');
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.bucket,
        Key: cleanKey,
      })
    );
    return true;
  } catch (err) {
    console.error(`Failed to delete B2 key "${cleanKey}":`, err);
    return false;
  }
}
