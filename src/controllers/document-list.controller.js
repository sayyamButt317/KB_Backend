import { embeddings } from "../services/embedding.service.js";
import { QdrantClient } from "@qdrant/js-client-rest";

export default async function DocumentList(req, res) {
    const result = await scroll("Document-Embedding", {
        with_payload: true,
        with_vectors: false,
        limit: 100 
      });
      res.json(result.points.map(p => p.payload));
}
