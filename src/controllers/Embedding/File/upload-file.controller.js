import BullQueue from "../../../Config/BullQueue.js";
import DocumentModel from "../../../Model/Document.Model.js";
import { emitDocumentStatus } from "../../../Config/webSocket.js";

export async function UploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const companyId = req.user.companyId;
    const userId = req.user.id;

    const document = await DocumentModel.create({
      companyId,
      userId,
      filename: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "pending",
    });

    const job = await BullQueue.add("file-ready", {
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
      isFolder: false,
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
      message: "File uploaded, waiting for worker",
      filename: req.file.originalname,
    });

    return res.json({
      message: "File uploaded successfully",
      jobId: job.id,
      documentId: document._id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
