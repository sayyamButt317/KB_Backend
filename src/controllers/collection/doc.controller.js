import path from "path";
import { pipeline } from "stream/promises";
import {
  listDocumentsByCompany,
  getDocumentByCompany,
  getDocumentFileForCompany,
  softDeleteDocument,
} from "../../services/document.service.js";
import { deleteS3Object } from "../../services/s3.service.js";
import DocumentModel from "../../Model/Document.Model.js";

export async function ListDocuments(req, res) {
  try {
    const result = await listDocumentsByCompany({
      companyId: req.user.companyId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });

    if (result.invalidStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use pending, processing, ready, or failed.",
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("ListDocuments error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

export async function GetDocument(req, res) {
  try {
    const document = await getDocumentByCompany(
      req.params.id,
      req.user.companyId
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    return res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("GetDocument error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

export async function ViewDocumentFile(req, res) {
  try {
    const result = await getDocumentFileForCompany(
      req.params.id,
      req.user.companyId
    );

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (result.invalidPath || result.fileMissing) {
      return res.status(404).json({
        success: false,
        message: "File not available",
      });
    }

    const { document } = result;
    const download = req.query.download === "true";
    const disposition = download ? "attachment" : "inline";
    const safeFilename = document.filename.replace(/["\r\n]/g, "_");

    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeFilename}"`
    );

    if (result.source === "s3" && result.stream) {
      await pipeline(result.stream, res);
      return;
    }

    return res.sendFile(path.resolve(document.path));
  } catch (error) {
    console.error("ViewDocumentFile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

export async function DeleteDocument(req, res) {
  try {
    const existing = await DocumentModel.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      deletedAt: null,
    }).select("+s3Key storage");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (existing.storage === "s3" && existing.s3Key) {
      await deleteS3Object(existing.s3Key);
    }

    const document = await softDeleteDocument(
      req.params.id,
      req.user.companyId
    );

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      document,
    });
  } catch (error) {
    console.error("DeleteDocument error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
