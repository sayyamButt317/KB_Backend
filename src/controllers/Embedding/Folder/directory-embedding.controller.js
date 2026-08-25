import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../../../Config/embedding.config.js";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { JSONLinesLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import client from "../../../Config/ai.config.js";
import AI_PROMPT from "../../../Utils/Prompt.js";
import {
  tenantCollectionName,
  companyFilter,
  withCompanyMetadata,
} from "../../../Utils/tenant.js";

export default async function DirectoryEmbedding(req, res) {
  try {
    const folderPath = req.query.folderPath;
    const userQuery = req.query.userQuery || req.query.message;
    const companyId = req.user.companyId;

    if (!folderPath) {
      return res.status(400).json({ error: "❌ Folder path is required" });
    }
    if (!userQuery) {
      return res.status(400).json({ error: "❌ userQuery is required" });
    }

    const loader = new DirectoryLoader(folderPath, {
      ".pdf": (path) => new PDFLoader(path, { parsedItemSeparator: "" }),
      ".json": (path) => new JSONLoader(path, "/texts"),
      ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
      ".txt": (path) => new TextLoader(path),
      ".csv": (path) => new CSVLoader(path, "text"),
      ".docx": (path) => new DocxLoader(path, "text"),
    });

    const docs = await loader.load();
    console.log(`📄 Loaded ${docs.length} docs from: ${folderPath}`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    const tenantDocs = withCompanyMetadata(splitDocs, companyId);
    console.log(`✂️ Split into ${tenantDocs.length} chunks`);

    const vectorStore = await QdrantVectorStore.fromDocuments(
      tenantDocs,
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: tenantCollectionName(),
      }
    );

    const result = await vectorStore.similaritySearch(
      userQuery,
      2,
      companyFilter(companyId)
    );

    const SYSTEM_PROMPT = AI_PROMPT + JSON.stringify(result);
    const chatResult = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery },
      ],
    });
    return res.json({
      message: chatResult.choices[0].message.content,
      docs: result,
      status: "completed",
    });
  } catch (err) {
    console.error("❌ Error in DirectoryEmbedding:", err);
    return res.status(500).json({ error: err.message, status: "failed" });
  }
}
