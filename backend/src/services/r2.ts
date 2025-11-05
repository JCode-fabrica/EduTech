import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { ENV } from '../env';

let s3Client: S3Client | null = null;

function requireR2Env() {
  const missing: string[] = [];
  if (!ENV.R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!ENV.R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!ENV.R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  if (!ENV.R2_BUCKET) missing.push('R2_BUCKET');
  if (missing.length) {
    throw new Error(`R2 env not configured: ${missing.join(', ')}`);
  }
}

function getClient(): S3Client {
  if (!s3Client) {
    requireR2Env();
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      // Cloudflare R2 requires path-style addressing with AWS SDK v3
      forcePathStyle: true,
      credentials: {
        accessKeyId: ENV.R2_ACCESS_KEY_ID!,
        secretAccessKey: ENV.R2_SECRET_ACCESS_KEY!
      }
    });
  }
  return s3Client;
}

function sanitizeFilename(name: string) {
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const parts = clean.split('.');
  if (parts.length > 1 && parts[parts.length - 1].length > 8) {
    parts[parts.length - 1] = parts[parts.length - 1].slice(0, 8);
  }
  return parts.join('.');
}

function buildKey(escolaId: string, provaId: string, filename?: string) {
  const base = `escola/${escolaId}/prova/${provaId}`;
  const fname = filename ? sanitizeFilename(filename) : randomUUID();
  return `${base}/${Date.now()}_${fname}`;
}

export function publicUrlForKey(key: string) {
  if (ENV.R2_PUBLIC_BASE_URL) return `${ENV.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  return `https://${ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${ENV.R2_BUCKET}/${key}`;
}

export async function uploadToR2(
  data: Buffer,
  contentType: string,
  opts: { escolaId: string; provaId: string; filename?: string }
) {
  requireR2Env();
  const client = getClient();
  const key = buildKey(opts.escolaId, opts.provaId, opts.filename);
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.R2_BUCKET!,
      Key: key,
      Body: data,
      ContentType: contentType,
      ContentDisposition: `inline; filename="${opts.filename || 'file'}"`
    })
  );
  return { key, url: publicUrlForKey(key) };
}

export async function deleteFromR2(key: string) {
  requireR2Env();
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: ENV.R2_BUCKET!, Key: key }));
}
