import { NotionLoader } from "@langchain/community/document_loaders/fs/notion";

async function NotionFolderEmbedding(req, res) {
  const userQuery = req.query.message;

  if (!userQuery) {
    return res.status(400).json({ error: "Query message is required" });
  }
  console.log("🔍 Searching in Notion collection: Document-Embedding");
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: "Notion-Document-Embedding",
    }
  );
  const ret = vectorStore.asRetriever({ k: 2 });
  const result = await ret.invoke(userQuery);
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
  });
}

export default NotionFolderEmbedding;
