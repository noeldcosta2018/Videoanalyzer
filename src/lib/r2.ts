import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _r2: S3Client | null = null;

function getR2() {
  if (!_r2) {
    _r2 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _r2;
}

export async function getPresignedUploadUrl(key: string, mimeType: string): Promise<string> {
  return getSignedUrl(
    getR2(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: mimeType,
    }),
    { expiresIn: 3600 }
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  await getR2().send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }));
}

export async function getR2DownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    getR2(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
    { expiresIn: 900 }
  );
}
