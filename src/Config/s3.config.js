import { S3Client } from "@aws-sdk/client-s3";

export function isS3Configured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.S3_BUCKET_NAME
  );
}

export function getS3BucketName() {
  return process.env.S3_BUCKET_NAME;
}

export function getS3UploadPrefix() {
  return (process.env.S3_UPLOAD_PREFIX || "files").replace(/^\/+|\/+$/g, "");
}

let s3Client;

export function getS3Client() {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured. Set AWS credentials and S3_BUCKET_NAME.");
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  return s3Client;
}
