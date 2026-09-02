import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  getS3Client,
  getS3BucketName,
  getS3UploadPrefix,
  isS3Configured,
} from "../Config/s3.config.js";

function sanitizeFilename(name) {
  return String(name).replace(/[^\w\s.-]/g, "_").replace(/\s+/g, "_");
}

export function buildS3ObjectKey({ companyId, originalName, folderBatchId }) {
  const prefix = getS3UploadPrefix();
  const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeFilename(originalName)}`;
  const companyPart = String(companyId);

  if (folderBatchId) {
    return `${prefix}/${companyPart}/folder/${folderBatchId}/${safeName}`;
  }

  return `${prefix}/${companyPart}/${safeName}`;
}

export async function uploadBufferToS3({ key, body, contentType }) {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    })
  );
  return key;
}

export async function storeMulterFileToS3({ file, companyId, folderBatchId }) {
  const key = buildS3ObjectKey({
    companyId,
    originalName: file.originalname,
    folderBatchId,
  });

  const body = fs.readFileSync(file.path);
  await uploadBufferToS3({
    key,
    body,
    contentType: file.mimetype,
  });

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  return {
    storage: "s3",
    s3Key: key,
    path: null,
  };
}

export async function getS3ObjectStream(s3Key) {
  const client = getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getS3BucketName(),
      Key: s3Key,
    })
  );

  if (!response.Body) {
    throw new Error("S3 object body is empty");
  }

  return response.Body;
}

export async function downloadS3ObjectToTempFile(s3Key, filename) {
  const ext = path.extname(filename || s3Key) || "";
  const tempPath = path.join(
    os.tmpdir(),
    `kb-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  );

  const stream = await getS3ObjectStream(s3Key);
  await pipeline(stream, fs.createWriteStream(tempPath));
  return tempPath;
}

export async function deleteS3Object(s3Key) {
  if (!s3Key || !isS3Configured()) return;

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getS3BucketName(),
      Key: s3Key,
    })
  );
}

export { isS3Configured };
