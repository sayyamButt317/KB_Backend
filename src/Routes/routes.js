import express from "express";
import { TextToSpeech } from "../controllers/Voice/tts.controller.js";
import { UploadFile } from "../controllers/Embedding/File/upload-file.controller.js";
import { upload } from "../Config/multer.config.js";
import { UploadFolder } from "../controllers/Embedding/Folder/upload-folder.queue.js";
import { ListDocuments, GetDocumentByCompanyId, DeleteDocumentByDocumentId } from "../controllers/collection/doc.controller.js";
import {
  CreateConversation,
  ListConversations,
  GetConversation,
  SendMessage,
  DeleteConversation,
} from "../controllers/Company/chat/chat.controller.js";
import {
  registerController,
  loginController,
  verifyEmailController,
} from "../controllers/user/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import superadminRoutes from "./superadmin.routes.js";

const router = express.Router();

router.post("/auth/register", registerController);
router.post("/auth/login", loginController);
router.post("/auth/verify-email", verifyEmailController);

router.use("/superadmin", superadminRoutes);
router.use(authMiddleware);

router.post("/upload/file", upload.single("file"), UploadFile);
router.post("/upload/folder", upload.array("files", 100), UploadFolder);

router.post("/conversations", CreateConversation);
router.get("/conversations", ListConversations);
router.get("/conversations/:id", GetConversation);

router.post("/conversations/:id/messages", SendMessage);
router.delete("/delete/conversations/:id", DeleteConversation);

router.get("/documents", ListDocuments);
router.get("/documents/:id", GetDocumentByCompanyId);
router.delete("/delete/documents/:id", DeleteDocumentByDocumentId);

router.post("/text-to-speech", TextToSpeech);

export default router;
