import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import embeddings from "./src/Config/embedding.config.js";
import loadFile from "./src/services/loadfile.service.js";
import loadFolder from "./src/services/loadfolder.service.js";
import {
  tenantCollectionName,
  withCompanyMetadata,
} from "./src/Utils/tenant.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log(`🚀 Processing job: ${job.id}`);
      const { folderPath, path, isFolder, companyId } = job.data;

      if (!companyId) {
        throw new Error("Job missing companyId — cannot embed without tenant");
      }

      let docs = [];
      if (isFolder) {
        docs = await loadFolder(folderPath);
      } else {
        console.log(`📄 Loading single file: ${path}`);
        docs = await loadFile(path);
      }

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: tenantCollectionName(),
        }
      );

      const textSplitter = new CharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await textSplitter.splitDocuments(docs);
      const tenantDocs = withCompanyMetadata(splitDocs, companyId);
      console.log(
        `✂️ Split into ${tenantDocs.length} chunks for company ${companyId}`
      );

      const result = await vectorStore.addDocuments(tenantDocs);
      console.log(`✅ Vectorization complete`);

      return {
        success: true,
        message: "Vectorization complete",
        jobId: job.id,
        result: result,
        status: "completed",
        companyId: String(companyId),
      };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      return {
        success: false,
        message: "Vectorization failed",
        status: "failed",
        error: error.message,
      };
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    },
  }
);
