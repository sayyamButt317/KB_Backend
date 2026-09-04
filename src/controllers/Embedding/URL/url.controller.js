import BullQueue from "../../../Config/BullQueue.js";
import DocumentModel from "../../../Model/Document.Model.js";
import { emitDocumentStatus } from "../../../Config/webSocket.js";

function extractGoogleDocId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];
  const fallback = url.match(/[-\w]{25,}/);
  return fallback ? fallback[0] : null;
}

function buildFilename(documentId, url) {
  return `Google Doc ${documentId}`;
}

/**
 * Public / shared Google Docs can be exported as plain text.
 * Private docs will fail here until OAuth is added.
 */
async function fetchGoogleDocText(documentId) {
  const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
  const response = await fetch(exportUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "KB-Backend/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch Google Doc (${response.status}). Make sure the doc is shared publicly or with anyone who has the link.`
    );
  }

  const text = await response.text();
  if (!text?.trim()) {
    throw new Error("Google Doc exported empty content");
  }

  return text;
}

export async function UploadURL(req, res) {
  try {
    const url = req.body?.url?.trim();
    if (!url) {
      return res.status(400).json({ success: false, error: "url is required" });
    }

    const googleDocId = extractGoogleDocId(url);
    if (!googleDocId) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google Doc URL",
      });
    }

    const companyId = req.user.companyId;
    const userId = req.user.id;
    const filename = buildFilename(googleDocId, url);

    // Verify we can read the doc before creating the DB record
    let content;
    try {
      content = await fetchGoogleDocText(googleDocId);
    } catch (fetchError) {
      return res.status(400).json({
        success: false,
        error: fetchError.message,
      });
    }

    const document = await DocumentModel.create({
      companyId,
      userId,
      filename,
      sourceType: "google_doc",
      sourceUrl: url,
      externalId: googleDocId,
      mimeType: "text/plain",
      size: Buffer.byteLength(content, "utf8"),
      storage: "local",
      status: "pending",
      meta: {
        contentPreview: content.slice(0, 500),
      },
    });

    const job = await BullQueue.add("url-ready", {
      isUrl: true,
      sourceType: "google_doc",
      sourceUrl: url,
      externalId: googleDocId,
      content,
      filename,
      companyId,
      userId,
      documentId: String(document._id),
    });

    document.jobId = String(job.id);
    await document.save();

    emitDocumentStatus({
      jobId: String(job.id),
      documentId: String(document._id),
      companyId,
      status: "pending",
      progress: 0,
      message: "Google Doc queued for embedding",
      filename,
    });

    return res.status(201).json({
      success: true,
      message: "Google Doc uploaded successfully",
      jobId: job.id,
      documentId: document._id,
      sourceType: "google_doc",
    });
  } catch (error) {
    console.error("UploadURL error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
