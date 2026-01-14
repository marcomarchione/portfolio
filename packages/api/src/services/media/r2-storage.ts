/**
 * R2 Storage Provider
 *
 * Handles file operations with Cloudflare R2 using S3-compatible API.
 * All methods are designed to match the local storage interface.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { generateStorageKey, getVariantKey, type VariantType } from './storage';

/** R2 configuration from environment variables */
export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

/** Result of a file save operation */
export interface R2SaveResult {
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

/** Singleton S3 client instance */
let s3Client: S3Client | null = null;
let currentConfig: R2Config | null = null;

/**
 * Gets or creates the S3 client for R2.
 * Uses singleton pattern to reuse connection.
 */
export function getR2Client(config: R2Config): S3Client {
  if (s3Client && currentConfig && isSameConfig(currentConfig, config)) {
    return s3Client;
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  currentConfig = config;

  return s3Client;
}

/**
 * Checks if two configs are the same.
 */
function isSameConfig(a: R2Config, b: R2Config): boolean {
  return (
    a.accountId === b.accountId &&
    a.accessKeyId === b.accessKeyId &&
    a.secretAccessKey === b.secretAccessKey &&
    a.bucketName === b.bucketName
  );
}

/**
 * Gets R2 configuration from environment variables.
 * Returns null if R2 is not configured.
 */
export function getR2ConfigFromEnv(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

/**
 * Saves a file to R2.
 *
 * @param file - File object from multipart form data
 * @param config - R2 configuration
 * @returns Save result with storage key and public URL
 */
export async function saveFileToR2(file: File, config: R2Config): Promise<R2SaveResult> {
  const client = getR2Client(config);
  const storageKey = generateStorageKey(file.name);
  const arrayBuffer = await file.arrayBuffer();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: storageKey,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      ContentLength: file.size,
    })
  );

  return {
    storageKey,
    url: `${config.publicUrl}/${storageKey}`,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

/**
 * Saves a buffer to R2 with a specific storage key.
 * Used for saving processed image variants.
 *
 * @param buffer - Buffer to save
 * @param storageKey - Storage key to use
 * @param mimeType - MIME type of the content
 * @param config - R2 configuration
 */
export async function saveBufferToR2(
  buffer: Buffer | Uint8Array,
  storageKey: string,
  mimeType: string,
  config: R2Config
): Promise<void> {
  const client = getR2Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: storageKey,
      Body: buffer instanceof Buffer ? new Uint8Array(buffer) : buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    })
  );
}

/**
 * Deletes a file and its variants from R2.
 *
 * @param storageKey - Storage key of the original file
 * @param config - R2 configuration
 * @param includeVariants - Whether to also delete variant files
 */
export async function deleteFileFromR2(
  storageKey: string,
  config: R2Config,
  includeVariants: boolean = true
): Promise<void> {
  const client = getR2Client(config);
  const keysToDelete: string[] = [storageKey];

  if (includeVariants) {
    const variants: VariantType[] = ['thumb', 'medium', 'large'];
    for (const variant of variants) {
      keysToDelete.push(getVariantKey(storageKey, variant));
    }
  }

  // Use batch delete for efficiency
  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucketName,
      Delete: {
        Objects: keysToDelete.map((key) => ({ Key: key })),
        Quiet: true,
      },
    })
  );
}

/**
 * Checks if a file exists in R2.
 *
 * @param storageKey - Storage key to check
 * @param config - R2 configuration
 * @returns true if file exists
 */
export async function fileExistsInR2(storageKey: string, config: R2Config): Promise<boolean> {
  const client = getR2Client(config);

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the public URL for a storage key.
 *
 * @param storageKey - Storage key
 * @param config - R2 configuration
 * @returns Public URL
 */
export function getR2PublicUrl(storageKey: string, config: R2Config): string {
  return `${config.publicUrl}/${storageKey}`;
}
