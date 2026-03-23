import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET ?? "gatectr";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g. https://cdn.gatectr.com

export const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 120 }); // 2 min
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Extract the R2 key from a public URL (returns null if not a R2 URL) */
export function keyFromPublicUrl(url: string): string | null {
  if (!url || !R2_PUBLIC_URL) return null;
  if (!url.startsWith(R2_PUBLIC_URL)) return null;
  return url.slice(R2_PUBLIC_URL.length + 1); // strip leading slash
}
