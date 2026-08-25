import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../../../Config/embedding.config.js";
import client from "../../../Config/ai.config.js";
import AI_PROMPT from "../../../Utils/Prompt.js";
import {
  tenantCollectionName,
  companyFilter,
} from "../../../Utils/tenant.js";

export default async function CreateVectorEmbedding(req, res) {
  try {
    const userQuery = req.query.message;
    if (!userQuery) {
      return res.status(400).json({ error: "Query message is required" });
    }

    const companyId = req.user.companyId;
    console.log(
      `🔍 Searching collection ${tenantCollectionName()} for company ${companyId}`
    );

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: tenantCollectionName(),
      }
    );

    const filter = companyFilter(companyId);
    const result = await vectorStore.similaritySearch(userQuery, 2, filter);

    const SYSTEM_PROMPT = `${AI_PROMPT}\n\nRelevant Documents:\n${JSON.stringify(result, null, 2)}`;
    const chatResult = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery },
      ],
    });

    return res.json({
      success: true,
      message: chatResult.choices[0].message.content,
      docs: result,
      status: "completed",
    });
  } catch (error) {
    console.error("❌ Error in CreateVectorEmbedding:", error);
    return res.status(500).json({
      success: false,
      status: "failed",
      error: error.message || "Internal server error",
    });
  }
}
