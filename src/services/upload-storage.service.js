import fs from "fs";
import path from "path";
import { isS3Configured } from "../Config/s3.config.js";
import { storeMulterFileToS3 } from "./s3.service.js";

export async function persistUploadedFile({ file, companyId, folderBatchId = null }) {
  if (isS3Configured()) {
    return storeMulterFileToS3({ file, companyId, folderBatchId });
  }

  return {
    storage: "local",
    s3Key: null,
    path: file.path,
  };
}

export async function persistUploadedFiles({ files, companyId }) {
  const folderBatchId = String(Date.now());
  const results = [];

  for (const file of files) {
    results.push(
      await persistUploadedFile({
        file,
        companyId,
        folderBatchId: files.length > 1 ? folderBatchId : null,
      })
    );
  }

  return results;
}
