import BullQueue from "../../../Config/BullQueue.js";
import DocumentModel from "../../../Model/Document.Model.js";
import { emitDocumentStatus } from "../../../Config/webSocket.js";

export async function UploadFolder(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No folder uploaded" });
    }

    const companyId = req.user.companyId;
    const userId = req.user.id;

    const documents = await Promise.all(
      req.files.map((file) =>
        DocumentModel.create({
          companyId,
          userId,
          filename: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          status: "pending",
        })
      )
    );

    const job = await BullQueue.add("folder-ready", {
      folderPath: req.files[0].destination,
      folderName: req.files.map((file) => file.originalname),
      isFolder: true,
      companyId,
      userId,
      documents: documents.map((doc) => ({
        documentId: String(doc._id),
        path: doc.path,
        filename: doc.filename,
      })),
    });

    await DocumentModel.updateMany(
      { _id: { $in: documents.map((d) => d._id) } },
      { jobId: String(job.id), status: "pending" }
    );

    emitDocumentStatus({
      jobId: String(job.id),
      documentIds: documents.map((d) => String(d._id)),
      companyId,
      status: "pending",
      progress: 0,
      message: "Folder uploaded, waiting for worker",
    });

    return res.json({
      message: "Folder uploaded successfully",
      jobId: job.id,
      documentIds: documents.map((d) => d._id),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
