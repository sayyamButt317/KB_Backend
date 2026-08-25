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

/** Stamp companyId onto LangChain document metadata before upsert */
export function withCompanyMetadata(docs, companyId) {
  const id = String(companyId);
  return docs.map((doc) => {
    doc.metadata = {
      ...(doc.metadata || {}),
      companyId: id,
    };
    return doc;
  });
}

export function companyUploadRoot(companyId) {
  return String(companyId);
}
