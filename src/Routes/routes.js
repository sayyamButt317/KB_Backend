import express from "express";
import { TextToSpeech } from "../controllers/Voice/tts.controller.js";
import { UploadFile } from "../controllers/Embedding/File/upload-file.controller.js";
import { upload } from "../Config/multer.config.js";
import CreateVectorEmbedding from "../controllers/Embedding/File/vector-embedding.controller.js";
import { UploadFolder } from "../controllers/Embedding/Folder/upload-folder.queue.js";
import { GetAllDocs } from "../controllers/collection/doc.controller.js";
import {
  registerController,
  loginController,
  verifyEmailController,
} from "../controllers/user/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import superadminRoutes from "./superadmin.routes.js";

const router = express.Router();

// Public auth routes
router.post("/auth/register", registerController);
router.post("/auth/login", loginController);
router.post("/auth/verify-email", verifyEmailController);

// Superadmin (JWT + role superadmin)
router.use("/superadmin", superadminRoutes);

// Everything below requires JWT; companyId always from req.user
router.use(authMiddleware);

router.post("/upload/file", upload.single("file"), UploadFile);
router.post("/upload/folder", upload.array("files", 100), UploadFolder);
router.get("/chat", CreateVectorEmbedding);
router.get("/collections", GetAllDocs);
router.post("/text", TextToSpeech);

export default router;
