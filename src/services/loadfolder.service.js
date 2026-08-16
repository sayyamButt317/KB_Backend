import fs from "fs/promises";
import path from "path";
import loadFile from "./loadfile.service.js";

export default async function loadFolder(folderPath) {
  try {
    console.log("📄 Start Processing folder:");
    const allDocs = [];
    const files = await fs.readdir(folderPath, { recursive: true });
    for (const filename of files) {
      const fullPath = path.join(folderPath, filename);
      const stats = await fs.stat(fullPath);
      if (stats.isFile()) {
        console.log("📄 Processing file:", fullPath);
        const fileDocs = await loadFile(fullPath);
        allDocs.push(...fileDocs);
      }
    }
    return allDocs;
  } catch (error) {
    console.error(`Error loading folder: ${error}`);
    throw new Error(`Error loading folder: ${error}`);
  }
}
