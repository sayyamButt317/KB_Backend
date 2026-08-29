import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "../Config/embedding.config.js";
import client from "../Config/ai.config.js";
import AI_PROMPT from "../Utils/Prompt.js";
import { tenantCollectionName, companyFilter } from "../Utils/tenant.js";
import { getRagCache, setRagCache } from "./cache.service.js";

const DEFAULT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

function mapChunkToSource(doc, score = null) {
  const meta = doc.metadata || {};
  return {
    documentId: meta.documentId || null,
    chunkId: meta.chunkId || null,
    score: score ?? doc.score ?? 0,
    pageNumber: meta.pageNumber ?? null,
    content: doc.pageContent,
    filename: meta.filename || meta.source || null,
    metadata: meta,
  };
}

export async function runRagQuery({ companyId, query, useCache = true }) {
  if (useCache) {
    const cached = await getRagCache(companyId, query);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: tenantCollectionName(),
    }
  );

  const filter = companyFilter(companyId);
  const chunks = await vectorStore.similaritySearch(query, 4, filter);
  const sources = chunks.map((doc) => mapChunkToSource(doc));

  const SYSTEM_PROMPT = `${AI_PROMPT}\n\nRelevant Documents:\n${JSON.stringify(chunks, null, 2)}`;
  const started = Date.now();
  const chatResult = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
  });

  const content = chatResult.choices[0].message.content;
  const usage = chatResult.usage || {};

  const result = {
    content,
    model: DEFAULT_MODEL,
    sources,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    responseTimeMs: Date.now() - started,
    fromCache: false,
  };

  await setRagCache(companyId, query, result);
  return result;
}
