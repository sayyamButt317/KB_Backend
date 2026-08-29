export const TENANT_COLLECTION = "Document-Embedding";

export function tenantCollectionName() {
  return TENANT_COLLECTION;
}

/** Qdrant filter: only points for this company */
export function companyFilter(companyId) {
  const id = String(companyId);
  return {
    must: [
      {
        key: "metadata.companyId",
        match: { value: id },
      },
    ],
  };
}

/** Stamp tenant + document metadata onto LangChain chunks before Qdrant upsert */
export function withChunkMetadata(docs, { companyId, documentId, filename }) {
  const cid = String(companyId);
  const did = String(documentId);

  return docs.map((doc, index) => {
    doc.metadata = {
      ...(doc.metadata || {}),
      companyId: cid,
      documentId: did,
      chunkId: `${did}_${index}`,
      pageNumber: doc.metadata?.loc?.pageNumber ?? doc.metadata?.page ?? null,
      filename: filename || doc.metadata?.source || null,
    };
    return doc;
  });
}

export function withCompanyMetadata(docs, companyId) {
  return withChunkMetadata(docs, { companyId, documentId: "legacy", filename: null });
}

export function companyUploadRoot(companyId) {
  return String(companyId);
}
