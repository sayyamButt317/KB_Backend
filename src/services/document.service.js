import DocumentModel from "../Model/Document.Model.js";

const DOCUMENT_STATUSES = ["pending", "processing", "ready", "failed"];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function toDocumentResponse(document) {
  if (!document) return null;

  return {
    id: document._id,
    companyId: document.companyId,
    userId: document.userId,
    filename: document.filename,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    jobId: document.jobId,
    chunkCount: document.chunkCount ?? 0,
    error: document.meta?.error ?? null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function listDocumentsByCompany({
  companyId,
  status,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}) {
  const safePage = Math.max(Number(page) || DEFAULT_PAGE, 1);
  const safeLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (safePage - 1) * safeLimit;

  const query = {
    companyId,
    deletedAt: null,
  };

  if (status) {
    if (!DOCUMENT_STATUSES.includes(status)) {
      return { invalidStatus: true };
    }
    query.status = status;
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    DocumentModel.countDocuments(query),
  ]);

  return {
    companyId,
    page: safePage,
    limit: safeLimit,
    total,
    count: documents.length,
    documents: documents.map(toDocumentResponse),
  };
}

export async function getDocumentByCompany(documentId, companyId) {
  const document = await DocumentModel.findOne({
    _id: documentId,
    companyId,
    deletedAt: null,
  }).lean();

  if (!document) return null;
  return toDocumentResponse(document);
}

export async function markDocumentProcessing(documentId) {
  return DocumentModel.findByIdAndUpdate(
    documentId,
    { status: "processing" },
    { new: true }
  );
}

export async function markDocumentReady(documentId, chunkCount) {
  return DocumentModel.findByIdAndUpdate(
    documentId,
    {
      status: "ready",
      chunkCount,
    },
    { new: true }
  );
}

export async function markDocumentsFailed(documentIds, errorMessage) {
  if (!documentIds.length) return;

  await DocumentModel.updateMany(
    { _id: { $in: documentIds } },
    {
      status: "failed",
      chunkCount: 0,
      "meta.error": errorMessage,
    }
  );
}


export async function deleteDocumentByDocumentId(documentId) {
  return DocumentModel.findByIdAndDelete(documentId).lean();
}
