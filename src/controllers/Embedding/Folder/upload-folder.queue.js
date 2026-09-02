import BullQueue from "../../../Config/BullQueue.js";
import DocumentModel from "../../../Model/Document.Model.js";
import { emitDocumentStatus } from "../../../Config/webSocket.js";
import { persistUploadedFiles } from "../../../services/upload-storage.service.js";

export async function UploadFolder(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No folder uploaded" });
    }

    const companyId = req.user.companyId;
    const userId = req.user.id;
    const storedFiles = await persistUploadedFiles({ files: req.files, companyId });

    const documents = await Promise.all(
      req.files.map((file, index) => {
        const stored = storedFiles[index];
        return DocumentModel.create({
          companyId,
          userId,
          filename: file.originalname,
          path: stored.path,
          s3Key: stored.s3Key,
          storage: stored.storage,
          mimeType: file.mimetype,
          size: file.size,
          status: "pending",
        });
      })
    );

    const job = await BullQueue.add("folder-ready", {
      folderName: req.files.map((file) => file.originalname),
      isFolder: true,
      companyId,
      userId,
      documents: documents.map((doc, index) => ({
        documentId: String(doc._id),
        path: storedFiles[index].path,
        s3Key: storedFiles[index].s3Key,
        storage: storedFiles[index].storage,
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
      storage: storedFiles[0]?.storage || "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
