import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../../Config/embedding.config.js";

export async function GetAllDocs(req, res) {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY,
            collectionName: "Document-Embedding",
        }
    )
    const collections = await vectorStore.getCollections()
    res.status(200).json(collections)
}