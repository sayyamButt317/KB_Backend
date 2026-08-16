import BullQueue from "../../../Config/BullQueue.js";


export async function UploadFolder(req,res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No folder uploaded" });
    }

    const job = await BullQueue.add("folder-ready", {
        folderPath: req.files[0].destination,
      folderName: req.files.map((file) => file.originalname),
      isFolder: true,
    });

    return res.json({ message: "Folder uploaded successfully", jobId: job.id });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
