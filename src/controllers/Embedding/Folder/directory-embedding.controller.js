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

export default async function DirectoryEmbedding(req, res) {
  try {
    const folderPath = req.query.folderPath;
    const userQuery = req.query.userQuery;

    if (!folderPath) {
      return res.status(400).json({ error: "❌ Folder path is required" });
    }
    if (!userQuery) {
      return res.status(400).json({ error: "❌ userQuery is required" });
    }

    //  Load ALL files from directory (auto-handles each extension)
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

    // Split into smaller chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`✂️ Split into ${splitDocs.length} chunks`);

    // Store embeddings in Qdrant
    const vectorStore = await QdrantVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        vectors: { size: 768, distance: "Cosine" },
        optimizers_config: { default_segment_number: 16, max_segment_size: 5000000 },
      },
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: "Document-Embedding",
      }
    );

    // Retrieve top results for query
    const retriever = vectorStore.asRetriever({ k: 2 });
    const result = await retriever.invoke(userQuery);

    // Pass retrieved docs to GPT
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
