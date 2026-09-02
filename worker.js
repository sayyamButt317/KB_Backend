import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import embeddings from "./src/Config/embedding.config.js";
import { loadDocumentFile } from "./src/services/loadfile.service.js";
import {
  markDocumentProcessing,
  markDocumentReady,
  markDocumentsFailed,
} from "./src/services/document.service.js";
import { connectionDB } from "./src/db/connection.js";
import {
  tenantCollectionName,
  withChunkMetadata,
} from "./src/Utils/tenant.js";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config({ path: "./.env" });

const VECTORIZATION_STEPS = [
  "Job started",
  "Loading file",
  "Splitting document",
  "Creating embeddings",
  "Finalizing",
  "Complete",
];

function logVectorizationStep(job, data) {
  const stepIndex = VECTORIZATION_STEPS.indexOf(data.message);
  const stepLabel =
    stepIndex >= 0
      ? `Step ${stepIndex + 1}/${VECTORIZATION_STEPS.length}`
      : "Step";
  const parts = [
    chalk.cyan(`[Job ${job.id}]`),
    chalk.yellow(`${stepLabel} (${data.progress}%)`),
    data.message,
  ];

  if (data.filename) parts.push(chalk.gray(`file: ${data.filename}`));
  if (data.documentId) parts.push(chalk.gray(`doc: ${data.documentId}`));

  console.log(parts.join(" | "));
}

async function reportProgress(job, data) {
  logVectorizationStep(job, data);
  await job.updateProgress({
    progress: data.progress,
    status: data.status,
    message: data.message,
    documentId: data.documentId ?? null,
    companyId: data.companyId ?? null,
    filename: data.filename ?? null,
  });
}

async function embedDocument({
  job,
  documentId,
  path,
  s3Key,
  storage,
  filename,
  companyId,
}) {
  await markDocumentProcessing(documentId);
  await reportProgress(job, {
    progress: 25,
    status: "processing",
    message: "Loading file",
    documentId,
    companyId,
    filename,
  });

  const docs = await loadDocumentFile({ path, s3Key, storage, filename });
  console.log(
    chalk.blue(
      `[Job ${job.id}] Loaded ${docs.length} section(s) from ${filename || path}`
    )
  );

  await reportProgress(job, {
    progress: 45,
    status: "processing",
    message: "Splitting document",
    documentId,
    companyId,
    filename,
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: tenantCollectionName(companyId),
    }
  );

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 4000,
    chunkOverlap: 500,
    separators: [
      "\n\n",
      "\n",
      ". ",
      "? ",
      "! ",
      " ",
      ""
    ],
  });
  const splitDocs = await textSplitter.splitDocuments(docs);
  const tenantDocs = withChunkMetadata(splitDocs, {
    companyId,
    documentId,
    filename,
  });
  console.log(
    chalk.blue(
      `[Job ${job.id}] Split into ${tenantDocs.length} chunk(s) for ${filename || path}`
    )
  );

  await reportProgress(job, {
    progress: 70,
    status: "processing",
    message: "Creating embeddings",
    documentId,
    companyId,
    filename,
  });
  const batchSize = 20;
  for (let i = 0; i < tenantDocs.length; i += batchSize) {
    const batch = tenantDocs.slice(i, i + batchSize);
    await vectorStore.addDocuments(batch);
  }
  console.log(
    chalk.green(
      `[Job ${job.id}] Stored ${tenantDocs.length} embedding(s) in Qdrant for ${filename || path}`
    )
  );

  await markDocumentReady(documentId, tenantDocs.length);

  await reportProgress(job, {
    progress: 95,
    status: "processing",
    message: "Finalizing",
    documentId,
    companyId,
    filename,
  });

  return tenantDocs.length;
}

async function startWorker() {
  await connectionDB();

  const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log(`🚀 Processing job: ${job.id}`);
      const { path, isFolder, companyId, documentId, documents, filename, s3Key, storage } =
        job.data;

      if (!companyId) {
        throw new Error("Job missing companyId — cannot embed without tenant");
      }

      await reportProgress(job, {
        progress: 10,
        status: "processing",
        message: "Job started",
        companyId,
        documentId,
        filename,
      });

      let totalChunks = 0;

      if (isFolder && Array.isArray(documents) && documents.length > 0) {
        const step = 80 / documents.length;
        for (let i = 0; i < documents.length; i++) {
          const doc = documents[i];
          console.log(`📄 Processing file: ${doc.filename}`);
          const chunks = await embedDocument({
            job,
            documentId: doc.documentId,
            path: doc.path,
            s3Key: doc.s3Key,
            storage: doc.storage,
            filename: doc.filename,
            companyId,
          });
          totalChunks += chunks;
          await reportProgress(job, {
            progress: Math.min(95, 15 + step * (i + 1)),
            status: "processing",
            message: `Processed ${i + 1}/${documents.length} files`,
            documentId: doc.documentId,
            companyId,
            filename: doc.filename,
          });
        }
      } else {
        if (!documentId || (!path && !s3Key)) {
          throw new Error("Job missing documentId or file location");
        }
        totalChunks = await embedDocument({
          job,
          documentId,
          path,
          s3Key,
          storage,
          filename: job.data.filename,
          companyId,
        });
      }

      await reportProgress(job, {
        progress: 100,
        status: "completed",
        message: "Complete",
        companyId,
        documentId,
        filename,
      });

      console.log(`✅ Vectorization complete (${totalChunks} chunks)`);

      return {
        success: true,
        message: "Vectorization complete",
        jobId: job.id,
        status: "completed",
        companyId: String(companyId),
        documentId: documentId ? String(documentId) : null,
        documentIds:
          documents?.map((d) => d.documentId) ||
          (documentId ? [documentId] : []),
        chunks: totalChunks,
      };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      const { documentId, documents, companyId } = job.data;
      const ids =
        documents?.map((d) => d.documentId) ||
        (documentId ? [documentId] : []);
      if (ids.length) {
        await markDocumentsFailed(ids, error.message);
      }

      await reportProgress(job, {
        progress: 100,
        status: "failed",
        message: "Vectorization failed",
        companyId,
        documentId,
        error: error.message,
      });

      return {
        success: false,
        message: "Vectorization failed",
        status: "failed",
        error: error.message,
        companyId: companyId ? String(companyId) : null,
        documentId: documentId ? String(documentId) : null,
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

  console.log(chalk.bgGreen("Worker connected and listening on file-upload-queue"));
  return worker;
}

startWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
