import {
  listDocumentsByCompany,
  getDocumentByCompany,
  deleteDocumentByDocumentId,
} from "../../services/document.service.js";

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

export async function GetDocumentByCompanyId(req, res) {
  try {
    const document = await getDocumentByCompany(
      req.params.id,
      req.query.companyId
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

export async function DeleteDocumentByDocumentId(req, res) {
  try {
    const document = await deleteDocumentByDocumentId(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }
    await deleteDocument(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("DeleteDocumentByCompanyId error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
