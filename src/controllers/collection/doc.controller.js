import { QdrantClient } from "@qdrant/js-client-rest";
import {
  tenantCollectionName,
  companyFilter,
} from "../../Utils/tenant.js";

export async function GetAllDocs(req, res) {
  try {
    const companyId = req.user.companyId;
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collectionName = tenantCollectionName();
    const filter = companyFilter(companyId);

    const scrolled = await client.scroll(collectionName, {
      filter,
      limit: 100,
      with_payload: true,
      with_vector: false,
    });

    const points = (scrolled.points || []).map((p) => ({
      id: p.id,
      metadata: p.payload?.metadata || p.payload || {},
      pageContent: p.payload?.pageContent || p.payload?.content || null,
    }));

    return res.status(200).json({
      success: true,
      companyId,
      collection: collectionName,
      count: points.length,
      documents: points,
    });
  } catch (error) {
    console.error("❌ Error listing docs:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
